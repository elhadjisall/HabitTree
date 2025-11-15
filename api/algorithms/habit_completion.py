"""
Habit Completion Logic

This module contains algorithms for managing habit completion
and awarding leaf dollars for streaks.
"""
from django.utils import timezone
from datetime import date, timedelta
from .streak_calculator import update_streak


def get_today_completion(habit):
    """
    Get today's completion status for a habit.
    
    Args:
        habit: Habit instance
        
    Returns:
        HabitCompletion or None
    """
    today = timezone.now().date()
    try:
        return habit.completions.get(date=today)
    except habit.completions.model.DoesNotExist:
        return None


def calculate_leaf_dollars_reward(streak_before, streak_after):
    """
    Calculate leaf dollars reward based on streak increase.
    Awards leaf dollars when streak increases (completing habit every 24 hours).
    
    Args:
        streak_before: Streak count before completion
        streak_after: Streak count after completion
        
    Returns:
        int: Leaf dollars to award
    """
    if streak_after > streak_before:
        # Award leaf dollars based on new streak length
        # More leaf dollars for longer streaks
        if streak_after >= 7:
            return 10  # Bonus for weekly streak
        elif streak_after >= 30:
            return 50  # Bonus for monthly streak
        elif streak_after >= 100:
            return 200  # Bonus for 100-day streak
        else:
            return 5  # Base reward for maintaining/starting streak
    return 0


def mark_habit_complete(habit, notes=''):
    """
    Mark a habit as complete for today and award leaf dollars for streaks.
    
    Args:
        habit: Habit instance
        notes: Optional notes
        
    Returns:
        dict: {'completion': HabitCompletion, 'leaf_dollars_earned': int, 'new_streak': int}
    """
    today = timezone.now().date()
    
    # Get streak before completion
    streak_before = habit.current_streak or 0
    
    # Check if already completed today
    completion, created = habit.completions.get_or_create(
        date=today,
        defaults={'completed': True, 'notes': notes}
    )
    
    if not created:
        # If already completed, don't award again
        if completion.completed:
            return {
                'completion': completion,
                'leaf_dollars_earned': 0,
                'new_streak': habit.current_streak
            }
        completion.completed = True
        completion.notes = notes
        completion.save()
    
    # Update habit streak and last completed date
    habit.last_completed_date = today
    update_streak(habit)
    habit.save()
    
    # Calculate leaf dollars reward
    streak_after = habit.current_streak
    leaf_dollars_earned = calculate_leaf_dollars_reward(streak_before, streak_after)
    
    # Award leaf dollars to user
    if leaf_dollars_earned > 0:
        habit.user.leaf_dollars += leaf_dollars_earned
        habit.user.save()
    
    return {
        'completion': completion,
        'leaf_dollars_earned': leaf_dollars_earned,
        'new_streak': streak_after
    }


def mark_habit_incomplete(habit):
    """
    Mark a habit as incomplete for today.
    
    Args:
        habit: Habit instance
        
    Returns:
        HabitCompletion: The completion record
    """
    today = timezone.now().date()
    
    completion, created = habit.completions.get_or_create(
        date=today,
        defaults={'completed': False}
    )
    
    if not created:
        completion.completed = False
        completion.save()
    
    # Update streak
    update_streak(habit)
    habit.save()
    
    return completion


def can_complete_habit(habit):
    """
    Check if a habit can be completed.
    Prevents completing the same habit multiple times in the same 24-hour period.
    
    Args:
        habit: Habit instance
        
    Returns:
        dict: {'can_complete': bool, 'reason': str}
    """
    today = timezone.now().date()
    today_completion = get_today_completion(habit)
    
    # Check if already completed today
    if today_completion and today_completion.completed:
        return {
            'can_complete': False,
            'reason': 'Habit already completed today'
        }
    
    # Check if last completion was less than 24 hours ago
    if habit.last_completed_date:
        time_since_last = (today - habit.last_completed_date).days
        if time_since_last < 1:
            return {
                'can_complete': False,
                'reason': 'Habit can only be completed once per 24 hours'
            }
    
    return {'can_complete': True, 'reason': ''}


def get_completion_stats(habit, start_date=None, end_date=None):
    """
    Get completion statistics for a habit.
    
    Args:
        habit: Habit instance
        start_date: Start date for statistics (optional)
        end_date: End date for statistics (optional)
        
    Returns:
        dict: Completion statistics
    """
    completions = habit.completions.all()
    
    # Filter by date range if provided
    if start_date and end_date:
        completions = completions.filter(date__gte=start_date, date__lte=end_date)
    
    total = completions.count()
    completed = completions.filter(completed=True).count()
    incomplete = total - completed
    completion_rate = (completed / total * 100) if total > 0 else 0
    
    # Get completion by day of week
    by_day_of_week = {}
    for completion in completions:
        day = completion.date.weekday()  # 0 = Monday, 6 = Sunday
        if day not in by_day_of_week:
            by_day_of_week[day] = {'completed': 0, 'total': 0}
        by_day_of_week[day]['total'] += 1
        if completion.completed:
            by_day_of_week[day]['completed'] += 1
    
    return {
        'total': total,
        'completed': completed,
        'incomplete': incomplete,
        'completion_rate': round(completion_rate, 2),
        'current_streak': habit.current_streak,
        'longest_streak': habit.longest_streak,
        'by_day_of_week': by_day_of_week,
        'last_completed_date': habit.last_completed_date
    }

