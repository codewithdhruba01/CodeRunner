
🔧 SUPABASE SETUP GUIDE FOR CODE SHARING
========================================

Your code share feature is not working because Supabase is not configured.
Follow these steps to enable code sharing:

1. 📝 CREATE SUPABASE PROJECT:
   - Go to https://supabase.com
   - Create a free account
   - Click 'New Project'
   - Fill in project details and create

2. 🗄️ SETUP DATABASE:
   - In your Supabase dashboard, go to 'SQL Editor'
   - Run this SQL command:

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

3. 🔑 GET API KEYS:
   - Go to Settings → API in your Supabase dashboard
   - Copy 'Project URL' and 'anon public' key

4. ⚙️ UPDATE ENVIRONMENT VARIABLES:
   - Open .env.local file (created in your project root)
   - Replace the placeholder values:

   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

5. 🚀 RESTART DEVELOPMENT SERVER:
   - Stop current server (Ctrl+C)
   - Run: npm run dev
   - Test the share feature!

📋 WHAT THIS ENABLES:
- ✅ Generate shareable links for your code
- ✅ Load shared code from URLs
- ✅ Persistent storage of code snippets
- ✅ Cross-device code sharing

❌ WITHOUT SUPABASE:
- Share button shows helpful error message
- Load shared code shows configuration error
- Copy code button still works (local clipboard)

Need help? Check the README.md file for detailed instructions!

