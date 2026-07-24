'use client'

import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap gap-1 bg-card border border-border rounded-lg p-3">
      <Button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        variant="ghost"
        size="sm"
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        variant="ghost"
        size="sm"
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </Button>

      <div className="w-px bg-border mx-1" />

      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().toggleBold()}
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        size="sm"
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().toggleItalic()}
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        size="sm"
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().toggleStrike()}
        variant={editor.isActive('strike') ? 'default' : 'ghost'}
        size="sm"
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().toggleCode()}
        variant={editor.isActive('code') ? 'default' : 'ghost'}
        size="sm"
        title="Code"
      >
        <Code className="w-4 h-4" />
      </Button>

      <div className="w-px bg-border mx-1" />

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
        size="sm"
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
        size="sm"
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </Button>

      <div className="w-px bg-border mx-1" />

      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
        size="sm"
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        size="sm"
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
        size="sm"
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </Button>
    </div>
  )
}
