-- First check if the boards table already exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'boards'
    ) THEN
        RAISE NOTICE 'The boards table already exists.';
    ELSE
        RAISE NOTICE 'Creating boards table...';
        
        -- Create boards table
        CREATE TABLE public.boards (
            id UUID PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            is_default BOOLEAN DEFAULT FALSE
        );
        
        RAISE NOTICE 'boards table created successfully.';
    END IF;
END $$;

-- Create an index on user_id for performance if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'boards' 
        AND indexname = 'idx_boards_user_id'
    ) THEN
        RAISE NOTICE 'Creating index on boards.user_id...';
        CREATE INDEX idx_boards_user_id ON public.boards(user_id);
    ELSE
        RAISE NOTICE 'Index on boards.user_id already exists.';
    END IF;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'boards' AND policyname = 'select_own_boards') THEN
        RAISE NOTICE 'Creating select policy for boards...';
        CREATE POLICY select_own_boards ON public.boards
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'boards' AND policyname = 'insert_own_boards') THEN
        RAISE NOTICE 'Creating insert policy for boards...';
        CREATE POLICY insert_own_boards ON public.boards
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'boards' AND policyname = 'update_own_boards') THEN
        RAISE NOTICE 'Creating update policy for boards...';
        CREATE POLICY update_own_boards ON public.boards
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'boards' AND policyname = 'delete_own_boards') THEN
        RAISE NOTICE 'Creating delete policy for boards...';
        CREATE POLICY delete_own_boards ON public.boards
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable RLS on boards table
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Add board_id column to tasks table if it doesn't already exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'board_id'
    ) THEN
        RAISE NOTICE 'Adding board_id column to tasks table...';
        
        ALTER TABLE public.tasks ADD COLUMN board_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE public.tasks 
        ADD CONSTRAINT fk_board 
        FOREIGN KEY (board_id) 
        REFERENCES public.boards(id) 
        ON DELETE CASCADE;
        
        -- Create index on board_id
        CREATE INDEX idx_tasks_board_id ON public.tasks(board_id);
        
        RAISE NOTICE 'board_id column added to tasks table successfully.';
    ELSE
        RAISE NOTICE 'board_id column already exists in tasks table.';
    END IF;
END $$;

-- Run diagnostics
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Boards table setup complete. Running diagnostics...';
    
    -- Check if boards table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'boards'
    ) THEN
        RAISE NOTICE 'Boards table exists: YES';
    ELSE
        RAISE NOTICE 'Boards table exists: NO (Error!)';
    END IF;
    
    -- Check if board_id column exists in tasks table
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'board_id'
    ) THEN
        RAISE NOTICE 'board_id column in tasks table: YES';
    ELSE
        RAISE NOTICE 'board_id column in tasks table: NO (Error!)';
    END IF;
    
    -- Check RLS status
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'boards' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'Row-level security on boards table: ENABLED';
    ELSE
        RAISE NOTICE 'Row-level security on boards table: DISABLED (Error!)';
    END IF;
    
    -- Check policies
    RAISE NOTICE 'Policies on boards table:';
    FOR policy_record IN
        SELECT policyname, permissive, cmd 
        FROM pg_policies 
        WHERE tablename = 'boards'
    LOOP
        RAISE NOTICE '- %: % (%)', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.permissive;
    END LOOP;
END $$; 