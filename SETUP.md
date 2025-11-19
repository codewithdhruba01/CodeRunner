# Quick Setup Guide

## Supabase Configuration

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details and wait for setup to complete

### Step 2: Get API Credentials

1. In your Supabase project dashboard, go to Settings → API
2. Copy the following:
   - **Project URL** (under Project Configuration)
   - **Anon/Public Key** (under Project API keys)

### Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run Database Migration

The database table is automatically created. You can verify by going to:

1. Supabase Dashboard → Table Editor
2. You should see a `code_snippets` table

If the table doesn't exist, create it manually:

1. Go to SQL Editor in Supabase
2. Run the following SQL:

```sql
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
```

## Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

## Troubleshooting

### Error: "Invalid supabaseUrl"

- Check that your `.env.local` file exists
- Verify the Supabase URL is correct (should start with https://)
- Restart your development server after adding env variables

### Code execution not working

- This is expected - the current version uses mock execution
- See README.md for integrating real code execution APIs

### Shared links not working

- Verify Supabase is configured correctly
- Check browser console for errors
- Ensure RLS policies are set up correctly

### Build errors

- Run `npm run typecheck` to find TypeScript errors
- Make sure all dependencies are installed
- Try deleting `.next` folder and rebuilding

## Next Steps

1. Test the application locally
2. Try writing and running code in different languages
3. Test the share functionality
4. Switch between dark and light themes
5. Test on mobile devices

For production deployment, see README.md for deployment instructions.
