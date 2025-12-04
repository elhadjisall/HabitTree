from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.db import transaction
from .models import Habit, HabitLog, Reward, UserReward, Friend
from .serializers import (
    UserSerializer, UserRegistrationSerializer, HabitSerializer, HabitCreateSerializer,
    HabitStatsSerializer, HabitLogSerializer, HabitCompletionSerializer,
    RewardSerializer, UserRewardSerializer, FriendSerializer, UserSearchSerializer
)
from .algorithms.habit_completion import (
    mark_habit_complete, mark_habit_incomplete,
    can_complete_habit, get_completion_stats, get_today_completion
)
from .algorithms.streak_calculator import update_streak

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Allow registration without authentication"""
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        """Use registration serializer for create action"""
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Get or update current user profile"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        else:
            # Update user profile
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics"""
        habits = Habit.objects.filter(user=request.user, is_active=True)
        
        total_habits = habits.count()
        total_completed = 0
        total_completions = 0
        total_streak = 0
        longest_streak = 0
        
        for habit in habits:
            today_log = get_today_completion(habit)
            if today_log and today_log.status == 'completed':
                total_completed += 1
            
            total_completions += habit.logs.filter(status='completed').count()
            total_streak += habit.current_streak or 0
            longest_streak = max(longest_streak, habit.longest_streak or 0)
        
        return Response({
            'total_habits': total_habits,
            'total_completed_today': total_completed,
            'completion_rate_today': round((total_completed / total_habits * 100) if total_habits > 0 else 0, 2),
            'total_completions': total_completions,
            'average_streak': round((total_streak / total_habits) if total_habits > 0 else 0, 2),
            'longest_streak': longest_streak,
            'leaf_dollars': request.user.leaf_dollars
        })
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """Get a user's public profile (for friends to view)"""
        from .models import UserReward
        
        user = self.get_object()
        
        # Check if users are friends
        from .models import Friend
        are_friends = Friend.objects.filter(
            Q(user=request.user, friend=user, status='accepted') |
            Q(user=user, friend=request.user, status='accepted')
        ).exists()
        
        if not are_friends:
            return Response(
                {'error': 'You can only view profiles of your friends'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get public habits with current streaks
        public_habits = Habit.objects.filter(
            user=user,
            is_public=True,
            is_active=True
        )
        
        habits_data = []
        for habit in public_habits:
            # Calculate progress
            completed = habit.logs.filter(status='completed').count()
            progress = 0
            if habit.duration_days and habit.duration_days > 0:
                progress = round((completed / habit.duration_days) * 100, 2)
                progress = min(100, progress)
            
            habits_data.append({
                'id': habit.id,
                'name': habit.name,
                'emoji': habit.emoji,
                'current_streak': habit.current_streak or 0,
                'progress': progress,
            })
        
        # Get user's characters (avatar rewards)
        avatar_rewards = UserReward.objects.filter(
            user=user,
            reward__category='avatar'
        ).select_related('reward')
        
        characters = []
        for user_reward in avatar_rewards:
            # Get emoji from icon_url or use a default
            icon = user_reward.reward.icon_url or '👤'
            characters.append(icon)
        
        # If no characters from rewards, use avatar_url as fallback
        if not characters and user.avatar_url:
            characters.append(user.avatar_url)
        
        return Response({
            'user': UserSerializer(user).data,
            'public_habits': habits_data,
            'characters': characters,
        })
    
    @action(detail=False, methods=['post'])
    def purchase_character(self, request):
        """Purchase a character with leaf dollars"""
        user = request.user
        character_id = request.data.get('character_id')
        character_cost = request.data.get('cost', 50)  # Default cost is 50
        character_icon = request.data.get('icon_path', '')
        
        if not character_id:
            return Response(
                {'error': 'character_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already unlocked
        unlocked = user.unlocked_characters or []
        if character_id in unlocked:
            return Response(
                {'error': 'Character already unlocked'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has enough leaf dollars
        if user.leaf_dollars < character_cost:
            return Response(
                {'error': f'Not enough leaf dollars. Need {character_cost}, have {user.leaf_dollars}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Purchase the character
        with transaction.atomic():
            user.leaf_dollars -= character_cost
            unlocked.append(character_id)
            user.unlocked_characters = unlocked
            user.save()
        
        return Response({
            'success': True,
            'unlocked_characters': user.unlocked_characters,
            'remaining_leaf_dollars': user.leaf_dollars
        })
    
    @action(detail=False, methods=['post'])
    def select_character(self, request):
        """Select a character as the active avatar"""
        user = request.user
        character_id = request.data.get('character_id')
        icon_path = request.data.get('icon_path', '')
        
        if not character_id:
            return Response(
                {'error': 'character_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if character is unlocked
        unlocked = user.unlocked_characters or []
        if character_id not in unlocked:
            return Response(
                {'error': 'Character not unlocked'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update selected character
        user.selected_character = character_id
        if icon_path:
            user.avatar_url = icon_path
        user.save()
        
        return Response({
            'success': True,
            'selected_character': user.selected_character,
            'avatar_url': user.avatar_url
        })
    
    @action(detail=False, methods=['post'])
    def initialize_character(self, request):
        """Initialize first character for new users (called on first login)"""
        user = request.user
        character_id = request.data.get('character_id')
        icon_path = request.data.get('icon_path', '')
        
        if not character_id:
            return Response(
                {'error': 'character_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only initialize if no characters are unlocked yet
        if user.unlocked_characters and len(user.unlocked_characters) > 0:
            return Response({
                'success': True,
                'already_initialized': True,
                'unlocked_characters': user.unlocked_characters,
                'selected_character': user.selected_character,
                'leaf_dollars': user.leaf_dollars
            })
        
        # Initialize with the first character (free)
        user.unlocked_characters = [character_id]
        user.selected_character = character_id
        if icon_path:
            user.avatar_url = icon_path
        user.save()
        
        return Response({
            'success': True,
            'unlocked_characters': user.unlocked_characters,
            'selected_character': user.selected_character,
            'avatar_url': user.avatar_url,
            'leaf_dollars': user.leaf_dollars
        })
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def admin_give_leaf_dollars(self, request):
        """Admin endpoint to give leaf dollars to a user (requires secret key)"""
        import os
        
        # Simple secret key check - set ADMIN_SECRET in Railway environment variables
        admin_secret = os.environ.get('ADMIN_SECRET', 'habittree-admin-2024')
        provided_secret = request.data.get('secret')
        
        if provided_secret != admin_secret:
            return Response(
                {'error': 'Invalid admin secret'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        username = request.data.get('username')
        amount = request.data.get('amount')
        
        if not username or amount is None:
            return Response(
                {'error': 'username and amount are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Find user by username or email
            user = User.objects.filter(username__iexact=username).first()
            if not user:
                user = User.objects.filter(email__iexact=username).first()
            
            if not user:
                return Response(
                    {'error': f'User "{username}" not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            old_balance = user.leaf_dollars
            user.leaf_dollars = int(amount)
            user.save()
            
            return Response({
                'success': True,
                'username': user.username,
                'old_balance': old_balance,
                'new_balance': user.leaf_dollars
            })
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return habits for the current user"""
        return Habit.objects.filter(user=self.request.user, is_active=True)
    
    def get_serializer_class(self):
        """Use different serializer for create"""
        if self.action == 'create':
            return HabitCreateSerializer
        return HabitSerializer
    
    def create(self, request, *args, **kwargs):
        """Create habit and return full habit data"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        habit = serializer.save(user=request.user)
        
        # Return full habit data with id
        output_serializer = HabitSerializer(habit)
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark habit as complete for today and award leaf dollars"""
        habit = self.get_object()
        
        # Check if habit can be completed (24-hour rule)
        can_complete = can_complete_habit(habit)
        
        if not can_complete['can_complete']:
            return Response(
                {'error': can_complete['reason']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notes = request.data.get('notes', '')
        amount_done = request.data.get('amount_done', None)
        result = mark_habit_complete(habit, notes, amount_done)
        
        return Response({
            'completion': HabitLogSerializer(result['completion']).data,
            'leaf_dollars_earned': result['leaf_dollars_earned'],
            'new_streak': result['new_streak'],
            'total_leaf_dollars': habit.user.leaf_dollars
        })
    
    @action(detail=True, methods=['post'])
    def incomplete(self, request, pk=None):
        """Mark habit as incomplete for today"""
        habit = self.get_object()
        status_param = request.data.get('status', 'missed')
        log = mark_habit_incomplete(habit, status=status_param)
        return Response(HabitLogSerializer(log).data)
    
    @action(detail=True, methods=['post'])
    def revive(self, request, pk=None):
        """
        Revive a missed day by spending 10 leaf dollars.
        Per spec: Only past missed days can be revived, today cannot be revived.
        """
        from django.utils import timezone
        from datetime import date
        
        habit = self.get_object()
        user = request.user
        target_date_str = request.data.get('date')
        
        if not target_date_str:
            return Response(
                {'error': 'Date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_date = date.fromisoformat(target_date_str)
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        today = timezone.now().date()
        
        # Cannot revive today
        if target_date >= today:
            return Response(
                {'error': 'Cannot revive today or future dates. Only past missed days can be revived.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has enough leaf dollars
        if user.leaf_dollars < 10:
            return Response(
                {'error': 'Not enough leaf dollars. Need 10 to revive.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create log for that date
        log, created = habit.logs.get_or_create(
            log_date=target_date,
            defaults={'status': 'none'}
        )
        
        # Check if already completed
        if log.status == 'completed':
            return Response(
                {'error': 'This day is already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Revive: mark as completed and deduct leaf dollars
        log.status = 'completed'
        log.save()
        
        # Deduct 10 leaf dollars
        user.leaf_dollars -= 10
        user.save()
        
        # Recalculate streak
        from ..algorithms.streak_calculator import update_streak
        update_streak(habit)
        habit.save()
        
        return Response({
            'completion': HabitLogSerializer(log).data,
            'leaf_dollars_spent': 10,
            'remaining_leaf_dollars': user.leaf_dollars,
            'new_streak': habit.current_streak
        })
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get habit statistics"""
        habit = self.get_object()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        stats = get_completion_stats(
            habit,
            start_date=start_date,
            end_date=end_date
        )
        
        serializer = HabitStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Get all logs for a specific habit"""
        habit = self.get_object()
        logs = habit.logs.all().order_by('-log_date')
        return Response({
            'habit_id': habit.id,
            'logs': HabitLogSerializer(logs, many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def all_logs(self, request):
        """Get all habit logs for the current user (for syncing on login)"""
        user = request.user
        habits = Habit.objects.filter(user=user, is_active=True)
        
        all_logs = []
        for habit in habits:
            for log in habit.logs.all():
                all_logs.append({
                    'habit_id': habit.id,
                    'date': log.log_date.isoformat(),
                    'completed': log.status == 'completed',
                    'status': log.status,
                    'amount_done': float(log.amount_done) if log.amount_done else None,
                })
        
        return Response({
            'logs': all_logs,
            'leaf_dollars': user.leaf_dollars,
            'unlocked_characters': user.unlocked_characters or [],
            'selected_character': user.selected_character
        })


class RewardViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing available rewards"""
    queryset = Reward.objects.filter(is_active=True)
    serializer_class = RewardSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by category if provided"""
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        return queryset.order_by('cost_leaf')
    
    @action(detail=True, methods=['post'])
    def purchase(self, request, pk=None):
        """Purchase a reward"""
        reward = self.get_object()
        user = request.user
        
        # Check if user already has this reward
        if UserReward.objects.filter(user=user, reward=reward).exists():
            return Response(
                {'error': 'You already own this reward'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has enough leaf dollars
        if user.leaf_dollars < reward.cost_leaf:
            return Response(
                {'error': f'Insufficient leaf dollars. Need {reward.cost_leaf}, have {user.leaf_dollars}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Purchase the reward
        with transaction.atomic():
            user.leaf_dollars -= reward.cost_leaf
            user.save()
            
            user_reward = UserReward.objects.create(
                user=user,
                reward=reward,
                is_equipped=False
            )
        
        return Response({
            'user_reward': UserRewardSerializer(user_reward).data,
            'remaining_leaf_dollars': user.leaf_dollars
        })


class UserRewardViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user rewards"""
    serializer_class = UserRewardSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return rewards for the current user"""
        return UserReward.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def equip(self, request, pk=None):
        """Equip a reward (unequip others in same category)"""
        user_reward = self.get_object()
        reward = user_reward.reward
        
        # Unequip other rewards in the same category
        with transaction.atomic():
            UserReward.objects.filter(
                user=request.user,
                reward__category=reward.category,
                is_equipped=True
            ).update(is_equipped=False)
            
            user_reward.is_equipped = True
            user_reward.save()
        
        return Response(UserRewardSerializer(user_reward).data)
    
    @action(detail=True, methods=['post'])
    def unequip(self, request, pk=None):
        """Unequip a reward"""
        user_reward = self.get_object()
        user_reward.is_equipped = False
        user_reward.save()
        return Response(UserRewardSerializer(user_reward).data)
    
    @action(detail=False, methods=['get'])
    def equipped(self, request):
        """Get all equipped rewards for the current user"""
        equipped = UserReward.objects.filter(user=request.user, is_equipped=True)
        serializer = self.get_serializer(equipped, many=True)
        return Response(serializer.data)


class FriendViewSet(viewsets.ModelViewSet):
    """ViewSet for managing friend relationships"""
    serializer_class = FriendSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return friend relationships for the current user"""
        user = self.request.user
        return Friend.objects.filter(
            Q(user=user) | Q(friend=user)
        ).select_related('user', 'friend')
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search for users by username or email"""
        query = request.query_params.get('q', '').strip()
        
        if not query or len(query) < 2:
            return Response(
                {'error': 'Search query must be at least 2 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Search users by username, email, or display_name
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(email__icontains=query) |
            Q(display_name__icontains=query)
        ).exclude(id=request.user.id).order_by('username')[:20]
        
        serializer = UserSearchSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def send_request(self, request):
        """Send a friend request"""
        friend_id = request.data.get('friend_id')
        
        if not friend_id:
            return Response(
                {'error': 'friend_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if friend == request.user:
            return Response(
                {'error': 'Cannot send friend request to yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if relationship already exists
        existing = Friend.objects.filter(
            Q(user=request.user, friend=friend) | Q(user=friend, friend=request.user)
        ).first()
        
        if existing:
            if existing.status == 'accepted':
                return Response(
                    {'error': 'You are already friends'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing.status == 'pending':
                if existing.user == request.user:
                    return Response(
                        {'error': 'Friend request already sent'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    # Other user sent request, accept it
                    existing.status = 'accepted'
                    existing.save()
                    serializer = FriendSerializer(existing, context={'request': request})
                    return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Create new friend request
        friend_request = Friend.objects.create(
            user=request.user,
            friend=friend,
            status='pending'
        )
        
        serializer = FriendSerializer(friend_request, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def outgoing(self, request):
        """Get outgoing friend requests (sent by current user)"""
        requests = Friend.objects.filter(
            user=request.user,
            status='pending'
        ).select_related('friend')
        
        serializer = FriendSerializer(requests, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def incoming(self, request):
        """Get incoming friend requests (received by current user)"""
        requests = Friend.objects.filter(
            friend=request.user,
            status='pending'
        ).select_related('user')
        
        serializer = FriendSerializer(requests, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def accepted(self, request):
        """Get accepted friends"""
        friends = Friend.objects.filter(
            Q(user=request.user) | Q(friend=request.user),
            status='accepted'
        ).select_related('user', 'friend')
        
        # Return the other user in each friendship
        friend_list = []
        for friendship in friends:
            other_user = friendship.friend if friendship.user == request.user else friendship.user
            serializer = UserSerializer(other_user)
            friend_list.append(serializer.data)
        
        return Response(friend_list)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a friend request"""
        friend_request = self.get_object()
        
        if friend_request.friend != request.user:
            return Response(
                {'error': 'You can only accept requests sent to you'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if friend_request.status != 'pending':
            return Response(
                {'error': 'Request is not pending'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        friend_request.status = 'accepted'
        friend_request.save()
        
        serializer = FriendSerializer(friend_request, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject or cancel a friend request"""
        friend_request = self.get_object()
        
        # User can reject incoming requests or cancel outgoing requests
        if friend_request.friend != request.user and friend_request.user != request.user:
            return Response(
                {'error': 'You can only reject/cancel your own requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        friend_request.delete()
        return Response({'message': 'Friend request removed'}, status=status.HTTP_200_OK)

