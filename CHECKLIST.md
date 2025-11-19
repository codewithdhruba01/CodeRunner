# Setup & Testing Checklist

Use this checklist to ensure everything is working correctly.

## Initial Setup

### Prerequisites
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Supabase account created
- [ ] Git installed (optional)

### Installation
- [ ] Repository cloned/downloaded
- [ ] Navigate to project directory
- [ ] Run `npm install`
- [ ] All dependencies installed successfully
- [ ] No errors in terminal

### Supabase Configuration
- [ ] Supabase project created
- [ ] Project provisioned (2-3 minutes)
- [ ] Project URL copied
- [ ] Anon key copied
- [ ] `.env.local` file created
- [ ] Environment variables added:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] No spaces or quotes around values

### Database Setup
- [ ] Opened Supabase SQL Editor
- [ ] Ran migration SQL
- [ ] Table `code_snippets` created
- [ ] RLS enabled on table
- [ ] Policies created (2 policies)
- [ ] Index created on `share_id`
- [ ] Verified in Table Editor

### Build & Run
- [ ] Run `npm run build`
- [ ] Build completed successfully
- [ ] No TypeScript errors
- [ ] Run `npm run dev`
- [ ] Development server started
- [ ] Opened http://localhost:3000
- [ ] Page loads without errors

---

## Feature Testing

### Basic UI
- [ ] Page loads correctly
- [ ] Header displays with logo
- [ ] "CodeRunner" title visible
- [ ] Theme toggle button visible
- [ ] Language selector dropdown visible
- [ ] All action buttons visible
- [ ] Code editor panel visible
- [ ] Output panel visible
- [ ] No console errors

### Language Selection
- [ ] Dropdown opens on click
- [ ] Python option available
- [ ] C option available
- [ ] C++ option available
- [ ] Java option available
- [ ] Selecting Python loads Python template
- [ ] Selecting C loads C template
- [ ] Selecting C++ loads C++ template
- [ ] Selecting Java loads Java template

### Code Editor
- [ ] Can click inside editor
- [ ] Can type text
- [ ] Line numbers display
- [ ] Line numbers update when adding lines
- [ ] Editor scrolls with long code
- [ ] Code persists when switching focus
- [ ] Placeholder text visible when empty

### Code Execution - Python
- [ ] Select Python
- [ ] Default code shows `print("Hello, World!")`
- [ ] Click "Run Code"
- [ ] Button shows "Running..." briefly
- [ ] Output panel shows output
- [ ] Output displays: "Hello, World!"
- [ ] Green checkmark appears
- [ ] Execution time displayed

### Code Execution - C
- [ ] Select C
- [ ] Default code shows printf example
- [ ] Click "Run Code"
- [ ] Output displays: "Hello, World!"
- [ ] No compilation errors
- [ ] Execution time displayed

### Code Execution - C++
- [ ] Select C++
- [ ] Default code shows cout example
- [ ] Click "Run Code"
- [ ] Output displays: "Hello, World!"
- [ ] No compilation errors
- [ ] Execution time displayed

### Code Execution - Java
- [ ] Select Java
- [ ] Default code shows System.out.println
- [ ] Click "Run Code"
- [ ] Output displays: "Hello, World!"
- [ ] No compilation errors
- [ ] Execution time displayed

### Error Handling - Python
- [ ] Write invalid Python code: `prin("test")`
- [ ] Click "Run Code"
- [ ] Error panel appears
- [ ] Red X icon visible
- [ ] Error message displayed
- [ ] Error message is meaningful

### Error Handling - C
- [ ] Remove `#include <stdio.h>`
- [ ] Click "Run Code"
- [ ] Compilation error displayed
- [ ] Error mentions missing headers

### Error Handling - C++
- [ ] Remove `int main()` function
- [ ] Click "Run Code"
- [ ] Compilation error displayed
- [ ] Error mentions missing main function

### Error Handling - Java
- [ ] Remove `public static void main`
- [ ] Click "Run Code"
- [ ] Error displayed
- [ ] Error mentions main method

### Reset Functionality
- [ ] Write custom code
- [ ] Click "Reset" button
- [ ] Code returns to default template
- [ ] Output panel clears
- [ ] Error messages clear

### Copy Code Functionality
- [ ] Write some code
- [ ] Click "Copy Code" button
- [ ] Button text changes to "Copied"
- [ ] Toast notification appears
- [ ] Toast says "Code copied!"
- [ ] Paste in text editor - code is there
- [ ] Button returns to "Copy Code"

