/*
  # Create code snippets table for code sharing

  1. New Tables
    - `code_snippets`
      - `id` (uuid, primary key) - Unique identifier for each code snippet
      - `share_id` (text, unique) - Short unique ID for sharing URLs
      - `language` (text) - Programming language (c, cpp, java, python)
      - `code` (text) - The actual code content
      - `created_at` (timestamptz) - When the snippet was created
      
  2. Security
    - Enable RLS on `code_snippets` table
    - Add policy for anyone to read snippets (public sharing)
    - Add policy for anyone to create snippets (anonymous sharing)

  3. Indexes
    - Add index on `share_id` for fast lookups
*/

CREATE TABLE IF NOT EXISTS code_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id text UNIQUE NOT NULL,
  language text NOT NULL,
  code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE code_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read code snippets"
  ON code_snippets
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create code snippets"
  ON code_snippets
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_code_snippets_share_id ON code_snippets(share_id);