import { supabase, isSupabaseConfigured } from '../supabase';
import type { Task } from '../../data/tasks';
import { v4 as uuidv4 } from 'uuid';
import { getUserSubscription } from './subscriptionService';
import { FREE_PLAN_TASK_LIMIT, SUBSCRIPTION_PLAN_LIMITS } from '../config';

// Define the database table name
const TASKS_TABLE = 'tasks';

/**
 * Get user's task limit based on subscription plan
 */
export async function getUserTaskLimit(userId: string): Promise<number> {
  if (!userId) {
    return FREE_PLAN_TASK_LIMIT;
  }
  
  try {
    // Get user's subscription
    const subscription = await getUserSubscription(userId);
    
    // Determine task limit based on subscription
    if (subscription && subscription.status === 'active') {
      // Check if there's a limit for this plan
      const planLimit = SUBSCRIPTION_PLAN_LIMITS[subscription.planId];
      if (planLimit) {
        return planLimit;
      }
    }
    
    // Default to free plan
    return FREE_PLAN_TASK_LIMIT;
  } catch (err) {
    console.error('Error getting user task limit:', err);
    return FREE_PLAN_TASK_LIMIT;
  }
}

/**
 * Check if user has reached their task limit
 */
export async function hasReachedTaskLimit(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping task limit check');
    return false;
  }

  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('No authenticated user found');
      return true; // Fail closed - if no user, don't allow task creation
    }
    
    // Get user's active tasks
    const { count, error } = await supabase
      .from(TASKS_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['Todo', 'In Progress']);
      
    if (error) {
      console.error('Error checking task count:', error);
      return true; // Fail closed - if error, don't allow task creation
    }
    
    // Get user's task limit
    const taskLimit = await getUserTaskLimit(userId);
    
    console.log(`User has ${count} active tasks out of ${taskLimit} limit`);
    
    // Check if user has reached their limit
    return (count || 0) >= taskLimit;
  } catch (err) {
    console.error('Error checking task limit:', err);
    return true; // Fail closed
  }
}

/**
 * Fetches all tasks for the current user
 */
export async function getTasks(): Promise<Task[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using mock data');
    // Return empty array or mock data when Supabase is not configured
    return [];
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('No authenticated user found');
      return [];
    }
    
    const { data, error } = await supabase
      .from(TASKS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data as Task[];
  } catch (err) {
    console.error('Unexpected error fetching tasks:', err);
    return [];
  }
}

/**
 * Fetches tasks for the current user and groups them by status
 */
export async function getTasksByStatus(): Promise<{ 
  todo: Task[], 
  inProgress: Task[], 
  done: Task[],
  isEmpty: boolean 
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('No authenticated user found');
      return { todo: [], inProgress: [], done: [], isEmpty: true };
    }
    
    const { data, error } = await supabase
      .from(TASKS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return { todo: [], inProgress: [], done: [], isEmpty: true };
    }

    // Debug: Log raw data from database
    console.log('Raw tasks from database:', JSON.stringify(data, null, 2));
    
    // Transform data to match our model
    const tasks = data.map(item => {
      console.log(`Task ${item.id} due_date:`, item.due_date);
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        deadline: item.due_date, // Map from DB field to our model field
        status: item.status,
        priority: item.priority,
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        board_id: item.board_id
      } as Task;
    });
    
    const isEmpty = tasks.length === 0;
    
    // Group tasks by status
    const todo = tasks.filter(task => task.status === 'Todo');
    const inProgress = tasks.filter(task => task.status === 'In Progress');
    const done = tasks.filter(task => task.status === 'Done');

    return { 
      todo, 
      inProgress, 
      done,
      isEmpty
    };
  } catch (err) {
    console.error('Unexpected error fetching tasks by status:', err);
    return { todo: [], inProgress: [], done: [], isEmpty: true };
  }
}

/**
 * Fetches tasks for the current user and groups them by status for a specific board
 */
export async function getTasksByStatusAndBoard(boardId: string): Promise<{ 
  todo: Task[], 
  inProgress: Task[], 
  done: Task[],
  isEmpty: boolean 
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('No authenticated user found');
      return { todo: [], inProgress: [], done: [], isEmpty: true };
    }
    
    const { data, error } = await supabase
      .from(TASKS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('board_id', boardId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return { todo: [], inProgress: [], done: [], isEmpty: true };
    }

    // Transform data to match our model
    const tasks = data.map(item => {
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        deadline: item.due_date, // Map from DB field to our model field
        status: item.status,
        priority: item.priority,
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        board_id: item.board_id
      } as Task;
    });
    
    const isEmpty = tasks.length === 0;
    
    // Group tasks by status
    const todo = tasks.filter(task => task.status === 'Todo');
    const inProgress = tasks.filter(task => task.status === 'In Progress');
    const done = tasks.filter(task => task.status === 'Done');

    return { 
      todo, 
      inProgress, 
      done,
      isEmpty
    };
  } catch (err) {
    console.error('Unexpected error fetching tasks by status and board:', err);
    return { todo: [], inProgress: [], done: [], isEmpty: true };
  }
}

/**
 * Creates a new task
 */
