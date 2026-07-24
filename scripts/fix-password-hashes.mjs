/**
 * fix-password-hashes.mjs
 *
 * Replaces argon2 password hashes (written by the original @node-rs/argon2
 * seed script) with proper Better Auth scrypt hashes.
 *
 * Better Auth password format:  hex_salt:hex_key
 * Source: node_modules/@better-auth/utils/dist/password.node.cjs
 *
 * Run from the project root:
 *   npx tsx scripts/fix-password-hashes.mjs
 */
import fs from 'fs'
import path from 'path'
import crypto from 'node:crypto'
import pg from 'pg'

// ── 1. Load .env.local ──────────────────────────────────────────────────────
const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8')
for (const line of envContent.split('\n')) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (m) {
    let v = (m[2] || '').trim()
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
      v = v.slice(1, -1)
    }
    process.env[m[1]] = v
  }
}

// ── 2. Scrypt helpers (identical to @better-auth/utils) ────────────────────
const SCRYPT_CONFIG = { N: 16384, r: 16, p: 1, dkLen: 64 }

function generateKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password.normalize('NFKC'),
      salt,
      SCRYPT_CONFIG.dkLen,
      { N: SCRYPT_CONFIG.N, r: SCRYPT_CONFIG.r, p: SCRYPT_CONFIG.p,
        maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2 },
      (err, key) => (err ? reject(err) : resolve(key))
    )
  })
}

async function betterAuthHash(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const key = await generateKey(password, salt)
  return `${salt}:${key.toString('hex')}`
}

// ── 3. Users to fix ─────────────────────────────────────────────────────────
const USERS = [
  { email: 'alice@example.com',   password: 'password123' },
  { email: 'bob@example.com',     password: 'password123' },
  { email: 'charlie@example.com', password: 'password123' },
]

// ── 4. Connect & fix ────────────────────────────────────────────────────────
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
console.log('✅ Connected to Neon database\n')

for (const { email, password } of USERS) {
  // Look up the user id
  const userRes = await client.query(
    'SELECT id FROM "user" WHERE email = $1',
    [email]
  )
  if (userRes.rows.length === 0) {
    console.warn(`⚠️  User not found: ${email} — skipping`)
    continue
  }
  const userId = userRes.rows[0].id

  // Read current hash
  const accRes = await client.query(
    'SELECT id, password FROM account WHERE userid = $1',
    [userId]
  )
  if (accRes.rows.length === 0) {
    console.warn(`⚠️  No account row for ${email} — skipping`)
    continue
  }
  const { id: accountId, password: currentHash } = accRes.rows[0]

  // Skip if already a Better Auth scrypt hash
  if (currentHash && !currentHash.startsWith('$argon2')) {
    const [salt, key] = currentHash.split(':')
    if (salt && key) {
      console.log(`✔  ${email} — already has a valid scrypt hash, skipping`)
      continue
    }
  }

  // Generate a fresh Better Auth scrypt hash
  const newHash = await betterAuthHash(password)
  await client.query(
    'UPDATE account SET password = $1 WHERE id = $2',
    [newHash, accountId]
  )
  console.log(`✅ Fixed hash for ${email}  (account id: ${accountId})`)
}

await client.end()
console.log('\n🎉 Done. All seed users now have valid Better Auth password hashes.')
console.log('   You can now sign in with alice@example.com / password123')
