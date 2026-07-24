import { db } from '@/lib/db'
import { user, account } from '@/lib/db/schema'
import { hash } from '@node-rs/argon2'
import { v4 as uuidv4 } from 'uuid'

const users = [
  { email: 'alice@example.com', password: 'password123', name: 'Alice' },
  { email: 'bob@example.com', password: 'password123', name: 'Bob' },
  { email: 'charlie@example.com', password: 'password123', name: 'Charlie' },
]

async function seed() {
  console.log('🌱 Seeding database...')

  for (const userData of users) {
    try {
      const userId = uuidv4()
      const hashedPassword = await hash(userData.password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      })

      // Insert user
      await db
        .insert(user)
        .values({
          id: userId,
          email: userData.email,
          name: userData.name,
          emailVerified: true,
        })
        .onConflictDoNothing()

      // Get the user to get their ID
      const existingUser = await db.query.user.findFirst({
        where: (u) => u.email === userData.email,
      })

      if (existingUser) {
        // Insert account with password
        await db
          .insert(account)
          .values({
            id: uuidv4(),
            accountId: existingUser.id,
            providerId: 'credential',
            userId: existingUser.id,
            password: hashedPassword,
          })
          .onConflictDoNothing()

        console.log(`✅ Seeded user: ${userData.email}`)
      }
    } catch (error) {
      console.error(`❌ Error seeding ${userData.email}:`, error)
    }
  }

  console.log('✨ Database seeding complete!')
}

seed().catch(console.error)
