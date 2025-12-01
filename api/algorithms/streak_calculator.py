"""
Streak Calculation Algorithms

This module contains algorithms for calculating and maintaining habit streaks.
"""
from datetime import date, timedelta
from django.utils import timezone
from django.db import transaction
from ..models import Streak


def calculate_streaks(logs):
    """
    Calculate current and longest streak for a habit.
    
    Args:
        logs: QuerySet or list of HabitLog objects with status='completed'
        
    Returns:
        dict: {'current_streak': int, 'longest_streak': int, 'current_streak_start': date or None}
    """
    if not logs or len(logs) == 0:
        return {'current_streak': 0, 'longest_streak': 0, 'current_streak_start': None}
    
    # Get completed dates and sort (most recent first)
    completed_dates = sorted(
        [log.log_date for log in logs if log.status == 'completed'],
        reverse=True
    )
    
    if not completed_dates:
        return {'current_streak': 0, 'longest_streak': 0, 'current_streak_start': None}
    
    # Calculate current streak
    current_streak = 0
    current_streak_start = None
    today = timezone.now().date()
    
    # Check if today is completed
    if completed_dates[0] == today:
        current_streak = 1
        current_streak_start = today
        expected_date = today - timedelta(days=1)
        start_index = 1
    else:
        # Start from yesterday if today is not completed
        expected_date = today - timedelta(days=1)
        start_index = 0
    
    # Count consecutive days
    for i in range(start_index, len(completed_dates)):
        comp_date = completed_dates[i]
        
        if comp_date == expected_date:
            current_streak += 1
            current_streak_start = comp_date
            expected_date -= timedelta(days=1)
        elif comp_date < expected_date:
            # Gap found, streak broken
            break
    
    # Calculate longest streak
    longest_streak = 0
    temp_streak = 1
    
    for i in range(1, len(completed_dates)):
        days_diff = (completed_dates[i-1] - completed_dates[i]).days
        
        if days_diff == 1:
            temp_streak += 1
        else:
            longest_streak = max(longest_streak, temp_streak)
            temp_streak = 1
    
    longest_streak = max(longest_streak, temp_streak)
    
    return {
        'current_streak': current_streak,
        'longest_streak': longest_streak,
        'current_streak_start': current_streak_start
    }


def update_streak(habit):
    """
    Update streak for a habit after completion change.
    Also creates/updates Streak records in the database.
    
    Args:
        habit: Habit instance
        
    Returns:
        Habit: Updated habit instance (not saved)
    """
    logs = habit.logs.all()
    streaks = calculate_streaks(logs)
    
    old_current_streak = habit.current_streak or 0
    new_current_streak = streaks['current_streak']
    
    habit.current_streak = new_current_streak
    habit.longest_streak = max(habit.longest_streak or 0, streaks['longest_streak'])
    
    # Update Streak records in database
    with transaction.atomic():
        # Get current streak record if it exists
        current_streak_record = habit.streaks.filter(is_current=True).first()
        
        if new_current_streak > 0:
            # We have an active streak
            if current_streak_record:
                # Update existing streak
                if current_streak_record.start_date != streaks['current_streak_start']:
                    # Streak was broken and restarted
                    # End the old streak
                    current_streak_record.is_current = False
                    current_streak_record.end_date = timezone.now().date() - timedelta(days=1)
                    current_streak_record.length_days = (current_streak_record.end_date - current_streak_record.start_date).days + 1
                    current_streak_record.save()
                    
                    # Create new streak
                    Streak.objects.create(
                        habit=habit,
                        start_date=streaks['current_streak_start'],
                        length_days=new_current_streak,
                        is_current=True
                    )
                else:
                    # Update length of existing streak
                    current_streak_record.length_days = new_current_streak
                    current_streak_record.save()
            else:
                # Create new current streak
                Streak.objects.create(
                    habit=habit,
                    start_date=streaks['current_streak_start'],
                    length_days=new_current_streak,
                    is_current=True
                )
        else:
            # No active streak - end current streak if it exists
            if current_streak_record:
                current_streak_record.is_current = False
                current_streak_record.end_date = timezone.now().date() - timedelta(days=1)
                current_streak_record.length_days = (current_streak_record.end_date - current_streak_record.start_date).days + 1
                current_streak_record.save()
    
    return habit


def get_streak_stats(logs, start_date=None, end_date=None):
    """
    Get streak statistics for a date range.
    
    Args:
        logs: QuerySet of HabitLog objects
        start_date: Start date (optional)
        end_date: End date (optional)
        
    Returns:
        dict: Streak statistics
    """
    if start_date and end_date:
        filtered = logs.filter(
            log_date__gte=start_date,
            log_date__lte=end_date,
            status='completed'
        )
        total_days = (end_date - start_date).days + 1
    else:
        filtered = logs.filter(status='completed')
        if filtered.exists():
            dates = filtered.values_list('log_date', flat=True)
            total_days = (max(dates) - min(dates)).days + 1 if len(dates) > 1 else 1
        else:
            total_days = 0
    
    completed_days = filtered.count()
    completion_rate = (completed_days / total_days * 100) if total_days > 0 else 0
    
    return {
        'total_days': total_days,
        'completed_days': completed_days,
        'completion_rate': round(completion_rate, 2)
    }

