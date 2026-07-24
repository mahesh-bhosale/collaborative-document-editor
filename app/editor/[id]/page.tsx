import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getDocument } from '@/app/actions/documents'
import { EditorClient } from '@/components/editor-client'
import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'

export const metadata = {
  title: 'Editor - DocFlow',
  description: 'Edit your collaborative document',
}

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const { id } = await params

  try {
    const { doc, permission } = await getDocument(id)

    return (
      <div className="min-h-screen bg-background">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2 shrink-0 group">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-violet-500/25 transition-shadow">
                  <span className="text-white text-xs font-bold">D</span>
                </div>
                <span className="font-semibold text-foreground hidden sm:block">DocFlow</span>
              </Link>
              {/* Breadcrumb */}
              <span className="text-muted-foreground/40 select-none hidden sm:block">/</span>
              <div className="flex items-center gap-2 min-w-0 hidden sm:flex">
                <LayoutDashboard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate">
                  Dashboard
                </Link>
              </div>
              <span className="text-muted-foreground/40 select-none hidden sm:block">/</span>
              <span className="text-sm font-medium text-foreground truncate max-w-xs hidden sm:block">
                {doc.title || 'Untitled'}
              </span>
            </div>

            {/* Right side — permission badge */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  permission === 'OWNER'
                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                    : permission === 'EDITOR'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {permission === 'OWNER' ? 'Owner' : permission === 'EDITOR' ? 'Editor' : 'Viewer'}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <EditorClient
            docId={id}
            initialContent={doc.content}
            permission={permission as 'VIEWER' | 'EDITOR' | 'OWNER'}
            title={doc.title}
          />
        </main>
      </div>
    )
  } catch {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don&apos;t have permission to access this document. Ask the owner to share it with you.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25"
          >
            <LayoutDashboard className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }
}
