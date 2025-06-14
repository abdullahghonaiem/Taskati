import { supabase, isSupabaseConfigured } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

// Define the database table name
const BOARDS_TABLE = 'boards';

// Define board interface
export interface Board {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches all boards for the current user
 */
export async function getBoards(): Promise<Board[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using mock data');
    // Return empty array when Supabase is not configured
    return [];
  }

  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('No authenticated user found');
      return [];
    }

    const { data, error } = await supabase
      .from(BOARDS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching boards:', error);
      return [];
    }

    return data as Board[];
  } catch (err) {
    console.error('Unexpected error fetching boards:', err);
    return [];
  }
}

/**
 * Creates a new board with a name and optional description
 */
export async function createBoard(name: string, description?: string): Promise<Board | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot create board');
    return null;
  }

  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('No authenticated user found');
      return null;
    }
    
    // Create a new UUID for the board
    const boardId = uuidv4();
    
    const { data, error } = await supabase
      .from(BOARDS_TABLE)
      .insert([{
        id: boardId,
        name: name,
        description: description || '',
        user_id: userId
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating board:', error);
      return null;
    }

    return data as Board;
  } catch (err) {
    console.error('Unexpected error creating board:', err);
    return null;
  }
}

/**
 * Ensures the user has a default board, creating one if necessary
 * Returns the ID of the default board
 */
export async function ensureDefaultBoard(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot ensure default board');
    return null;
  }

  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('No authenticated user found');
      return null;
    }
    
    // Check if user has any boards
    const { data: boards, error: fetchError } = await supabase
      .from(BOARDS_TABLE)
      .select('id')
      .eq('user_id', userId)
      .limit(1);
      
    if (fetchError) {
      console.error('Error fetching boards:', fetchError);
      return null;
    }
    
    // If user already has boards, return the first one
    if (boards && boards.length > 0) {
      return boards[0].id;
    }
    
    // Otherwise create a default board
    const boardId = uuidv4();
    const { error: createError } = await supabase
      .from(BOARDS_TABLE)
      .insert([{
        id: boardId,
        name: 'Default Board',
        description: 'Your first kanban board',
        user_id: userId
      }]);
      
    if (createError) {
      console.error('Error creating default board:', createError);
      return null;
    }
    
    return boardId;
  } catch (err) {
    console.error('Unexpected error ensuring default board:', err);
    return null;
  }
}

/**
 * Deletes a board by ID
 */
export async function deleteBoard(boardId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot delete board');
    return false;
  }

  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('No authenticated user found');
      return false;
    }
    
    // Delete the board
    const { error } = await supabase
      .from(BOARDS_TABLE)
      .delete()
      .eq('id', boardId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting board:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error deleting board:', err);
    return false;
  }
}

/**
 * Updates a board's name and description
 */
export async function updateBoard(boardId: string, updates: { name?: string; description?: string }): Promise<Board | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot update board');
    return null;
  }

  try {
    // Get the current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('No authenticated user found');
      return null;
    }
    
    // Update the board
    const { data, error } = await supabase
      .from(BOARDS_TABLE)
      .update(updates)
      .eq('id', boardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating board:', error);
      return null;
    }

    return data as Board;
  } catch (err) {
    console.error('Unexpected error updating board:', err);
    return null;
  }
} 