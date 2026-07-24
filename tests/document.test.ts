import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseMarkdownToTipTap, parseInlineMarkdown } from '../lib/markdown-parser'

// Permission checking helper for testing logic
function checkPermission(
  docOwnerId: string,
  currentUserId: string,
  shares: { sharedWithId: string; permission: string }[]
): 'OWNER' | 'EDITOR' | 'VIEWER' | null {
  if (docOwnerId === currentUserId) return 'OWNER'
  const share = shares.find((s) => s.sharedWithId === currentUserId)
  if (share) return share.permission as 'EDITOR' | 'VIEWER'
  return null
}

test('Inline Markdown Parser: parses **bold**, *italic*, and `code`', () => {
  const input = 'This is **bold text** and *italic text* with `code` block'
  const nodes = parseInlineMarkdown(input)

  assert.equal(nodes.length, 7)
  assert.equal(nodes[0].text, 'This is ')
  assert.equal(nodes[1].text, 'bold text')
  assert.deepEqual(nodes[1].marks, [{ type: 'bold' }])
  assert.equal(nodes[2].text, ' and ')
  assert.equal(nodes[3].text, 'italic text')
  assert.deepEqual(nodes[3].marks, [{ type: 'italic' }])
  assert.equal(nodes[4].text, ' with ')
  assert.equal(nodes[5].text, 'code')
  assert.deepEqual(nodes[5].marks, [{ type: 'code' }])
  assert.equal(nodes[6].text, ' block')
})

test('Full Markdown Document Parser: converts headings, lists, bold, and code blocks', () => {
  const rawMarkdown = `# Project Overview
## Features
- **User Auth**: Email + password
- **Auto Save**: Realtime saving

\`\`\`bash
pnpm install
pnpm dev
\`\`\`
`
  const result: any = parseMarkdownToTipTap(rawMarkdown)

  assert.equal(result.type, 'doc')

  // H1
  assert.equal(result.content[0].type, 'heading')
  assert.equal(result.content[0].attrs.level, 1)

  // H2
  assert.equal(result.content[1].type, 'heading')
  assert.equal(result.content[1].attrs.level, 2)

  // Bullet List
  assert.equal(result.content[2].type, 'bulletList')
  assert.equal(result.content[2].content.length, 2)
  // First item has bold mark on 'User Auth'
  const firstItemTextNodes = result.content[2].content[0].content[0].content
  assert.equal(firstItemTextNodes[0].text, 'User Auth')
  assert.deepEqual(firstItemTextNodes[0].marks, [{ type: 'bold' }])

  // Code block
  const codeBlockNode = result.content.find((n: any) => n.type === 'codeBlock')
  assert.ok(codeBlockNode)
  assert.equal(codeBlockNode.content[0].text, 'pnpm install\npnpm dev')
})

test('Permission Scoping: owner, editor, viewer, and denied access', () => {
  const ownerId = 'user-owner'
  const editorId = 'user-editor'
  const viewerId = 'user-viewer'
  const randomId = 'user-random'

  const shares = [
    { sharedWithId: editorId, permission: 'EDITOR' },
    { sharedWithId: viewerId, permission: 'VIEWER' },
  ]

  assert.equal(checkPermission(ownerId, ownerId, shares), 'OWNER')
  assert.equal(checkPermission(ownerId, editorId, shares), 'EDITOR')
  assert.equal(checkPermission(ownerId, viewerId, shares), 'VIEWER')
  assert.equal(checkPermission(ownerId, randomId, shares), null)
})
