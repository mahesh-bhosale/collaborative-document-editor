'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createDocument, deleteDocument, getDocuments } from '@/app/actions/documents'
import { Trash2, Plus, LogOut, FileText, Upload, Users, Clock, FilePlus, FolderOpen } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import useSWR from 'swr'

interface User {
  id: string
  email: string
  name?: string
}

function formatDate(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: days > 365 ? 'numeric' : undefined })
}

export function DashboardClient({ user }: { user: User }) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, mutate, isLoading: isFetching } = useSWR('documents', getDocuments, {
    revalidateOnFocus: true,
  })

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDocTitle.trim()) return

    setIsCreating(true)
    setError(null)

    try {
      const { id } = await createDocument(newDocTitle, {})
      setNewDocTitle('')
      await mutate()
      router.push(`/editor/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await deleteDocument(docId)
      await mutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      await mutate()
      router.push(`/editor/${json.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Create + Upload row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create new document */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <FilePlus className="w-4 h-4 text-violet-500" />
            </div>
            <h3 className="font-semibold text-foreground">New Document</h3>
          </div>
          <form onSubmit={handleCreateDocument} className="flex gap-2">
            <input
              type="text"
              placeholder="Document title..."
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              disabled={isCreating}
              className="flex-1 h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={isCreating || !newDocTitle.trim()}
              className="inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-sm shadow-violet-500/20"
            >
              <Plus className="w-4 h-4" />
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        {/* File upload */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Upload className="w-4 h-4 text-indigo-500" />
            </div>
            <h3 className="font-semibold text-foreground">Import File</h3>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`flex items-center justify-center gap-2 w-full h-9 px-4 rounded-lg border border-dashed border-border text-sm text-muted-foreground cursor-pointer transition-all hover:border-primary/50 hover:text-foreground hover:bg-muted/50 ${isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload .txt or .md file
              </>
            )}
          </label>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Supported: .txt, .md — Max 5MB
          </p>
        </div>
      </div>

      {/* Sign out button */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* My Documents */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-4.5 h-4.5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">My Documents</h2>
          {!isFetching && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {documents.length}
            </span>
          )}
        </div>

        {isFetching && !documents.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {!isFetching && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">No documents yet</p>
            <p className="text-sm text-muted-foreground">Create a document or import a file to get started.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/editor/${doc.id}`}
              className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer block"
            >
              {/* Delete button */}
              <button
                onClick={(e) => handleDeleteDocument(doc.id, e)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                title="Delete document"
                aria-label="Delete document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Card content */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/15 to-indigo-500/15 border border-violet-500/20 flex items-center justify-center shrink-0 group-hover:from-violet-500/25 group-hover:to-indigo-500/25 transition-all">
                  <FileText className="w-4 h-4 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate leading-tight">
                    {doc.title || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(doc.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Shared Documents */}
      {(isFetching || sharedDocuments.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4.5 h-4.5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Shared with Me</h2>
            {!isFetching && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {sharedDocuments.length}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedDocuments.map((doc) => (
              <Link
                key={doc.id}
                href={`/editor/${doc.id}`}
                className="group bg-card border border-border rounded-xl p-5 hover:border-indigo-500/40 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-200 block"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/15 to-blue-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground group-hover:text-indigo-500 transition-colors truncate leading-tight">
                      {doc.title || 'Untitled'}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          doc.permission === 'EDITOR'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {doc.permission === 'EDITOR' ? '✏️ Editor' : '👁 Viewer'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
