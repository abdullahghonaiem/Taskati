-- Boards table schema for Supabase
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own boards
CREATE POLICY "Users can view their own boards" 
  ON public.boards 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own boards
CREATE POLICY "Users can insert their own boards" 
  ON public.boards 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own boards
CREATE POLICY "Users can update their own boards" 
  ON public.boards 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own boards
CREATE POLICY "Users can delete their own boards" 
  ON public.boards 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS boards_user_id_idx ON public.boards (user_id); 