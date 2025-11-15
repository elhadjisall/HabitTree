from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Habit, HabitCompletion

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'leaf_dollars', 'created_at', 'last_login']
        read_only_fields = ['id', 'leaf_dollars', 'created_at', 'last_login']


class HabitCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitCompletion
        fields = ['id', 'date', 'completed', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class HabitSerializer(serializers.ModelSerializer):
    today_completion = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Habit
        fields = [
            'id', 'title', 'description',
            'is_active', 'color', 'icon', 'current_streak', 'longest_streak',
            'last_completed_date', 'created_at', 'updated_at',
            'today_completion', 'completion_percentage'
        ]
        read_only_fields = [
            'id', 'current_streak', 'longest_streak', 'last_completed_date',
            'created_at', 'updated_at', 'today_completion',
            'completion_percentage'
        ]
    
    def get_today_completion(self, obj):
        """Get today's completion status"""
        from .algorithms.habit_completion import get_today_completion
        completion = get_today_completion(obj)
        if completion:
            return HabitCompletionSerializer(completion).data
        return None
    
    def get_completion_percentage(self, obj):
        """Calculate completion percentage"""
        total = obj.completions.count()
        if total == 0:
            return 0
        completed = obj.completions.filter(completed=True).count()
        return round((completed / total) * 100, 2)


class HabitCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = ['title', 'description', 'color', 'icon']


class HabitStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    completed = serializers.IntegerField()
    incomplete = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    by_day_of_week = serializers.DictField()
    last_completed_date = serializers.DateField(allow_null=True)

