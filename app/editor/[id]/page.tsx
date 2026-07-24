import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getDocument } from '@/app/actions/documents'
import { EditorClient } from '@/components/editor-client'

export const metadata = {
  title: 'Editor - Document Editor',
  description: 'Edit your collaborative document',
}

export default async function EditorPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    redirect('/sign-in')
  }

  try {
    const { doc, permission } = await getDocument(params.id)
    
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{doc.title || 'Untitled'}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Permission: {permission}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <EditorClient 
            docId={params.id}
            initialContent={doc.content}
            permission={permission as 'VIEWER' | 'EDITOR' | 'OWNER'}
            title={doc.title}
          />
        </main>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don&apos;t have permission to access this document.
          </p>
          <a
            href="/dashboard"
            className="text-primary hover:underline"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }
}
