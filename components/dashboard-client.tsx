'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createDocument, deleteDocument, getDocuments } from '@/app/actions/documents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, LogOut, FileText } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import useSWR from 'swr'

interface User {
  id: string
  email: string
  name?: string
}

export function DashboardClient({ user }: { user: User }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data, mutate, isLoading: isFetching } = useSWR('documents', getDocuments, {
    revalidateOnFocus: true,
  })

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDocTitle.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const { id } = await createDocument(newDocTitle, {})
      setNewDocTitle('')
      await mutate()
      router.push(`/editor/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await deleteDocument(docId)
      await mutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/sign-in')
  }

  const documents = data?.owned || []
  const sharedDocuments = data?.shared || []

  return (
    <div className="space-y-8">
      {/* Header with logout button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Your Documents</h2>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Create new document */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Create New Document</h3>
        <form onSubmit={handleCreateDocument} className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter document title..."
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !newDocTitle.trim()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </form>
      </div>

      {/* Your documents */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Your Documents</h3>
        {isFetching && !documents.length && (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        )}
        {!isFetching && documents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No documents yet. Create one to get started!
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <Link
                href={`/editor/${doc.id}`}
                className="group"
              >
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {doc.title || 'Untitled'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => handleDeleteDocument(doc.id)}
                className="mt-3 text-destructive hover:bg-destructive/10 p-2 rounded transition-colors"
                aria-label="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Shared documents */}
      {sharedDocuments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Shared with You</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <Link
                  href={`/editor/${doc.id}`}
                  className="group"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {doc.title || 'Untitled'}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Permission: {doc.permission}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
