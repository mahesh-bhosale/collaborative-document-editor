'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { document, documentShare, user } from '@/lib/db/schema'
import { and, eq, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getDocuments() {
  const userId = await getUserId()
  
  // Get documents the user owns
  const ownedDocs = await db
    .select()
    .from(document)
    .where(eq(document.ownerId, userId))

  // Get documents shared with the user
  const sharedDocs = await db
    .select({
      doc: document,
      permission: documentShare.permission,
    })
    .from(documentShare)
    .innerJoin(document, eq(documentShare.documentId, document.id))
    .where(eq(documentShare.sharedWithId, userId))

  return {
    owned: ownedDocs,
    shared: sharedDocs.map(({ doc, permission }) => ({ ...doc, permission })),
  }
}

export async function getDocument(docId: string) {
  const userId = await getUserId()

  const doc = await db.query.document.findFirst({
    where: eq(document.id, docId),
  })

  if (!doc) throw new Error('Document not found')

  // Check permissions
  if (doc.ownerId === userId) {
    return { doc, permission: 'OWNER' }
  }

  const share = await db.query.documentShare.findFirst({
    where: and(
      eq(documentShare.documentId, docId),
      eq(documentShare.sharedWithId, userId)
    ),
  })

  if (!share) throw new Error('Access denied')
  return { doc, permission: share.permission }
}

export async function createDocument(title: string, content: object) {
  const userId = await getUserId()
  const docId = uuidv4()

  await db.insert(document).values({
    id: docId,
    title,
    content,
    ownerId: userId,
  })

  revalidatePath('/dashboard')
  return { id: docId }
}

export async function updateDocument(docId: string, updates: { title?: string; content?: object }) {
  const userId = await getUserId()

  const doc = await db.query.document.findFirst({
    where: eq(document.id, docId),
  })

  if (!doc || doc.ownerId !== userId) {
    throw new Error('Access denied')
  }

  await db
    .update(document)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(document.id, docId))

  revalidatePath('/dashboard')
  revalidatePath(`/editor/${docId}`)
}

export async function deleteDocument(docId: string) {
  const userId = await getUserId()

  const doc = await db.query.document.findFirst({
    where: eq(document.id, docId),
  })

  if (!doc || doc.ownerId !== userId) {
    throw new Error('Access denied')
  }

  await db.delete(document).where(eq(document.id, docId))

  revalidatePath('/dashboard')
}

export async function shareDocument(
  docId: string,
  sharedWithEmail: string,
  permission: 'VIEWER' | 'EDITOR'
) {
  const userId = await getUserId()

  const doc = await db.query.document.findFirst({
    where: eq(document.id, docId),
  })

  if (!doc || doc.ownerId !== userId) {
    throw new Error('Access denied')
  }

  const targetUser = await db.query.user.findFirst({
    where: eq(user.email, sharedWithEmail),
  })

  if (!targetUser) throw new Error('User not found')
  if (targetUser.id === userId) throw new Error('Cannot share with yourself')

  const shareId = uuidv4()

  // Upsert share
  await db
    .insert(documentShare)
    .values({
      id: shareId,
      documentId: docId,
      sharedWithId: targetUser.id,
      permission,
    })
    .onConflictDoUpdate({
      target: [documentShare.documentId, documentShare.sharedWithId],
      set: { permission },
    })

  revalidatePath(`/editor/${docId}`)
}

export async function getDocumentShares(docId: string) {
  const userId = await getUserId()

  const doc = await db.query.document.findFirst({
    where: eq(document.id, docId),
  })

  if (!doc || doc.ownerId !== userId) {
    throw new Error('Access denied')
  }

  const shares = await db
    .select({
      id: documentShare.id,
      email: user.email,
      name: user.name,
      permission: documentShare.permission,
    })
    .from(documentShare)
    .innerJoin(user, eq(documentShare.sharedWithId, user.id))
    .where(eq(documentShare.documentId, docId))

  return shares
}

export async function removeDocumentShare(docId: string, shareId: string) {
  const userId = await getUserId()

  const doc = await db.query.document.findFirst({
    where: eq(document.id, docId),
  })

  if (!doc || doc.ownerId !== userId) {
    throw new Error('Access denied')
  }

  await db.delete(documentShare).where(eq(documentShare.id, shareId))

  revalidatePath(`/editor/${docId}`)
}
