from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Habit, HabitCompletion

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'created_at', 'last_login']
        read_only_fields = ['id', 'created_at', 'last_login']


class HabitCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitCompletion
        fields = ['id', 'date', 'completed', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class HabitSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    today_completion = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Habit
        fields = [
            'id', 'title', 'description', 'parent_habit', 'children',
            'is_active', 'color', 'icon', 'current_streak', 'longest_streak',
            'last_completed_date', 'created_at', 'updated_at',
            'today_completion', 'completion_percentage'
        ]
        read_only_fields = [
            'id', 'current_streak', 'longest_streak', 'last_completed_date',
            'created_at', 'updated_at', 'children', 'today_completion',
            'completion_percentage'
        ]
    
    def get_children(self, obj):
        """Get children habits (for tree structure)"""
        children = obj.children.filter(is_active=True)
        return HabitSerializer(children, many=True).data
    
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
        fields = ['title', 'description', 'parent_habit', 'color', 'icon']
    
    def validate_parent_habit(self, value):
        """Validate parent habit belongs to same user"""
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("Parent habit must belong to you")
        return value


class HabitStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    completed = serializers.IntegerField()
    incomplete = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    by_day_of_week = serializers.DictField()
    last_completed_date = serializers.DateField(allow_null=True)

