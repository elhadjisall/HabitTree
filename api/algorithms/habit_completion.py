"""
Habit Completion Logic

This module contains algorithms for managing habit completion,
including parent-child dependency logic.
"""
from django.utils import timezone
from datetime import date
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


def mark_habit_complete(habit, notes='', all_habits=None):
    """
    Mark a habit as complete for today.
    
    Args:
        habit: Habit instance
        notes: Optional notes
        all_habits: All habits for the user (for tree operations)
        
    Returns:
        HabitCompletion: The completion record
    """
    today = timezone.now().date()
    
    completion, created = habit.completions.get_or_create(
        date=today,
        defaults={'completed': True, 'notes': notes}
    )
    
    if not created:
        completion.completed = True
        completion.notes = notes
        completion.save()
    
    # Update habit streak and last completed date
    habit.last_completed_date = today
    update_streak(habit)
    habit.save()
    
    return completion


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


def can_complete_habit(habit, all_habits=None):
    """
    Check if a habit can be completed (based on parent completion).
    
    Args:
        habit: Habit instance
        all_habits: All habits for the user (optional, for parent lookup)
        
    Returns:
        dict: {'can_complete': bool, 'reason': str}
    """
    # If no parent, can always complete
    if not habit.parent_habit:
        return {'can_complete': True, 'reason': ''}
    
    # Check if parent is completed today
    parent_today = get_today_completion(habit.parent_habit)
    
    if not parent_today or not parent_today.completed:
        return {
            'can_complete': False,
            'reason': 'Parent habit must be completed first'
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

