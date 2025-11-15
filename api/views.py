from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Habit, HabitCompletion
from .serializers import (
    UserSerializer, HabitSerializer, HabitCreateSerializer,
    HabitStatsSerializer, HabitCompletionSerializer
)
from .algorithms.tree_traversal import build_tree, get_descendant_ids, validate_tree_structure
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
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
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
            today_completion = get_today_completion(habit)
            if today_completion and today_completion.completed:
                total_completed += 1
            
            total_completions += habit.completions.filter(completed=True).count()
            total_streak += habit.current_streak or 0
            longest_streak = max(longest_streak, habit.longest_streak or 0)
        
        return Response({
            'total_habits': total_habits,
            'total_completed_today': total_completed,
            'completion_rate_today': round((total_completed / total_habits * 100) if total_habits > 0 else 0, 2),
            'total_completions': total_completions,
            'average_streak': round((total_streak / total_habits) if total_habits > 0 else 0, 2),
            'longest_streak': longest_streak
        })


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
    
    def perform_create(self, serializer):
        """Set user when creating habit"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get all habits as tree structure"""
        habits = self.get_queryset()
        tree = build_tree(habits)
        return Response(tree)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark habit as complete for today"""
        habit = self.get_object()
        
        # Check if habit can be completed
        all_habits = Habit.objects.filter(user=request.user)
        can_complete = can_complete_habit(habit, all_habits)
        
        if not can_complete['can_complete']:
            return Response(
                {'error': can_complete['reason']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notes = request.data.get('notes', '')
        completion = mark_habit_complete(habit, notes, all_habits)
        
        return Response(HabitCompletionSerializer(completion).data)
    
    @action(detail=True, methods=['post'])
    def incomplete(self, request, pk=None):
        """Mark habit as incomplete for today"""
        habit = self.get_object()
        completion = mark_habit_incomplete(habit)
        return Response(HabitCompletionSerializer(completion).data)
    
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
    
    @action(detail=True, methods=['put'])
    def move(self, request, pk=None):
        """Move habit to different parent"""
        habit = self.get_object()
        new_parent_id = request.data.get('new_parent_id')
        
        # Validate new parent
        if new_parent_id:
            try:
                new_parent = Habit.objects.get(id=new_parent_id, user=request.user)
                
                # Prevent moving to own descendant
                all_habits = Habit.objects.filter(user=request.user)
                descendants = get_descendant_ids(all_habits, habit.id)
                if new_parent.id in descendants:
                    return Response(
                        {'error': 'Cannot move habit to its own descendant'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                habit.parent_habit = new_parent
            except Habit.DoesNotExist:
                return Response(
                    {'error': 'New parent habit not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            habit.parent_habit = None
        
        habit.save()
        serializer = self.get_serializer(habit)
        return Response(serializer.data)

