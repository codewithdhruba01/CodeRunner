# Project Structure

## Directory Overview

```
coderunner/
├── app/                          # Next.js 13 App Router
│   ├── api/                      # API Routes
│   │   └── execute/
│   │       └── route.ts          # Code execution endpoint
│   ├── layout.tsx                # Root layout (theme provider)
│   ├── page.tsx                  # Main application (code editor)
│   ├── providers.tsx             # Theme provider wrapper
│   └── globals.css               # Global styles
│
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── ... (50+ components)
│   ├── code-editor.tsx           # Code editor with line numbers
│   ├── header.tsx                # App header with theme toggle
│   └── output-panel.tsx          # Output/error display
│
├── lib/                          # Utility Functions
│   ├── code-templates.ts         # Default code for each language
│   ├── supabase.ts               # Supabase client setup
│   └── utils.ts                  # Helper functions (cn)
│
├── hooks/                        # Custom React Hooks
│   └── use-toast.ts              # Toast notification hook
│
├── public/                       # Static Assets
│
├── .env.local                    # Environment variables (not in git)
├── components.json               # shadcn/ui configuration
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
│
├── README.md                     # Main documentation
├── SETUP.md                      # Quick setup guide
├── FEATURES.md                   # Feature list
└── PROJECT_STRUCTURE.md          # This file
```

## Key Files Explained

### Application Core

#### `app/page.tsx` (Main Application)
- **Purpose**: Single-page application component
- **Features**:
  - Language selector
  - Code editor integration
  - Output panel
  - Run, Reset, Copy, Share buttons
  - URL parameter handling for shared code
- **State Management**:
  - `language`: Current programming language
  - `code`: Editor content
  - `output`: Execution output
  - `error`: Compilation/runtime errors
  - `isRunning`: Execution status

#### `app/layout.tsx` (Root Layout)
- Theme provider setup
- Global styles
- Toast notifications
- Metadata (title, description)

#### `app/api/execute/route.ts` (Execution API)
- POST endpoint for code execution
- Input validation
- Language-specific execution logic
- Error handling
- Execution time tracking

### Components

#### `components/code-editor.tsx`
- Line-numbered code editor
- Auto-expanding textarea
- Syntax-aware styling
- Language-specific placeholders

#### `components/header.tsx`
- App branding (logo + title)
- Theme toggle dropdown
- Responsive design

#### `components/output-panel.tsx`
- Success/error indicators
- Execution time display
- Scrollable output
- Loading states
- Empty state messages

### Configuration

#### `lib/supabase.ts`
- Supabase client initialization
- Type definitions for database
- Environment variable handling
- SSR-safe implementation

#### `lib/code-templates.ts`
- Default code templates
- Language configurations
- File extensions mapping

## Data Flow

### Code Execution Flow
```
User clicks "Run Code"
    ↓
app/page.tsx (handleRunCode)
    ↓
POST /api/execute
    ↓
app/api/execute/route.ts
    ↓
Execute code (mock or real API)
    ↓
Return { success, output, error, executionTime }
    ↓
Update output-panel.tsx
```

### Code Sharing Flow
```
User clicks "Share"
    ↓
app/page.tsx (handleShareCode)
    ↓
Generate random share_id
    ↓
Insert into Supabase (code_snippets table)
    ↓
Create share URL with ?share=id
    ↓
Copy to clipboard
    ↓
Show success toast
```

### Loading Shared Code Flow
```
User visits /?share=abc123
    ↓
useSearchParams detects share parameter
    ↓
loadSharedCode(shareId)
    ↓
Query Supabase for code_snippets
    ↓
Set language and code state
    ↓
Update editor display
```

## Component Hierarchy

```
RootLayout
├── Providers (Theme)
│   └── Page
│       ├── Header
│       │   ├── Logo
│       │   └── ThemeToggle (DropdownMenu)
│       └── Main
│           ├── Toolbar
│           │   ├── LanguageSelect
│           │   ├── RunButton
│           │   ├── ResetButton
│           │   ├── CopyButton
│           │   └── ShareButton
│           └── EditorContainer
│               ├── CodeEditor
│               │   ├── LineNumbers
│               │   └── Textarea
│               └── OutputPanel
│                   ├── LoadingState
│                   ├── ErrorAlert
│                   └── OutputDisplay (ScrollArea)
└── Toaster (Global)
```

