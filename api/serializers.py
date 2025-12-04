from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Habit, HabitLog, Streak, Reward, UserReward, Friend

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that accepts email instead of username"""
    username_field = 'email'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Replace username field with email field
        if 'username' in self.fields:
            self.fields['email'] = self.fields.pop('username')
    
    def validate(self, attrs):
        # Since USERNAME_FIELD is 'email', we need to pass email as username
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required.')
        
        # Get user by email
        from django.contrib.auth import authenticate
        user = authenticate(username=email, password=password)
        
        if not user:
            raise serializers.ValidationError('No active account found with the given credentials.')
        
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')
        
        # Get refresh and access tokens
        refresh = self.get_token(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'display_name']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name', 'avatar_url',
            'leaf_dollars', 'unlocked_characters', 'selected_character',
            'is_active', 'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'leaf_dollars', 'created_at', 'updated_at', 'last_login']


class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = [
            'id', 'log_date', 'status', 'amount_done', 'note',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# Backward compatibility alias
class HabitCompletionSerializer(HabitLogSerializer):
    """Backward compatibility - maps old 'completed' boolean to 'status'"""
    completed = serializers.SerializerMethodField()
    date = serializers.DateField(source='log_date', read_only=True)
    notes = serializers.CharField(source='note', read_only=True)
    
    class Meta(HabitLogSerializer.Meta):
        fields = [
            'id', 'date', 'completed', 'status', 'amount_done', 'notes',
            'created_at', 'updated_at'
        ]
    
    def get_completed(self, obj):
        """Map status to boolean for backward compatibility"""
        return obj.status == 'completed'


class HabitSerializer(serializers.ModelSerializer):
    today_completion = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Habit
        fields = [
            'id', 'name', 'description', 'emoji', 'color', 'icon',
            'habit_type', 'tracking_mode', 'target_amount', 'unit', 'frequency',
            'duration_days', 'is_public', 'is_active',
            'current_streak', 'longest_streak', 'last_completed_date',
            'created_at', 'updated_at',
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
            return HabitLogSerializer(completion).data
        return None
    
    def get_completion_percentage(self, obj):
        """
        Calculate completion percentage based on duration_days.
        Per spec: Progress = (completed days) / (duration_days) * 100
        """
        # If no duration set, return 0
        if not obj.duration_days or obj.duration_days == 0:
            return 0
        
        # Count completed days (status='completed')
        completed = obj.logs.filter(status='completed').count()
        
        # Progress = completed days / total duration * 100
        progress = (completed / obj.duration_days) * 100
        return round(min(100, progress), 2)  # Cap at 100%


class HabitCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = [
            'name', 'description', 'emoji', 'color', 'icon',
            'habit_type', 'tracking_mode', 'target_amount', 'unit', 'frequency',
            'duration_days', 'is_public'
        ]


class HabitStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    completed = serializers.IntegerField()
    incomplete = serializers.IntegerField()
    skipped = serializers.IntegerField()
    failed = serializers.IntegerField()
    partial = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    by_day_of_week = serializers.DictField()
    last_completed_date = serializers.DateField(allow_null=True)


class StreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = Streak
        fields = [
            'id', 'start_date', 'end_date', 'length_days', 'is_current',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = [
            'id', 'name', 'description', 'cost_leaf', 'icon_url', 'category',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserRewardSerializer(serializers.ModelSerializer):
    reward = RewardSerializer(read_only=True)
    reward_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = UserReward
        fields = [
            'id', 'reward', 'reward_id', 'unlocked_at', 'is_equipped',
            'created_at'
        ]
        read_only_fields = ['id', 'unlocked_at', 'created_at']
    
    def create(self, validated_data):
        reward_id = validated_data.pop('reward_id', None)
        if reward_id:
            validated_data['reward_id'] = reward_id
        return super().create(validated_data)


class FriendSerializer(serializers.ModelSerializer):
    """Serializer for friend relationships"""
    friend = UserSerializer(read_only=True)
    friend_id = serializers.IntegerField(write_only=True, required=False)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Friend
        fields = [
            'id', 'user', 'friend', 'friend_id', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class UserSearchSerializer(serializers.ModelSerializer):
    """Lightweight serializer for user search results"""
    is_friend = serializers.SerializerMethodField()
    friend_status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name', 'avatar_url',
            'is_friend', 'friend_status'
        ]
    
    def get_is_friend(self, obj):
        """Check if current user is friends with this user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Check if there's an accepted friendship
        return Friend.objects.filter(
            (Q(user=request.user, friend=obj) | Q(user=obj, friend=request.user)),
            status='accepted'
        ).exists()
    
    def get_friend_status(self, obj):
        """Get the friend request status"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        # Check for accepted friendship
        accepted = Friend.objects.filter(
            (Q(user=request.user, friend=obj) | Q(user=obj, friend=request.user)),
            status='accepted'
        ).first()
        if accepted:
            return 'accepted'
        
        # Check for pending request sent by current user
        sent = Friend.objects.filter(user=request.user, friend=obj, status='pending').first()
        if sent:
            return 'pending'
        
        # Check for pending request received by current user
        received = Friend.objects.filter(user=obj, friend=request.user, status='pending').first()
        if received:
            return 'received_pending'
        
        return None

