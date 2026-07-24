# Deployment Guide

## Overview

The Collaborative Document Editor is a Next.js 16 application that can be deployed to Vercel with a Neon PostgreSQL database.

## Prerequisites

- Neon PostgreSQL database created
- Vercel account with project linked to GitHub
- Better Auth secret generated (`openssl rand -base64 32`)

## Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

```
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?schema=public
BETTER_AUTH_SECRET=[your-generated-secret]
```

The application has built-in fallback logic for `BETTER_AUTH_URL`:
1. Explicit `BETTER_AUTH_URL` if set
2. Production URL from `VERCEL_PROJECT_PRODUCTION_URL`
3. Preview URL from `VERCEL_URL`
4. Development URL

## Deployment Steps

### 1. Prepare the Repository

```bash
# Clone and install dependencies
git clone [your-repo]
cd collaborative-document-editor
pnpm install
```

### 2. Set Environment Variables in Vercel

In your Vercel project dashboard:

1. Go to Settings → Environment Variables
2. Add `DATABASE_URL` pointing to your Neon database
3. Add `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`)

### 3. Deploy

```bash
# Deploy to Vercel
vercel deploy --prod
```

Or push to your GitHub branch that's connected to Vercel for automatic deployment.

### 4. Run Database Migrations

The database schema is created via Neon SQL queries. Tables are:
- user
- session
- account
- verification
- document
- document_share

These are created during initial setup. If tables don't exist:

1. Access your Neon console
2. Run the SQL from `neon-setup.sql` (see below)

### 5. Seed Test Data (Optional)

After deployment, seed the database with test users:

```bash
curl https://[your-deployment-url]/api/seed
```

This creates:
- alice@example.com / password123
- bob@example.com / password123
- charlie@example.com / password123

## Database Schema Setup

If you're setting up the database fresh, create these tables in Neon:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT,
  image TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  expiresAt TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  userId TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Accounts table
CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt TIMESTAMP,
  refreshTokenExpiresAt TIMESTAMP,
  scope TEXT,
  password TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE,
  UNIQUE(accountId, providerId)
);

-- Verification codes table
CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS "document" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content JSON NOT NULL,
  ownerId TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Document sharing table
CREATE TABLE IF NOT EXISTS "document_share" (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL,
  sharedWithId TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'VIEWER',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (documentId) REFERENCES "document"(id) ON DELETE CASCADE,
  FOREIGN KEY (sharedWithId) REFERENCES "user"(id) ON DELETE CASCADE,
  UNIQUE(documentId, sharedWithId)
);
```

## Monitoring & Debugging

### Vercel Logs

View deployment logs in Vercel dashboard:

```bash
# Via Vercel CLI
vercel logs
```

### Database Monitoring

Access Neon console to monitor:
- Active connections
- Query performance
- Database size
- Backups

### Error Tracking

Set up Sentry or similar to track:
- Authentication errors
- Document operation failures
- Database connection issues

## Performance Optimization

### 1. Database Indexes

Consider adding indexes for frequently queried columns:

```sql
CREATE INDEX idx_document_ownerId ON "document"(ownerId);
CREATE INDEX idx_document_share_userId ON "document_share"(sharedWithId);
CREATE INDEX idx_user_email ON "user"(email);
```

### 2. Caching

The application uses:
- SWR for client-side caching
- Next.js ISR (if needed for static content)
- Browser cookies for sessions

### 3. Database Connection Pool

The Drizzle ORM automatically manages connection pooling. Monitor:
- Active connections in Neon
- Query response times
- Connection wait times

## Scaling Considerations

### Horizontal Scaling
- Vercel automatically scales Node.js functions
- Each deployment gets independent containers
- No session affinity required (sessions stored in database)

### Database Scaling
Neon handles:
- Connection pooling via connection string
- Automatic backups
- Read replicas (if needed)

For high-traffic scenarios:
1. Use Neon's auto-scaling features
2. Enable query caching
3. Add read replicas for reporting

### Content Delivery
- Vercel CDN automatically caches static assets
- Next.js handles image optimization
- Consider Vercel Blob for document attachments

## Disaster Recovery

### Database Backups

Neon automatically backs up:
- Point-in-time recovery (28 days)
- Automated backups (daily)
- Manual snapshots available

### Data Retention

Documents and user data:
- Stored permanently in Neon
- Backed up according to Neon policy
- Available via Neon recovery tools

## Troubleshooting Deployment

### "Invalid origin" on login

The application falls back through these URLs:
1. `BETTER_AUTH_URL` environment variable (if set)
2. `https://{VERCEL_PROJECT_PRODUCTION_URL}`
3. `https://{VERCEL_URL}` (preview deployments)

If login fails:
- Check environment variables are set
- Verify `DATABASE_URL` is accessible
- Ensure `BETTER_AUTH_SECRET` is non-empty

### Database Connection Errors

If database won't connect:
- Verify `DATABASE_URL` is correct
- Check Neon dashboard for active connections
- Ensure firewall allows Vercel IP addresses
- Restart Neon connection

### Session Errors

If sessions aren't persisting:
- Check browser cookie settings
- Verify Better Auth secret is set
- Look for CORS/origin validation errors in logs

## Rollback Procedure

### Via Vercel Dashboard

1. Go to Deployments
2. Find previous successful deployment
3. Click three dots → Promote to Production

### Via Vercel CLI

```bash
# List deployments
vercel list

# Rollback to previous
vercel rollback
```

### Database Rollback

If data corruption occurs:
1. Access Neon console
2. Use point-in-time recovery
3. Restore to previous timestamp

## Monitoring Checklist

- [ ] Database connection is stable
- [ ] Authentication working on production URL
- [ ] Documents can be created/edited/shared
- [ ] Auto-save is functioning
- [ ] Error logs are clean
- [ ] Performance is acceptable (< 1s page load)

## Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- Check Neon documentation: https://neon.tech/docs
- Review Better Auth docs: https://better-auth.com
