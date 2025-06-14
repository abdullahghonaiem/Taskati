-- Tasks table schema for Supabase
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL CHECK (status IN ('Todo', 'In Progress', 'Done')),
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
  board_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own tasks
CREATE POLICY "Users can view their own tasks" 
  ON public.tasks 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own tasks
CREATE POLICY "Users can insert their own tasks" 
  ON public.tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own tasks
CREATE POLICY "Users can update their own tasks" 
  ON public.tasks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own tasks
CREATE POLICY "Users can delete their own tasks" 
  ON public.tasks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS tasks_board_id_idx ON public.tasks (board_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks (status); 