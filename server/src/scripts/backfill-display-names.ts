import { PrismaClient } from '@prisma/client'
import { createClerkClient } from '@clerk/backend'

const prisma = new PrismaClient()
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

async function run() {
  let offset = 0
  const limit = 100
  let total = 0

  for (;;) {
    const page = await clerk.users.getUserList({ limit, offset })
    const list = page.data ?? []
    if (!list.length) break

    for (const u of list) {
      const pm = (u.publicMetadata ?? {}) as any
      const displayName =
        pm.displayName ||
        [u.firstName, u.lastName].filter(Boolean).join(' ') ||
        u.username ||
        u.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
        '不明ユーザー'

      await prisma.userProfile.upsert({
        where: { clerkId: u.id },
        create: { clerkId: u.id, displayName },
        update: { displayName },
      })
      total++
    }
    offset += list.length
  }
  console.log('backfilled:', total)
}

run().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1) })
