'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { updateDocument, getDocumentShares } from '@/app/actions/documents'
import { EditorToolbar } from './editor-toolbar'
import { ShareDialog } from './share-dialog'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Share2, ArrowLeft } from 'lucide-react'

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
  title,
}: EditorClientProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shares, setShares] = useState<any[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing or press "/" for commands...',
      }),
    ],
    content: initialContent || '',
    editable: permission !== 'VIEWER',
  })

  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      if (permission === 'VIEWER') return

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set new timeout for autosave
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true)
          const content = editor.getJSON()
          await updateDocument(docId, { content })
          setLastSaved(new Date())
        } catch (error) {
          console.error('Failed to save document:', error)
        } finally {
          setIsSaving(false)
        }
      }, 1000) // Save after 1 second of inactivity
    }

    editor.on('update', handleUpdate)

    return () => {
      editor.off('update', handleUpdate)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [editor, docId, permission])

  useEffect(() => {
    if (permission === 'OWNER') {
      loadShares()
    }
  }, [docId, permission])

  const loadShares = async () => {
    try {
      const shares = await getDocumentShares(docId)
      setShares(shares)
    } catch (error) {
      console.error('Failed to load shares:', error)
    }
  }

  if (!editor) {
    return <div className="text-center py-8 text-muted-foreground">Loading editor...</div>
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {isSaving ? 'Saving...' : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Not saved'}
          </span>

          {permission === 'OWNER' && (
            <Button
              onClick={() => setIsShareDialogOpen(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          )}
        </div>
      </div>

      {permission === 'VIEWER' && (
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-sm text-accent">
          You have view-only access to this document.
        </div>
      )}

      {/* Editor Toolbar */}
      {permission !== 'VIEWER' && <EditorToolbar editor={editor} />}

      {/* Editor */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-6 focus:outline-none [&_.ProseMirror]:min-h-[500px] [&_.ProseMirror]:focus:outline-none"
        />
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