### Share Code Functionality
- [ ] Write custom code: `print("Testing share")`
- [ ] Click "Share" button
- [ ] Toast notification appears
- [ ] Toast says "Share link copied!"
- [ ] Paste link in new browser tab
- [ ] Link format: `?share=xxxxxxxx`
- [ ] Code loads in new tab
- [ ] Language matches original
- [ ] Code matches original
- [ ] Success toast appears

### Load Shared Code
- [ ] Create a share link
- [ ] Copy the URL
- [ ] Open in incognito/private window
- [ ] Code loads correctly
- [ ] Can run the shared code
- [ ] Can modify the shared code
- [ ] Can share again (creates new link)

### Theme Switching
- [ ] Click theme toggle button
- [ ] Dropdown menu opens
- [ ] "Light" option visible
- [ ] "Dark" option visible
- [ ] "System" option visible
- [ ] Click "Light" - UI changes to light
- [ ] Click "Dark" - UI changes to dark
- [ ] Click "System" - follows OS theme
- [ ] Theme persists on page reload
- [ ] No flash of wrong theme

---

## Responsive Design Testing

### Mobile (< 768px)
- [ ] Open in mobile view (DevTools)
- [ ] Header fits screen width
- [ ] Logo visible
- [ ] Title readable
- [ ] Theme toggle accessible
- [ ] Language selector full width
- [ ] Buttons stack vertically if needed
- [ ] Editor panel full width
- [ ] Output panel below editor
- [ ] All text readable
- [ ] No horizontal scroll
- [ ] Touch targets large enough

### Tablet (768px - 1024px)
- [ ] Resize to tablet width
- [ ] Layout adjusts appropriately
- [ ] Two-column layout or stacked
- [ ] All controls accessible
- [ ] Text properly sized
- [ ] No overlapping elements

### Desktop (> 1024px)
- [ ] Resize to desktop width
- [ ] Two-column layout (editor + output)
- [ ] Panels side by side
- [ ] Good use of space
- [ ] Not too wide or narrow
- [ ] Comfortable reading

---

## Browser Compatibility

### Chrome
- [ ] All features work
- [ ] No console errors
- [ ] Smooth animations
- [ ] Theme switching works

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Clipboard works
- [ ] Theme switching works

### Safari
- [ ] All features work
- [ ] No console errors
- [ ] Clipboard works
- [ ] Theme switching works

### Edge
- [ ] All features work
- [ ] No console errors
- [ ] All buttons clickable

---

## Performance Testing

### Load Time
- [ ] Page loads in < 3 seconds
- [ ] No visible loading delays
- [ ] Smooth transitions

### Execution Speed
- [ ] Code runs in < 2 seconds
- [ ] UI remains responsive
- [ ] No freezing during execution

### Build Size
- [ ] Run `npm run build`
- [ ] Check output size
- [ ] First Load JS < 200 KB
- [ ] Page size reasonable

---

## Production Readiness

### Environment
- [ ] All env variables set
- [ ] No hardcoded secrets
- [ ] No console.logs in production code
- [ ] Error handling in place

### Security
- [ ] RLS enabled on database
- [ ] Policies restrictive
- [ ] No SQL injection risks
- [ ] API routes validated

### Code Quality
- [ ] Run `npm run typecheck` - passes
- [ ] Run `npm run lint` - passes
- [ ] Run `npm run build` - succeeds
- [ ] No TypeScript errors
- [ ] No ESLint warnings

---

## Issue Resolution

If any checkbox fails, refer to:
- **SETUP.md** for configuration issues
- **README.md** for feature documentation
- **PROJECT_STRUCTURE.md** for code issues
- **QUICKSTART.md** for common problems

---

## Completion

### All Checks Passed?
- [ ] Setup complete (all setup items)
- [ ] Features working (all feature tests)
- [ ] Responsive (all device sizes)
- [ ] Browsers compatible (tested browsers)
- [ ] Performance acceptable
- [ ] Production ready

### Ready to Deploy?
- [ ] All tests passed
- [ ] Documentation read
- [ ] Production checklist complete
- [ ] Deployment target chosen
- [ ] Environment variables ready

---

## Notes

Use this space to note any issues or customizations:

```
Date: ___________

Issues Found:
1.
2.
3.

Customizations Made:
1.
2.
3.

Deployment URL:
___________

```

---

**Congratulations!** 🎉

If all checkboxes are marked, your CodeRunner installation is complete and working perfectly!
