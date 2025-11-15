"""
Streak Calculation Algorithms

This module contains algorithms for calculating and maintaining habit streaks.
"""
from datetime import date, timedelta
from django.utils import timezone


def calculate_streaks(completions):
    """
    Calculate current and longest streak for a habit.
    
    Args:
        completions: QuerySet or list of HabitCompletion objects with completed=True
        
    Returns:
        dict: {'current_streak': int, 'longest_streak': int}
    """
    if not completions or len(completions) == 0:
        return {'current_streak': 0, 'longest_streak': 0}
    
    # Get completed dates and sort (most recent first)
    completed_dates = sorted(
        [comp.date for comp in completions if comp.completed],
        reverse=True
    )
    
    if not completed_dates:
        return {'current_streak': 0, 'longest_streak': 0}
    
    # Calculate current streak
    current_streak = 0
    today = timezone.now().date()
    
    # Check if today is completed
    if completed_dates[0] == today:
        current_streak = 1
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
        'longest_streak': longest_streak
    }


def update_streak(habit):
    """
    Update streak for a habit after completion change.
    
    Args:
        habit: Habit instance
        
    Returns:
        Habit: Updated habit instance (not saved)
    """
    completions = habit.completions.all()
    streaks = calculate_streaks(completions)
    
    habit.current_streak = streaks['current_streak']
    habit.longest_streak = max(habit.longest_streak or 0, streaks['longest_streak'])
    
    return habit


def get_streak_stats(completions, start_date=None, end_date=None):
    """
    Get streak statistics for a date range.
    
    Args:
        completions: QuerySet of HabitCompletion objects
        start_date: Start date (optional)
        end_date: End date (optional)
        
    Returns:
        dict: Streak statistics
    """
    if start_date and end_date:
        filtered = completions.filter(
            date__gte=start_date,
            date__lte=end_date,
            completed=True
        )
        total_days = (end_date - start_date).days + 1
    else:
        filtered = completions.filter(completed=True)
        if filtered.exists():
            dates = filtered.values_list('date', flat=True)
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

