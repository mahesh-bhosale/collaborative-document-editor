'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import UnderlineExtension from '@tiptap/extension-underline'
import { updateDocument, getDocumentShares } from '@/app/actions/documents'
import { EditorToolbar } from './editor-toolbar'
import { ShareDialog } from './share-dialog'
import { useRouter } from 'next/navigation'
import { Check, Cloud, CloudOff, Share2, ArrowLeft, Pencil, Eye } from 'lucide-react'

import { markdownToHTML } from '@/lib/markdown-parser'

interface EditorClientProps {
  docId: string
  initialContent: object
  permission: 'VIEWER' | 'EDITOR' | 'OWNER'
  title: string
}

export function EditorClient({
  docId,
  initialContent,
  permission,
  title: initialTitle,
}: EditorClientProps) {
  const router = useRouter()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shares, setShares] = useState<any[]>([])

  // Inline title rename state
  const [docTitle, setDocTitle] = useState(initialTitle)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const canEdit = permission !== 'VIEWER'

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      Placeholder.configure({
        placeholder: 'Start typing your document here...',
      }),
    ],
    editorProps: {
      transformPastedText(text) {
        if (text && (text.includes('**') || text.includes('#') || text.includes('- '))) {
          return markdownToHTML(text)
        }
        return text
      },
    },
    content: initialContent || '',
    editable: canEdit,
  })

  // Autosave on content change
  const scheduleSave = useCallback(
    (contentToSave: object) => {
      if (!canEdit) return
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

      setSaveStatus('saving')
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateDocument(docId, { content: contentToSave })
          setSaveStatus('saved')
          // Reset to idle after a moment
          setTimeout(() => setSaveStatus('idle'), 2500)
        } catch {
          setSaveStatus('error')
        }
      }, 1200)
    },
    [docId, canEdit]
  )

  useEffect(() => {
    if (!editor) return
    const handleUpdate = () => {
      scheduleSave(editor.getJSON())
    }
    editor.on('update', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [editor, scheduleSave])

  // Load shares for owner
  const loadShares = useCallback(async () => {
    try {
      const s = await getDocumentShares(docId)
      setShares(s)
    } catch {
      console.error('Failed to load shares')
    }
  }, [docId])

  useEffect(() => {
    if (permission === 'OWNER') loadShares()
  }, [permission, loadShares])

  // Handle title save
  const handleTitleSave = async () => {
    setIsEditingTitle(false)
    const trimmed = docTitle.trim() || 'Untitled'
    setDocTitle(trimmed)
    if (trimmed !== initialTitle) {
      try {
        await updateDocument(docId, { title: trimmed })
      } catch {
        console.error('Failed to rename document')
      }
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave()
    if (e.key === 'Escape') {
      setDocTitle(initialTitle)
      setIsEditingTitle(false)
    }
  }

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  if (!editor) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Document title + action bar */}
      <div className="flex flex-col gap-3">
        {/* Title row */}
        <div className="flex items-center gap-2 group">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="text-2xl font-bold text-foreground bg-transparent border-0 border-b-2 border-primary focus:outline-none w-full max-w-xl py-0.5"
              maxLength={100}
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-2xl font-bold text-foreground truncate">{docTitle || 'Untitled'}</h1>
              {canEdit && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Rename document"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <div className="flex items-center gap-2">
            {/* Save status */}
            {canEdit && (
              <div className="flex items-center gap-1.5 text-xs">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-green-500">
                    <Check className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="flex items-center gap-1 text-destructive">
                    <CloudOff className="w-3.5 h-3.5" />
                    Save failed
                  </span>
                )}
                {saveStatus === 'idle' && (
                  <span className="flex items-center gap-1 text-muted-foreground/50">
                    <Cloud className="w-3.5 h-3.5" />
                    Auto-save on
                  </span>
                )}
              </div>
            )}

            {/* Viewer badge */}
            {!canEdit && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <Eye className="w-3 h-3" />
                View only
              </span>
            )}

            {/* Share button — owner only */}
            {permission === 'OWNER' && (
              <button
                onClick={() => setIsShareDialogOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity shadow-sm shadow-violet-500/20"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {canEdit && <EditorToolbar editor={editor} />}

      {/* Editor container */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <EditorContent editor={editor} />
      </div>

      {/* Share Dialog */}
      {permission === 'OWNER' && (
        <ShareDialog
          isOpen={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          docId={docId}
          shares={shares}
          onSharesChange={loadShares}
        />
      )}
    </div>
  )
}
