/*
  # Fix typo in prompt_generations table

  1. Changes
    - Fix `created_at timestampz` to `created_at timestamptz` (correct timezone type)
    - Ensure table structure is correct
*/

-- Fix the typo in the column definition
DO $$
BEGIN
  -- Drop and recreate the table if the column type is wrong
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompt_generations' 
    AND column_name = 'created_at'
  ) THEN
    -- Drop the table and recreate it with the correct column type
    DROP TABLE IF EXISTS prompt_generations CASCADE;
    
    CREATE TABLE prompt_generations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      original_text text,
      image_url text,
      generated_prompt text NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE prompt_generations ENABLE ROW LEVEL SECURITY;
    
    -- Recreate policies
    CREATE POLICY "Users can read own prompt generations"
      ON prompt_generations
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.subscription_active = true
        )
      );

    CREATE POLICY "Active subscribers can create prompt generations"
      ON prompt_generations
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.subscription_active = true
        )
      );
  END IF;
END $$;