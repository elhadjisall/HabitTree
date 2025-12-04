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
        HabitLog or None
    """
    today = timezone.now().date()
    try:
        return habit.logs.get(log_date=today)
    except habit.logs.model.DoesNotExist:
        return None


def calculate_leaf_dollars_reward(is_new_completion=True):
    """
    Calculate leaf dollars reward for completing a habit.
    Simple: 1 leaf dollar per completion.
    
    Args:
        is_new_completion: Whether this is a new completion (True) or already completed (False)
        
    Returns:
        int: Leaf dollars to award (1 if new completion, 0 otherwise)
    """
    if is_new_completion:
        return 1  # 1 leaf dollar per completed day
    return 0


def mark_habit_complete(habit, notes='', amount_done=None):
    """
    Mark a habit as complete for today and award leaf dollars.
    
    Args:
        habit: Habit instance
        notes: Optional notes
        amount_done: Optional amount completed (for count/time tracking modes)
        
    Returns:
        dict: {'completion': HabitLog, 'leaf_dollars_earned': int, 'new_streak': int}
    """
    today = timezone.now().date()
    
    # Check if already completed today BEFORE creating/updating
    existing_log = None
    try:
        existing_log = habit.logs.get(log_date=today)
        was_already_completed = existing_log.status == 'completed'
    except habit.logs.model.DoesNotExist:
        was_already_completed = False
    
    # Create or update the log
    if existing_log:
        # Already has a log for today
        if was_already_completed:
            # Already completed - don't award again
            return {
                'completion': existing_log,
                'leaf_dollars_earned': 0,
                'new_streak': habit.current_streak or 0
            }
        # Update existing log to completed
        existing_log.status = 'completed'
        existing_log.note = notes
        if amount_done is not None:
            existing_log.amount_done = amount_done
        existing_log.save()
        log = existing_log
    else:
        # Create new log
        log = habit.logs.create(
            log_date=today,
            status='completed',
            note=notes,
            amount_done=amount_done
        )
    
    # Update habit streak and last completed date
    habit.last_completed_date = today
    update_streak(habit)
    habit.save()
    
    # Award 1 leaf dollar for this new completion
    leaf_dollars_earned = calculate_leaf_dollars_reward(is_new_completion=True)
    
    # Award leaf dollars to user
    if leaf_dollars_earned > 0:
        habit.user.leaf_dollars += leaf_dollars_earned
        habit.user.save()
    
    return {
        'completion': log,
        'leaf_dollars_earned': leaf_dollars_earned,
        'new_streak': habit.current_streak or 0
    }


def mark_habit_incomplete(habit, status='missed'):
    """
    Mark a habit as incomplete for today.
    Per spec: status should be 'missed' (✗) when user doesn't complete habit.
    
    Args:
        habit: Habit instance
        status: Status to set ('missed' by default, or 'failed', 'skipped', 'partial' for legacy)
        
    Returns:
        HabitLog: The log record
    """
    today = timezone.now().date()
    
    log, created = habit.logs.get_or_create(
        log_date=today,
        defaults={'status': status}
    )
    
    if not created:
        log.status = status
        log.save()
    
    # Update streak (streak breaks on missed day)
    update_streak(habit)
    habit.save()
    
    return log


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
    today_log = get_today_completion(habit)
    
    # Check if already completed today
    if today_log and today_log.status == 'completed':
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
    logs = habit.logs.all()
    
    # Filter by date range if provided
    if start_date and end_date:
        logs = logs.filter(log_date__gte=start_date, log_date__lte=end_date)
    
    total = logs.count()
    completed = logs.filter(status='completed').count()
    skipped = logs.filter(status='skipped').count()
    failed = logs.filter(status='failed').count()
    partial = logs.filter(status='partial').count()
    incomplete = total - completed
    completion_rate = (completed / total * 100) if total > 0 else 0
    
    # Get completion by day of week
    by_day_of_week = {}
    for log in logs:
        day = log.log_date.weekday()  # 0 = Monday, 6 = Sunday
        if day not in by_day_of_week:
            by_day_of_week[day] = {'completed': 0, 'total': 0}
        by_day_of_week[day]['total'] += 1
        if log.status == 'completed':
            by_day_of_week[day]['completed'] += 1
    
    return {
        'total': total,
        'completed': completed,
        'incomplete': incomplete,
        'skipped': skipped,
        'failed': failed,
        'partial': partial,
        'completion_rate': round(completion_rate, 2),
        'current_streak': habit.current_streak,
        'longest_streak': habit.longest_streak,
        'by_day_of_week': by_day_of_week,
        'last_completed_date': habit.last_completed_date
    }

