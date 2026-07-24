interface TextNode {
  type: 'text'
  text: string
  marks?: { type: string }[]
}

export function parseInlineMarkdown(text: string): TextNode[] {
  if (!text) return []

  const nodes: TextNode[] = []
  // Regex matching **bold**, *italic*, or `code`
  const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    const fullMatch = match[0]
    if (fullMatch.startsWith('**')) {
      if (match[2]) {
        nodes.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] })
      }
    } else if (fullMatch.startsWith('*')) {
      if (match[3]) {
        nodes.push({ type: 'text', text: match[3], marks: [{ type: 'italic' }] })
      }
    } else if (fullMatch.startsWith('`')) {
      if (match[4]) {
        nodes.push({ type: 'text', text: match[4], marks: [{ type: 'code' }] })
      }
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text }]
}

export function markdownToHTML(markdown: string): string {
  if (!markdown) return ''

  // Convert markdown syntax to HTML for paste and rich text rendering
  let html = markdown
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Headings
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Bullet list items
    .replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>')

  return html
}

export function parseMarkdownToTipTap(markdown: string): object {
  const lines = markdown.split(/\r?\n/)
  const contentNodes: any[] = []

  let inCodeBlock = false
  let codeBlockLines: string[] = []

  let currentListType: 'bulletList' | 'orderedList' | null = null
  let currentListItems: any[] = []

  function flushList() {
    if (currentListType && currentListItems.length > 0) {
      contentNodes.push({
        type: currentListType,
        content: currentListItems,
      })
      currentListType = null
      currentListItems = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // 1. Code Block Toggle
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        contentNodes.push({
          type: 'codeBlock',
          content: [{ type: 'text', text: codeBlockLines.join('\n') }],
        })
        codeBlockLines = []
        inCodeBlock = false
      } else {
        // Open code block
        flushList()
        inCodeBlock = true
        codeBlockLines = []
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine)
      continue
    }

    // 2. Bullet list item (- or *)
    const bulletMatch = rawLine.match(/^(\s*)([-*])\s+(.*)$/)
    if (bulletMatch) {
      if (currentListType !== 'bulletList') {
        flushList()
        currentListType = 'bulletList'
      }
      const itemText = bulletMatch[3]
      currentListItems.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: parseInlineMarkdown(itemText),
          },
        ],
      })
      continue
    }

    // 3. Numbered list item (1. 2. etc.)
    const orderedMatch = rawLine.match(/^(\s*)(\d+\.)\s+(.*)$/)
    if (orderedMatch) {
      if (currentListType !== 'orderedList') {
        flushList()
        currentListType = 'orderedList'
      }
      const itemText = orderedMatch[3]
      currentListItems.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: parseInlineMarkdown(itemText),
          },
        ],
      })
      continue
    }

    // Non-list line, flush list if active
    flushList()

    // 4. Headings
    if (trimmed.startsWith('### ')) {
      contentNodes.push({
        type: 'heading',
        attrs: { level: 3 },
        content: parseInlineMarkdown(trimmed.slice(4)),
      })
      continue
    }
    if (trimmed.startsWith('## ')) {
      contentNodes.push({
        type: 'heading',
        attrs: { level: 2 },
        content: parseInlineMarkdown(trimmed.slice(3)),
      })
      continue
    }
    if (trimmed.startsWith('# ')) {
      contentNodes.push({
        type: 'heading',
        attrs: { level: 1 },
        content: parseInlineMarkdown(trimmed.slice(2)),
      })
      continue
    }

    // 5. Blockquote
    if (trimmed.startsWith('> ')) {
      contentNodes.push({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: parseInlineMarkdown(trimmed.slice(2)),
          },
        ],
      })
      continue
    }

    // 6. Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      contentNodes.push({ type: 'horizontalRule' })
      continue
    }

    // 7. Paragraph
    if (trimmed === '') {
      contentNodes.push({ type: 'paragraph', content: [] })
    } else {
      contentNodes.push({
        type: 'paragraph',
        content: parseInlineMarkdown(rawLine),
      })
    }
  }

  // Flush remaining open lists or code blocks
  flushList()
  if (inCodeBlock && codeBlockLines.length > 0) {
    contentNodes.push({
      type: 'codeBlock',
      content: [{ type: 'text', text: codeBlockLines.join('\n') }],
    })
  }

  return {
    type: 'doc',
    content: contentNodes.length > 0 ? contentNodes : [{ type: 'paragraph', content: [] }],
  }
}
