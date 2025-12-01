from django.contrib import admin
from .models import Habit, HabitLog, Streak, Reward, UserReward, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'display_name', 'leaf_dollars', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['username', 'email', 'display_name']
    readonly_fields = ['created_at', 'updated_at', 'last_login']


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'habit_type', 'tracking_mode', 'is_active', 'current_streak', 'longest_streak']
    list_filter = ['is_active', 'habit_type', 'tracking_mode', 'is_public', 'created_at']
    search_fields = ['name', 'user__username', 'description']
    readonly_fields = ['created_at', 'updated_at', 'current_streak', 'longest_streak', 'last_completed_date']


@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ['habit', 'log_date', 'status', 'amount_done', 'created_at']
    list_filter = ['status', 'log_date', 'created_at']
    search_fields = ['habit__name', 'note']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'log_date'


@admin.register(Streak)
class StreakAdmin(admin.ModelAdmin):
    list_display = ['habit', 'start_date', 'end_date', 'length_days', 'is_current', 'created_at']
    list_filter = ['is_current', 'start_date', 'created_at']
    search_fields = ['habit__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'start_date'


@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'cost_leaf', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(UserReward)
class UserRewardAdmin(admin.ModelAdmin):
    list_display = ['user', 'reward', 'is_equipped', 'unlocked_at', 'created_at']
    list_filter = ['is_equipped', 'unlocked_at', 'created_at']
    search_fields = ['user__username', 'reward__name']
    readonly_fields = ['unlocked_at', 'created_at']

