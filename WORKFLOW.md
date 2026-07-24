# Development Workflow

## Getting Started

### Local Setup

```bash
# Clone repository
git clone [repository-url]
cd collaborative-document-editor

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Neon database URL and Better Auth secret

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

### Database Setup

If this is a fresh setup:

1. Get your Neon database connection string
2. Set `DATABASE_URL` in `.env.local`
3. Run seed endpoint to create test users:
   ```bash
   curl http://localhost:3000/api/seed
   ```

## Project Structure

```
project-root/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── editor/[id]/       # Document editor
│   ├── sign-in/           # Sign-in page
│   ├── sign-up/           # Sign-up page
│   ├── actions/           # Server actions
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Root page
│
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard-client.tsx
│   ├── editor-client.tsx
│   ├── editor-toolbar.tsx
│   └── share-dialog.tsx
│
├── lib/                   # Utilities and config
│   ├── auth.ts           # Better Auth config
│   ├── auth-client.ts    # Better Auth client
│   └── db/               # Database layer
│
├── public/               # Static assets
├── package.json
├── tsconfig.json
└── README.md
```

## Common Tasks

### Adding a New Feature

#### 1. Define the Database Schema

If your feature needs data storage:

```ts
// lib/db/schema.ts
export const myTable = pgTable('my_table', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id),
  data: text('data').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
```

#### 2. Create Server Actions

```ts
// app/actions/myFeature.ts
'use server'

import { getUserId } from '@/lib/auth'
import { db } from '@/lib/db'

export async function createMyData(input: string) {
  const userId = await getUserId()
  
  // Perform permission checks
  // Insert into database
  // Revalidate cache
}
```

#### 3. Build the UI Component

```tsx
// components/my-feature.tsx
'use client'

import { useState } from 'react'
import { createMyData } from '@/app/actions/myFeature'

export function MyFeature() {
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createMyData('data')
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false)
    }
  }
  
  return <form onSubmit={handleSubmit}>{/* ... */}</form>
}
```

#### 4. Integrate into Page

```tsx
// app/my-page/page.tsx
import { MyFeature } from '@/components/my-feature'

export default function Page() {
  return (
    <div>
      <MyFeature />
    </div>
  )
}
```

### Creating a New Page

1. Create folder in `app/`
2. Add `page.tsx` (or `layout.tsx` for nested routes)
3. Use Server Components by default
4. Use `'use client'` only when needed (interactivity)

### Modifying a Server Action

1. Update logic in `app/actions/*.ts`
2. Changes are picked up automatically with Hot Module Replacement
3. Test by calling from UI component

### Adding UI Components

Use shadcn CLI:

```bash
# Add Button component
npx shadcn@latest add button

# Add Dialog component
npx shadcn@latest add dialog
```

This adds the component to `components/ui/`

### Styling

- Use Tailwind CSS classes
- Follow Tailwind spacing scale (p-4, gap-2, etc.)
- Use semantic color classes (bg-primary, text-foreground, etc.)
- Customize via `globals.css` theme variables

Example:

```tsx
<div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-lg">
  <h2 className="text-lg font-semibold">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>
```

## Testing

### Manual Testing

1. Start dev server: `pnpm dev`
2. Open browser: `http://localhost:3000`
3. Test user flow:
   - Sign in: alice@example.com / password123
   - Create document
   - Edit and save
   - Share with another user
   - Sign in as other user and verify access

### Browser DevTools

- **React DevTools**: Inspect component tree
- **Network tab**: Monitor API calls
- **Console**: Check for errors
- **Application tab**: View cookies and local storage

### Database Inspection

Access Neon SQL editor to query tables:

```sql
-- View all documents
SELECT * FROM "document" ORDER BY "createdAt" DESC;

-- Check sharing permissions
SELECT * FROM "document_share" WHERE "documentId" = '[doc-id]';

-- View user sessions
SELECT * FROM "session" WHERE "userId" = '[user-id]';
```

## Debugging

### Enable Detailed Logging

Add `console.log` statements:

```ts
console.log('[v0] Function called with:', data)
```

View in:
- Browser DevTools Console (client)
- Terminal (server)

### Check for Errors

1. **Browser Console** (F12):
   - Client-side errors
   - Network errors
   - CORS issues

2. **Terminal**:
   - Server errors
   - Database query errors
   - Build errors

3. **Neon Dashboard**:
   - Connection errors
   - Query performance
   - Database locks

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid origin" on login | Browser origin not in trusted list | Check BETTER_AUTH_URL or use production |
| 404 on API call | Route doesn't exist | Check app router path |
| Database connection refused | DATABASE_URL not set | Set env var in .env.local |
| Stale data | SWR cache not invalidated | Add revalidatePath() in server action |
| Component not updating | Missing 'use client' directive | Add to top of file |

## Code Standards

### File Naming

- Components: PascalCase (`DashboardClient.tsx`)
- Pages: lowercase (`page.tsx`)
- Actions: camelCase (`documents.ts`)
- Utilities: camelCase (`db.ts`)

### Component Organization

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Types
interface Props {
  title: string
}

// Component
export function MyComponent({ title }: Props) {
  const [state, setState] = useState('')
  
  return <div>{title}</div>
}
```

### Error Handling

Server actions:

```ts
try {
  // Do work
} catch (error) {
  console.error('Action failed:', error)
  throw error
}
```

UI components:

```tsx
const [error, setError] = useState<string | null>(null)

try {
  await serverAction()
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error')
}
```

## Performance Tips

1. **Use SWR for data fetching**:
   ```tsx
   const { data } = useSWR('key', fetchFunction)
   ```

2. **Debounce expensive operations**:
   ```ts
   useRef(setTimeout(() => { /* action */ }, 1000))
   ```

3. **Lazy load heavy components**:
   ```tsx
   import dynamic from 'next/dynamic'
   const Editor = dynamic(() => import('@/components/editor'))
   ```

4. **Use Server Components by default**:
   - Reduces JavaScript sent to browser
   - Direct database access
   - Secrets safe from client

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
pnpm dev

# Commit changes
git add .
git commit -m "feat: add my feature"

# Push to remote
git push origin feature/my-feature

# Create pull request
# After review, merge to main
```

## Deployment Checklist

Before pushing to production:

- [ ] All tests pass
- [ ] No console errors
- [ ] Database migrations tested
- [ ] Environment variables set
- [ ] Performance acceptable
- [ ] Security review done

## Useful Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start

# Run linter
pnpm lint

# Type check
pnpm type-check

# Deploy to Vercel
vercel deploy
```

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tiptap Editor](https://tiptap.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better Auth](https://better-auth.com)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

## Asking for Help

When stuck:

1. Check the README and ARCHITECTURE docs
2. Search similar issues in codebase
3. Try browser DevTools to debug
4. Ask in code comments with `@todo` or `@fixme`
