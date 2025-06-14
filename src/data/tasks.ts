export type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string; // This maps to due_date in the database
  status: 'Todo' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  board_id?: string; // Added to match schema
  user_id?: string;
  created_at?: string;
  updated_at?: string;
};