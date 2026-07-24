# Architecture

## System Overview

The Collaborative Document Editor is a Next.js 16 full-stack application with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Client                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Sign In/Up   │  │  Dashboard   │  │    Editor    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                 │              │
│         └──────────────────┼─────────────────┘              │
│                      HTTP Requests                           │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
  ┌─────────────┐   ┌────────────────┐  ┌────────────────┐
  │ Better Auth │   │ Server Actions │  │  API Routes    │
  │   Handler   │   │  (Documents)   │  │  (Seed, etc)   │
  └─────────────┘   └────────────────┘  └────────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────────────┐
                    │    Neon DB     │
                    │  PostgreSQL    │
                    └────────────────┘
```

## Component Architecture

### Frontend Components

#### Authentication Flow
- **Sign In/Sign Up Pages**: Server components that check session and redirect authenticated users to dashboard
- **Auth Form**: Shared client component for email/password authentication using Better Auth client
- **Session Management**: Browser cookies managed by Better Auth

#### Dashboard
- **DashboardClient**: Client component displaying:
  - User documents (owned)
  - Shared documents
  - Create new document form
  - Document list with delete functionality
- **Document Operations**: Uses SWR for data fetching and caching

#### Editor
- **EditorClient**: Client component with:
  - Tiptap rich text editor with toolbar
  - Auto-save functionality (1s debounce)
  - Share dialog for permission management
  - Edit/View mode toggle based on permissions
- **EditorToolbar**: Formatting controls (bold, italic, headings, lists, etc.)
- **ShareDialog**: Modal for sharing documents with other users

### Backend Architecture

#### Authentication (Better Auth)
- **Provider**: Email + password with argon2 hashing
- **Session**: Cookie-based with configurable origin validation
- **Adapters**: Neon Postgres with Drizzle ORM
- **Key Files**:
  - `lib/auth.ts`: Server configuration
  - `lib/auth-client.ts`: Client library
  - `app/api/auth/[...all]/route.ts`: HTTP handler

#### Server Actions
- **Location**: `app/actions/documents.ts`
- **Pattern**: `getUserId()` helper for session retrieval
- **Authorization**: Per-action permission checks before database operations
- **Revalidation**: Uses `revalidatePath()` for cache invalidation
- **Functions**:
  - Document CRUD (Create, Read, Update, Delete)
  - Document sharing and permission management

#### Database Layer
- **ORM**: Drizzle ORM over pg library
- **Connection**: Shared pool with Better Auth
- **Schema**: Defined in `lib/db/schema.ts`
- **Advantages**:
  - Type-safe queries
  - Automatic schema inference
  - Single connection pool for efficiency

## Data Flow

### Create Document Flow
```
Client (Dashboard) 
  → createDocument action (title, content)
    → getUserId() - verify session
    → db.insert(document) - create record
    → revalidatePath() - invalidate cache
    → Return document ID
  → router.push() - navigate to editor
```

### Edit Document Flow
```
Client (Editor)
  → User types in Tiptap editor
  → 1s debounce on changes
  → updateDocument action (docId, content)
    → getUserId() - verify session
    → Check ownership
    → db.update() - save changes
    → Return success
  → Display "Saved at HH:MM:SS"
```

### Share Document Flow
```
Client (ShareDialog)
  → User enters email and selects permission
  → shareDocument action (docId, email, permission)
    → getUserId() - verify session
    → Check ownership
    → Find target user by email
    → Upsert into document_share table
    → revalidatePath() - refresh shares list
  → Refresh shares in dialog
```

### Permission Check Flow
```
Server Action
  → getUserId() - get authenticated user
  → db.query.document.findFirst(where: id = docId)
  → If ownerId === userId → full access
  → Else check documentShare table
  → If permission = VIEWER → read-only
  → If permission = EDITOR → read-write
  → Else → throw error
```

## Security Model

### Authentication
- **Better Auth**: Battle-tested auth framework with security best practices
- **Password Hashing**: Argon2 with cost parameters
- **Session**: Cryptographically secure tokens
- **CSRF**: Built into Better Auth

### Authorization
- **No RLS**: Neon doesn't have RLS, so authorization is app-level
- **User Scoping**: Every query includes `userId` filter
- **Permission Checks**: Before every mutation that touches user data
- **Validation**: Server actions validate permission before returning data

### Data Isolation
```ts
// Example - document query scoped to user
export async function getDocuments() {
  const userId = await getUserId() // Verify session
  
  const ownedDocs = await db
    .select()
    .from(document)
    .where(eq(document.ownerId, userId)) // User filter
```

## State Management

### Client-Side
- **SWR**: For data fetching with automatic caching and revalidation
- **React State**: For UI state (modals, loading states, form inputs)
- **Next.js Router**: For navigation

### Server-Side
- **Drizzle ORM**: Connection pooling and prepared statements
- **Better Auth**: Session storage in database

## Performance Considerations

### Caching
- **SWR**: Automatic cache with configurable TTL
- **revalidatePath()**: On-demand cache invalidation
- **Browser Cookies**: Session cache (1-7 days)

### Database
- **Prepared Statements**: Drizzle uses parameterized queries
- **Indexes**: On foreign keys and frequently queried fields (email, userId, documentId)
- **Connection Pooling**: Single shared pool across app

### Frontend
- **Code Splitting**: Next.js App Router automatic splitting
- **Dynamic Imports**: For heavy components (Tiptap)
- **Debouncing**: Auto-save waits 1 second for user inactivity

## Error Handling

### Authentication Errors
- Invalid credentials → Form error message
- No session → Redirect to sign-in
- CORS/origin errors → Better Auth validation

### Document Errors
- Not found → 404 with redirect option
- Access denied → Caught and displayed to user
- Database errors → Logged server-side, user-friendly error message

### Auto-Save Errors
- Silently logged to console
- Status changes to reflect error state
- User can manually save via reload

## Extension Points

### Adding OAuth
1. Configure provider in `lib/auth.ts`
2. Add to trustedOrigins if needed
3. Update auth form UI to show provider button

### Adding Document Versions
1. Create `document_version` table
2. Add version creation on save
3. Create version browser UI component

### Adding Real-Time Collaboration
1. Replace single-user locking with operational transform (Yjs/Automerge)
2. Add WebSocket server
3. Share editor state across connections

### Adding File Upload
1. Integrate Vercel Blob storage
2. Add upload endpoint
3. Store file references in document

## Development Workflow

### Creating a New Feature
1. Add database schema in `lib/db/schema.ts`
2. Create server action in `app/actions/*.ts`
3. Build UI component in `components/*.tsx`
4. Add permission checks in server action
5. Test in browser

### Testing Changes
1. Development server watches file changes
2. Hot Module Replacement applies CSS/client changes
3. Server changes trigger rebuild
4. Test in browser at http://localhost:3000

### Debugging
- Browser DevTools: React DevTools, Network tab, Console
- Server Logs: Check terminal output for errors
- Database: Use Neon console or pgAdmin to inspect tables

## Deployment

### Vercel Deployment
```bash
vercel deploy
```

### Environment Variables Required
- `DATABASE_URL`: Neon connection string
- `BETTER_AUTH_SECRET`: Authentication secret

### Post-Deployment
1. Run seed endpoint to create test users (if needed)
2. Verify auth works with production URL
3. Test document operations
4. Monitor error logs
