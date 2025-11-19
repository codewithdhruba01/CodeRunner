# Quick Start Guide

Get CodeRunner running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works!)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (takes ~2 minutes to provision)
3. Go to Settings → API in your project dashboard
4. Copy your Project URL and Anon Key

## Step 3: Configure Environment

Create `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Set Up Database

In your Supabase dashboard:

1. Go to SQL Editor
2. Paste and run this SQL:

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
  ON code_snippets FOR SELECT USING (true);

CREATE POLICY "Anyone can create code snippets"
  ON code_snippets FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_code_snippets_share_id
  ON code_snippets(share_id);
```

## Step 5: Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## You're Done!

Try these features:
1. Select "Python" from dropdown
2. Click "Run Code" to see "Hello, World!"
3. Click the moon icon to switch to dark mode
4. Click "Share" to create a shareable link
5. Try writing your own code!

## Common Issues

### Port 3000 Already in Use?
```bash
# Use a different port
PORT=3001 npm run dev
```

### Supabase Connection Error?
- Double-check your `.env.local` file
- Make sure there are no extra spaces
- Restart the dev server after changing env vars

### Database Table Missing?
- Run the SQL from Step 4 again
- Check you're in the correct project
- Verify in Table Editor that `code_snippets` exists

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [FEATURES.md](FEATURES.md) for feature list
- See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for architecture

## Need Help?

- Check browser console for errors
- Verify Supabase dashboard for database issues
- Ensure all dependencies installed correctly

Happy coding!
