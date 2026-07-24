'use client'

import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
  Minus,
  Code2,
  Pilcrow,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor
}

function ToolbarButton({
  onClick,
  disabled,
  active,
  title,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`
        relative inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        ${active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-foreground/70 hover:text-foreground hover:bg-muted'
        }
      `}
    >
      {children}
    </button>
  )
}

function Separator() {
  return <div className="w-px h-6 bg-border mx-0.5 self-center shrink-0" />
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 bg-card border border-border rounded-xl px-3 py-2 shadow-sm">
      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        active={false}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        active={false}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Paragraph */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive('paragraph')}
        title="Normal text"
      >
        <Pilcrow className="w-3.5 h-3.5" />
      </ToolbarButton>

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1 (Ctrl+Alt+1)"
      >
        <Heading1 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2 (Ctrl+Alt+2)"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3 (Ctrl+Alt+3)"
      >
        <Heading3 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Inline formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().toggleBold()}
        active={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().toggleItalic()}
        active={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().toggleStrike()}
        active={editor.isActive('strike')}
        title="Strikethrough (Ctrl+Shift+S)"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().toggleCode()}
        active={editor.isActive('code')}
        title="Inline code (Ctrl+`)"
      >
        <Code className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Block elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <List className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered list"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <Quote className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code block"
      >
        <Code2 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Insert */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        title="Horizontal rule"
      >
        <Minus className="w-3.5 h-3.5" />
      </ToolbarButton>
    </div>
  )
}
