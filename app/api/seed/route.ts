import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const users = [
  { email: 'alice@example.com', password: 'password123', name: 'Alice' },
  { email: 'bob@example.com', password: 'password123', name: 'Bob' },
  { email: 'charlie@example.com', password: 'password123', name: 'Charlie' },
]

export async function GET() {
  try {
    console.log('🌱 Seeding database...')

    for (const userData of users) {
      const hashedPassword = await hashPassword(userData.password)

      // Check if user already exists
      const existingUser = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(eq(schema.user.email, userData.email))
        .limit(1)

      if (existingUser.length === 0) {
        const userId = uuidv4()
        // Insert new user
        await db.insert(schema.user).values({
          id: userId,
          email: userData.email,
          name: userData.name,
          emailVerified: true,
        })

        // Insert account with password
        const accountId = uuidv4()
        await db.insert(schema.account).values({
          id: accountId,
          accountId: userId,
          providerId: 'credential',
          userId: userId,
          password: hashedPassword,
        })

        console.log(`✅ Seeded user: ${userData.email}`)
      } else {
        const userId = existingUser[0].id

        // Delete any existing account record for this user to start clean
        await db.delete(schema.account).where(eq(schema.account.userId, userId))

        // Insert fresh account record with valid better-auth password hash
        const accountId = uuidv4()
        await db.insert(schema.account).values({
          id: accountId,
          accountId: userId,
          providerId: 'credential',
          userId: userId,
          password: hashedPassword,
        })

        console.log(`🔄 Re-seeded account and updated password for: ${userData.email}`)
      }
    }

    return NextResponse.json({
      message: 'Database seeding complete!',
      users: users.map((u) => ({ email: u.email, password: u.password })),
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
