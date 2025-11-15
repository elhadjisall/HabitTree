"""
Tree Traversal Algorithms

This module contains algorithms for traversing and manipulating the habit tree structure.
"""


def build_tree(habits, parent_id=None):
    """
    Build a tree structure from flat habit queryset/list.
    
    Args:
        habits: QuerySet or list of Habit objects
        parent_id: Parent habit ID (None for root)
        
    Returns:
        list: Tree structure with nested children
    """
    tree = []
    
    for habit in habits:
        habit_parent_id = habit.parent_habit.id if habit.parent_habit else None
        
        if (parent_id is None and habit_parent_id is None) or \
           (parent_id is not None and habit_parent_id == parent_id):
            habit_dict = {
                'id': habit.id,
                'title': habit.title,
                'description': habit.description,
                'parent_habit_id': habit_parent_id,
                'is_active': habit.is_active,
                'color': habit.color,
                'icon': habit.icon,
                'current_streak': habit.current_streak,
                'longest_streak': habit.longest_streak,
                'created_at': habit.created_at,
                'updated_at': habit.updated_at,
                'children': build_tree(habits, habit.id)
            }
            tree.append(habit_dict)
    
    return tree


def get_descendant_ids(habits, parent_id):
    """
    Get all descendant habit IDs (children, grandchildren, etc.).
    
    Args:
        habits: QuerySet or list of Habit objects
        parent_id: Parent habit ID
        
    Returns:
        list: Array of descendant habit IDs
    """
    descendants = []
    children = [h for h in habits if h.parent_habit and h.parent_habit.id == parent_id]
    
    for child in children:
        descendants.append(child.id)
        descendants.extend(get_descendant_ids(habits, child.id))
    
    return descendants


def get_ancestor_ids(habits, habit_id):
    """
    Get all ancestor habit IDs (parent, grandparent, etc.).
    
    Args:
        habits: QuerySet or list of Habit objects
        habit_id: Starting habit ID
        
    Returns:
        list: Array of ancestor habit IDs (from direct parent to root)
    """
    ancestors = []
    habit = next((h for h in habits if h.id == habit_id), None)
    
    if not habit or not habit.parent_habit:
        return ancestors
    
    ancestors.append(habit.parent_habit.id)
    ancestors.extend(get_ancestor_ids(habits, habit.parent_habit.id))
    
    return ancestors


def calculate_tree_completion(habit_node, get_today_completion_func):
    """
    Calculate tree-level completion percentage.
    
    Args:
        habit_node: Habit node dict with children
        get_today_completion_func: Function to get today's completion
        
    Returns:
        dict: {'completed': int, 'total': int, 'percentage': float}
    """
    completed = 0
    total = 1  # Count the current node
    
    # Check if current node is completed today
    today_completion = get_today_completion_func(habit_node['id'])
    if today_completion and today_completion.completed:
        completed += 1
    
    # Recursively calculate children completion
    if 'children' in habit_node and habit_node['children']:
        for child in habit_node['children']:
            child_stats = calculate_tree_completion(child, get_today_completion_func)
            completed += child_stats['completed']
            total += child_stats['total']
    
    return {
        'completed': completed,
        'total': total,
        'percentage': round((completed / total * 100) if total > 0 else 0, 2)
    }


def get_tree_depth(habit_node):
    """
    Get tree depth (maximum depth of the tree).
    
    Args:
        habit_node: Habit node dict with children
        
    Returns:
        int: Maximum depth
    """
    if 'children' not in habit_node or not habit_node['children']:
        return 1
    
    max_depth = 0
    for child in habit_node['children']:
        depth = get_tree_depth(child)
        max_depth = max(max_depth, depth)
    
    return max_depth + 1


def validate_tree_structure(habits):
    """
    Validate tree structure (check for cycles).
    
    Args:
        habits: QuerySet or list of Habit objects
        
    Returns:
        dict: {'valid': bool, 'errors': list}
    """
    errors = []
    visited = set()
    
    def has_cycle(habit_id, path=None):
        if path is None:
            path = set()
        
        if habit_id in path:
            return True  # Cycle detected
        if habit_id in visited:
            return False  # Already checked
        
        visited.add(habit_id)
        path.add(habit_id)
        
        habit = next((h for h in habits if h.id == habit_id), None)
        if habit and habit.parent_habit:
            if has_cycle(habit.parent_habit.id, set(path)):
                return True
        
        path.remove(habit_id)
        return False
    
    for habit in habits:
        if has_cycle(habit.id):
            errors.append(f"Cycle detected involving habit {habit.id}")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }

