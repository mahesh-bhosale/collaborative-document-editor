'use client'

import { useState } from 'react'
import { shareDocument, removeDocumentShare } from '@/app/actions/documents'
import { Trash2, X, Share2, UserPlus } from 'lucide-react'

interface Share {
  id: string
  email: string
  name: string
  permission: string
}

interface ShareDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  docId: string
  shares: Share[]
  onSharesChange: () => void
}

export function ShareDialog({
  isOpen,
  onOpenChange,
  docId,
  shares,
  onSharesChange,
}: ShareDialogProps) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'VIEWER' | 'EDITOR'>('VIEWER')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await shareDocument(docId, email, permission)
      setSuccess(`Document shared with ${email}`)
      setEmail('')
      setPermission('VIEWER')
      await onSharesChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveShare = async (shareId: string, shareEmail: string) => {
    if (!confirm(`Remove ${shareEmail}'s access?`)) return
    try {
      await removeDocumentShare(docId, shareId)
      await onSharesChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove share')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/15 to-indigo-500/15 border border-violet-500/20 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Share Document</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Invite people to collaborate</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Feedback messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          {/* Share form */}
          <form onSubmit={handleShare} className="space-y-3">
            <label className="block text-sm font-medium text-foreground mb-1">
              Invite by email
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="flex-1 h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
              />
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'VIEWER' | 'EDITOR')}
                className="h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full h-10 inline-flex items-center justify-center gap-2 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-sm shadow-violet-500/20"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sharing...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Share
                </>
              )}
            </button>
          </form>

          {/* Current shares */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              {shares.length > 0 ? `People with access (${shares.length})` : 'No one else has access yet'}
            </h3>
            {shares.length > 0 && (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-muted/50 border border-border/60 rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center shrink-0 text-xs font-semibold text-indigo-500">
                        {(share.name || share.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {share.name || share.email}
                        </p>
                        {share.name && (
                          <p className="text-xs text-muted-foreground truncate">{share.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          share.permission === 'EDITOR'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {share.permission}
                      </span>
                      <button
                        onClick={() => handleRemoveShare(share.id, share.email)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        title="Remove access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
