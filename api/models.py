from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator, MaxLengthValidator
from django.utils import timezone


class User(AbstractUser):
    """Custom User model extending Django's AbstractUser"""
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100, blank=True, null=True)
    avatar_url = models.CharField(max_length=500, blank=True, null=True)  # Changed from URLField to CharField to accept relative paths
    leaf_dollars = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.display_name or self.username} ({self.email})"


class Habit(models.Model):
    """Habit model with enhanced tracking capabilities"""
    
    HABIT_TYPE_CHOICES = [
        ('good', 'Good Habit'),
        ('bad', 'Bad Habit'),
        ('neutral', 'Neutral'),
    ]
    
    TRACKING_MODE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('count', 'Count'),
        ('time', 'Time'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    name = models.CharField(max_length=100, validators=[MinLengthValidator(1)])
    description = models.TextField(max_length=500, blank=True)
    emoji = models.CharField(max_length=10, blank=True)
    color = models.CharField(max_length=7, default='#4CAF50')
    icon = models.CharField(max_length=50, blank=True)
    
    # Enhanced tracking fields
    habit_type = models.CharField(max_length=10, choices=HABIT_TYPE_CHOICES, default='good')
    tracking_mode = models.CharField(max_length=10, choices=TRACKING_MODE_CHOICES, default='daily')
    target_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)
    frequency = models.CharField(max_length=50, blank=True)
    
    # Duration and visibility
    duration_days = models.IntegerField(null=True, blank=True, help_text="Duration of habit challenge in days (e.g., 30-day challenge)")
    is_public = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Denormalized streak fields (for performance)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_completed_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'habits'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['is_public']),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class HabitLog(models.Model):
    """Daily/periodic log entries for habit tracking (renamed from HabitCompletion)"""
    
    STATUS_CHOICES = [
        ('completed', 'Completed'),  # ✓
        ('missed', 'Missed'),        # ✗
        ('none', 'None'),            # Not filled yet
        ('skipped', 'Skipped'),      # Legacy support
        ('failed', 'Failed'),        # Legacy support
        ('partial', 'Partial'),      # Legacy support
    ]
    
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='logs')
    log_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='none')
    amount_done = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    note = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'habit_logs'
        unique_together = ['habit', 'log_date']
        indexes = [
            models.Index(fields=['habit', 'log_date']),
            models.Index(fields=['habit', 'status']),
            models.Index(fields=['log_date']),
        ]

    def __str__(self):
        return f"{self.get_status_display()} {self.habit.name} - {self.log_date}"


# Keep HabitCompletion as an alias for backward compatibility during migration
class HabitCompletion(HabitLog):
    """Backward compatibility alias - use HabitLog instead"""
    class Meta:
        proxy = True
        db_table = 'habit_completions'


class Streak(models.Model):
    """Historical streak records for habits"""
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='streaks')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    length_days = models.IntegerField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'streaks'
        indexes = [
            models.Index(fields=['habit', 'is_current']),
            models.Index(fields=['habit', 'start_date']),
        ]
        constraints = [
            # Ensure only one current streak per habit
            models.UniqueConstraint(
                fields=['habit'],
                condition=models.Q(is_current=True),
                name='unique_current_streak_per_habit'
            )
        ]

    def __str__(self):
        status = "Current" if self.is_current else "Past"
        return f"{status} streak: {self.length_days} days for {self.habit.name}"


class Reward(models.Model):
    """Available rewards in the system"""
    
    CATEGORY_CHOICES = [
        ('avatar', 'Avatar'),
        ('badge', 'Badge'),
        ('theme', 'Theme'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=500, blank=True)
    cost_leaf = models.IntegerField(default=0)
    icon_url = models.URLField(max_length=500, blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='badge')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rewards'
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['category']),
            models.Index(fields=['cost_leaf']),
        ]

    def __str__(self):
        return f"{self.name} ({self.cost_leaf} leaves)"


class UserReward(models.Model):
    """Junction table linking users to their unlocked rewards"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_rewards')
    reward = models.ForeignKey(Reward, on_delete=models.CASCADE, related_name='user_rewards')
    unlocked_at = models.DateTimeField(auto_now_add=True)
    is_equipped = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_rewards'
        unique_together = ['user', 'reward']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['user', 'is_equipped']),
            models.Index(fields=['reward']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.reward.name} ({'Equipped' if self.is_equipped else 'Unlocked'})"


class Friend(models.Model):
    """Friends system - tracks friend relationships between users"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('blocked', 'Blocked'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends_sent')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends_received')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'friends'
        unique_together = ['user', 'friend']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['friend', 'status']),
            models.Index(fields=['user', 'friend']),
        ]
        constraints = [
            # Prevent self-friending
            models.CheckConstraint(
                check=~models.Q(user=models.F('friend')),
                name='no_self_friend'
            )
        ]
    
    def __str__(self):
        return f"{self.user.username} -> {self.friend.username} ({self.status})"