## Styling Architecture

### Tailwind CSS
- Utility-first approach
- Custom theme variables
- Dark mode support
- Responsive breakpoints

### CSS Variables (globals.css)
```css
:root {
  --background: ...
  --foreground: ...
  --primary: ...
  --secondary: ...
  --muted: ...
  --accent: ...
  --destructive: ...
  --border: ...
  --input: ...
  --ring: ...
}

.dark {
  /* Dark theme overrides */
}
```

## Database Schema

### `code_snippets` Table
```sql
Column       | Type         | Description
-------------|--------------|---------------------------
id           | uuid         | Primary key
share_id     | text         | Unique share identifier
language     | text         | Programming language
code         | text         | Source code
created_at   | timestamptz  | Creation timestamp
```

### Indexes
- `share_id` - Fast lookup for shared code

### RLS Policies
- Public SELECT - Anyone can read
- Public INSERT - Anyone can create

## Environment Variables

### Required
```
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anonymous key
```

### Optional (for production)
```
JUDGE0_API_KEY                # For real code execution
PISTON_API_URL                # Alternative execution service
```

## Build Output

### Production Build
- Static HTML pages
- Optimized JavaScript bundles
- CSS files with Tailwind
- API routes as serverless functions

### Build Size
- First Load JS: ~171 KB
- Page Size: ~78.5 KB
- Shared chunks: ~79.4 KB

## Performance Optimizations

1. **Code Splitting**: Automatic by Next.js
2. **Static Generation**: Where possible
3. **Lazy Loading**: Supabase client
4. **Tree Shaking**: Unused code removed
5. **Minification**: Production builds
6. **Image Optimization**: N/A (no images)

## Development Workflow

```bash
# Development
npm run dev          # Start dev server (port 3000)

# Type Checking
npm run typecheck    # Check TypeScript errors

# Linting
npm run lint         # ESLint checks

# Building
npm run build        # Production build
npm run start        # Start production server
```

## Testing Checklist

### Functionality
- [ ] Select each language
- [ ] Write and run code
- [ ] View output correctly
- [ ] See compilation errors
- [ ] Share code snippets
- [ ] Load shared code via URL
- [ ] Copy code to clipboard
- [ ] Reset to default template

### UI/UX
- [ ] Switch themes (light/dark/system)
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] All buttons clickable
- [ ] Toast notifications appear
- [ ] Loading states work

### Edge Cases
- [ ] Empty code execution
- [ ] Invalid syntax handling
- [ ] Network error handling
- [ ] Missing environment variables
- [ ] Long code/output
- [ ] Special characters in code

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase database set up
- [ ] Migration run successfully
- [ ] Build succeeds without errors
- [ ] All routes accessible
- [ ] Theme persists across pages
- [ ] Share links work correctly
- [ ] Mobile responsiveness tested

## Troubleshooting Guide

### "Invalid supabaseUrl" Error
- Check `.env.local` exists
- Verify URL format (https://...)
- Restart dev server

### Build Fails
- Run `npm run typecheck`
- Delete `.next` folder
- Reinstall dependencies

### Share Not Working
- Check Supabase credentials
- Verify database table exists
- Check browser console

### Theme Not Saving
- Check localStorage enabled
- Clear browser cache
- Verify next-themes installed

## Future Architecture

### For Real Code Execution
```
Replace: app/api/execute/route.ts
With: Judge0/Piston API integration
Add: Queue system for submissions
Add: Rate limiting
Add: User authentication
```

### For User Accounts
```
Add: Supabase Auth
Add: User profile page
Add: Saved snippets per user
Add: Private sharing options
```

### For Collaboration
```
Add: WebSocket connection
Add: Real-time code sync
Add: Multiple cursors
Add: Chat functionality
```
