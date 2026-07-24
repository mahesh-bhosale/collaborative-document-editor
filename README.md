# Collaborative Document Editor

A full-stack document editor built with Next.js 16, Tiptap, Drizzle ORM, and Better Auth. Create, edit, and share rich text documents with fine-grained access control.

## Features

- **User Authentication**: Email + password authentication powered by Better Auth
- **Document Management**: Create, edit, delete, and manage documents
- **Rich Text Editing**: Full-featured editor using Tiptap with formatting toolbar
- **Document Sharing**: Share documents with other users as viewers or editors
- **Auto-Save**: Documents automatically save as you type
- **Permission Control**: Fine-grained access control with VIEWER and EDITOR permissions
- **Session Management**: Secure session-based authentication

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Editor**: Tiptap with StarterKit extensions
- **Backend**: Next.js Server Actions, Better Auth
- **Database**: Neon Postgres with Drizzle ORM
- **Authentication**: Better Auth with email/password
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Neon Postgres database
- Better Auth secret (generate with: `openssl rand -base64 32`)

### Environment Setup

Set these environment variables in your Vercel project:

```
DATABASE_URL=postgresql://...     # Your Neon database URL
BETTER_AUTH_SECRET=<random-32>    # Generate with: openssl rand -base64 32
```

### Installation

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The application will be available at `http://localhost:3000`

### Database Setup

The database schema is automatically created in Neon. To seed test users:

```bash
curl http://localhost:3000/api/seed
```

This creates three test users:
- alice@example.com / password123
- bob@example.com / password123
- charlie@example.com / password123

## Project Structure

```
app/
  ├── api/
  │   ├── auth/[...all]/        # Better Auth handler
  │   └── seed/                 # Database seeding endpoint
  ├── dashboard/                # Dashboard page
  ├── editor/[id]/              # Document editor
  ├── sign-in/                  # Sign-in page
  ├── sign-up/                  # Sign-up page
  ├── actions/
  │   └── documents.ts          # Document server actions
  └── layout.tsx

components/
  ├── dashboard-client.tsx      # Dashboard UI component
  ├── editor-client.tsx         # Editor UI component
  ├── editor-toolbar.tsx        # Formatting toolbar
  ├── share-dialog.tsx          # Share permissions dialog
  └── ui/                       # shadcn UI components

lib/
  ├── auth.ts                   # Better Auth configuration
  ├── auth-client.ts            # Better Auth client
  └── db/
      ├── index.ts              # Drizzle ORM setup
      └── schema.ts             # Database schema
```

## Database Schema

### Tables

**user**: User account information
- id: UUID
- email: Unique email
- name: User display name
- emailVerified: Boolean
- image: Profile image URL
- createdAt, updatedAt: Timestamps

**session**: Session management (Better Auth)
- id, token, expiresAt: Session info
- userId: Reference to user

**account**: Account credentials (Better Auth)
- id, accountId, providerId: Account identifiers
- userId: Reference to user
- password: Hashed password (argon2)

**verification**: Email verification (Better Auth)
- id, identifier, value, expiresAt: Verification codes

**document**: Document storage
- id: UUID
- title: Document title
- content: Tiptap JSON content
- ownerId: Reference to document owner
- createdAt, updatedAt: Timestamps

**document_share**: Sharing permissions
- id: UUID
- documentId: Reference to document
- sharedWithId: Reference to user
- permission: VIEWER or EDITOR
- createdAt, updatedAt: Timestamps

## API Endpoints

### Authentication

- `GET/POST /api/auth/[...all]` - Better Auth handler

### Seeding

- `GET /api/seed` - Populate database with test users

## Server Actions

### Document Operations

Located in `app/actions/documents.ts`:

- `getDocuments()` - Get user's documents and shared documents
- `getDocument(docId)` - Get single document with permission check
- `createDocument(title, content)` - Create new document
- `updateDocument(docId, updates)` - Update document content/title
- `deleteDocument(docId)` - Delete document (owner only)
- `shareDocument(docId, email, permission)` - Share with user
- `getDocumentShares(docId)` - Get sharing permissions (owner only)
- `removeDocumentShare(docId, shareId)` - Revoke access

## Authentication Flow

1. User signs up/in with email and password
2. Better Auth validates credentials
3. Session cookie is set in browser
4. Protected pages check session via `auth.api.getSession()`
5. Redirect to `/sign-in` if no valid session

## Document Permissions

- **Owner**: Full access (read, write, share, delete)
- **Editor**: Can edit document content
- **Viewer**: Read-only access

## Auto-Save Feature

The editor automatically saves changes 1 second after the user stops typing. The save status is displayed in the editor toolbar ("Saving..." / "Saved at HH:MM:SS").

## Development

### Run Tests

```bash
pnpm test
```

### Build for Production

```bash
pnpm build
```

### Deploy to Vercel

```bash
vercel deploy
```

## Troubleshooting

### "Invalid origin" error on login

This occurs when the BETTER_AUTH_URL environment variable doesn't match the browser's origin. The auth configuration automatically falls back through:

1. `BETTER_AUTH_URL` (if set)
2. `https://{VERCEL_PROJECT_PRODUCTION_URL}`
3. `https://{VERCEL_URL}` (preview)
4. `V0_RUNTIME_URL` (v0 preview)

### Database connection errors

Ensure `DATABASE_URL` is correctly set and points to your Neon database.

### Session cookie not persisting

In development mode, cookies are configured with `sameSite: "none"` and `secure: true` to work with cross-site iframes (v0 preview). This is necessary for the v0 environment.

## License

MIT

## Support

For issues or questions, please create a GitHub issue or contact support.
