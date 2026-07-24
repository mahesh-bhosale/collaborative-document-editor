import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createDocument } from '@/app/actions/documents'
import { parseMarkdownToTipTap } from '@/lib/markdown-parser'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'text/markdown', 'text/x-markdown', 'application/octet-stream']
    const fileName = file.name.toLowerCase()
    const isAllowed =
      allowedTypes.includes(file.type) ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.markdown')

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload .txt or .md files.' },
        { status: 400 }
      )
    }

    const text = await file.text()

    // Parse full markdown features (Headings, Bold, Italic, Lists, Code blocks, etc.)
    const content = parseMarkdownToTipTap(text)

    // Use original file name (without extension) as document title
    const title = file.name.replace(/\.(txt|md|markdown)$/i, '') || 'Imported Document'

    const { id } = await createDocument(title, content)

    return NextResponse.json({ id, title })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
  }
}
