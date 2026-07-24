'use client'

import { useState } from 'react'
import { shareDocument, removeDocumentShare } from '@/app/actions/documents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, X } from 'lucide-react'

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

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      await shareDocument(docId, email, permission)
      setEmail('')
      setPermission('VIEWER')
      await onSharesChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveShare = async (shareId: string) => {
    try {
      await removeDocumentShare(docId, shareId)
      await onSharesChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove share')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Share Document</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Share form */}
          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Share with email
              </label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Select value={permission} onValueChange={(v) => setPermission(v as 'VIEWER' | 'EDITOR')}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full"
            >
              {isLoading ? 'Sharing...' : 'Share'}
            </Button>
          </form>

          {/* Current shares */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground text-sm">Currently shared with</h3>
            {shares.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not shared with anyone yet.</p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {share.name || share.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{share.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                        {share.permission}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveShare(share.id)}
                      className="ml-2 text-destructive hover:bg-destructive/10 p-2 rounded transition-colors flex-shrink-0"
                      title="Remove share"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
