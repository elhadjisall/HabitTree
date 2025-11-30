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


def calculate_leaf_dollars_reward(streak_before, streak_after, is_completion=True):
    """
    Calculate leaf dollars reward based on completion and streak milestones.
    Per spec: "Each completed day gives a small reward"
    Also awards bonus for streak milestones.
    
    Args:
        streak_before: Streak count before completion
        streak_after: Streak count after completion
        is_completion: Whether this is a new completion (True) or just streak update (False)
        
    Returns:
        int: Leaf dollars to award
    """
    reward = 0
    
    # Base reward for completing a day (per spec requirement)
    if is_completion:
        reward += 1  # Small reward for each completed day
    
    # Bonus rewards for streak milestones (in addition to base reward)
    if streak_after > streak_before:
        if streak_after >= 100:
            reward += 200  # Bonus for 100-day streak
        elif streak_after >= 30:
            reward += 50   # Bonus for monthly streak
        elif streak_after >= 7:
            reward += 10   # Bonus for weekly streak
        elif streak_after > 0:
            reward += 4    # Additional reward for maintaining/starting streak (total 5 with base)
    
    return reward


def mark_habit_complete(habit, notes='', amount_done=None):
    """
    Mark a habit as complete for today and award leaf dollars for streaks.
    
    Args:
        habit: Habit instance
        notes: Optional notes
        amount_done: Optional amount completed (for count/time tracking modes)
        
    Returns:
        dict: {'completion': HabitLog, 'leaf_dollars_earned': int, 'new_streak': int}
    """
    today = timezone.now().date()
    
    # Get streak before completion
    streak_before = habit.current_streak or 0
    
    # Check if already completed today
    log, created = habit.logs.get_or_create(
        log_date=today,
        defaults={'status': 'completed', 'note': notes, 'amount_done': amount_done}
    )
    
    if not created:
        # If already completed, don't award again
        if log.status == 'completed':
            return {
                'completion': log,
                'leaf_dollars_earned': 0,
                'new_streak': habit.current_streak
            }
        log.status = 'completed'
        log.note = notes
        if amount_done is not None:
            log.amount_done = amount_done
        log.save()
    
    # Update habit streak and last completed date
    habit.last_completed_date = today
    update_streak(habit)
    habit.save()
    
    # Calculate leaf dollars reward
    streak_after = habit.current_streak
    # Only award if this is a new completion (not already completed)
    is_new_completion = created or (not created and log.status != 'completed')
    leaf_dollars_earned = calculate_leaf_dollars_reward(streak_before, streak_after, is_completion=is_new_completion)
    
    # Award leaf dollars to user
    if leaf_dollars_earned > 0:
        habit.user.leaf_dollars += leaf_dollars_earned
        habit.user.save()
    
    return {
        'completion': log,
        'leaf_dollars_earned': leaf_dollars_earned,
        'new_streak': streak_after
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

