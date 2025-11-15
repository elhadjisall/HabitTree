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
            'longest_streak': longest_streak,
            'leaf_dollars': request.user.leaf_dollars
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
        result = mark_habit_complete(habit, notes)
        
        return Response({
            'completion': HabitCompletionSerializer(result['completion']).data,
            'leaf_dollars_earned': result['leaf_dollars_earned'],
            'new_streak': result['new_streak'],
            'total_leaf_dollars': habit.user.leaf_dollars
        })
    
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
    