export async function createTask(task: Omit<Task, 'id'> & { id: string }): Promise<Task | null> {
  console.log("TASK CREATION - Step 1: Function called with:", task);
  
  if (!isSupabaseConfigured()) {
    console.warn('TASK CREATION - ERROR: Supabase not configured, cannot create task');
    return null;
  }

  try {
    // Check if user has reached their task limit
    const limitReached = await hasReachedTaskLimit();
    if (limitReached) {
      console.warn('TASK CREATION - ERROR: User has reached their task limit');
      return { error: 'Task limit reached for your subscription plan' } as any;
    }
    
    // Get current user
    console.log("TASK CREATION - Step 2: Getting user session");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("TASK CREATION - ERROR: Session error", sessionError);
      return null;
    }
    
    const userId = session?.user?.id;
    
    console.log("TASK CREATION - Step 3: Current user ID:", userId);
    if (!userId) {
      console.warn('TASK CREATION - ERROR: No authenticated user found');
      return null;
    }
    
    // Use the provided board_id or generate a new one if not provided
    const boardId = task.board_id || uuidv4();
    
    console.log("TASK CREATION - Step 4: Using board_id:", boardId);
    
    // Ensure deadline is in proper ISO format (YYYY-MM-DD)
    let formattedDeadline = task.deadline;
    try {
      // Try to parse and normalize the date
      const dateObj = new Date(task.deadline);
      if (!isNaN(dateObj.getTime())) {
        // If valid date, format as ISO date string YYYY-MM-DD
        formattedDeadline = dateObj.toISOString().split('T')[0];
      } else {
        console.warn('Invalid deadline date provided:', task.deadline);
        // Default to today if invalid
        formattedDeadline = new Date().toISOString().split('T')[0];
      }
    } catch (err) {
      console.error('Error formatting deadline for DB:', err);
      // Default to today's date if there was an error
      formattedDeadline = new Date().toISOString().split('T')[0];
    }
    
    console.log("TASK CREATION - Step 5: Preparing task data for insert", { 
      id: task.id,
      title: task.title, 
      description: task.description,
      due_date: formattedDeadline, // Normalized date format
      status: task.status,
      priority: task.priority,
      board_id: boardId, // Required by schema
      user_id: userId
    });
    
    console.log("TASK CREATION - Step 6: Inserting task into Supabase");
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        id: task.id,
        title: task.title,
        description: task.description,
        due_date: formattedDeadline, // Using normalized date
        status: task.status,
        priority: task.priority,
        board_id: boardId, // Required field in your schema
        user_id: userId
      }])
      .select()
      .single();

    if (error) {
      console.error('TASK CREATION - ERROR: Error creating task:', error);
      return null;
    }

    console.log("TASK CREATION - Step 7: Task created successfully:", data);
    
    // Convert the database response to our Task model format
    const newTask: Task = {
      id: data.id,
      title: data.title,
      description: data.description,
      deadline: data.due_date, // Convert back to our model's field name
      status: data.status,
      priority: data.priority,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return newTask;
  } catch (err) {
    console.error('TASK CREATION - ERROR: Unexpected error creating task:', err);
    return null;
  }
}

/**
 * Updates an existing task
 */
export async function updateTask(task: Task): Promise<Task | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot update task');
    return null;
  }

  try {
    console.log("Updating task:", task.id);
    
    // Ensure deadline is in proper ISO format (YYYY-MM-DD)
    let formattedDeadline = task.deadline;
    try {
      // Try to parse and normalize the date
      const dateObj = new Date(task.deadline);
      if (!isNaN(dateObj.getTime())) {
        // If valid date, format as ISO date string YYYY-MM-DD
        formattedDeadline = dateObj.toISOString().split('T')[0];
      } else {
        console.warn('Invalid deadline date provided for update:', task.deadline);
        // Default to today if invalid
        formattedDeadline = new Date().toISOString().split('T')[0];
      }
    } catch (err) {
      console.error('Error formatting deadline for update:', err);
      // Default to today's date if there was an error
      formattedDeadline = new Date().toISOString().split('T')[0];
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: task.title,
        description: task.description,
        due_date: formattedDeadline,
        status: task.status,
        priority: task.priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return null;
    }

    console.log("Task updated successfully:", data);
    
    // Convert the database response to our Task model format
    const updatedTask: Task = {
      id: data.id,
      title: data.title,
      description: data.description,
      deadline: data.due_date, // Convert from DB field name to our model's field name
      status: data.status,
      priority: data.priority,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return updatedTask;
  } catch (err) {
    console.error('Unexpected error updating task:', err);
    return null;
  }
}

/**
 * Deletes a task by ID
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot delete task');
    return false;
  }

  try {
    const { error } = await supabase
      .from(TASKS_TABLE)
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error deleting task:', err);
    return false;
  }
}

/**
 * Updates task status
 */
export async function updateTaskStatus(
  taskId: string, 
  status: Task['status']
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot update task status');
    return false;
  }

  try {
    const { error } = await supabase
      .from(TASKS_TABLE)
      .update({ status })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error updating task status:', err);
    return false;
  }
} 