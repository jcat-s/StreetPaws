// Grant Firebase Custom Claims for admin/super_admin
// Usage examples:
//   node scripts/set-admin.js --email new.admin@gmail.com --role admin --key C:\\keys\\streetpaws2-sa.json
//   set GOOGLE_APPLICATION_CREDENTIALS=C:\\keys\\streetpaws2-sa.json && node scripts/set-admin.js --email new.admin@gmail.com

import admin from 'firebase-admin'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

function parseArgs() {
  const args = process.argv.slice(2)
  const parsed = { emails: [], role: 'admin', key: process.env.GOOGLE_APPLICATION_CREDENTIALS || '' }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--email' || a === '-e') {
      const val = args[++i]
      if (val) parsed.emails.push(...val.split(',').map((s) => s.trim()).filter(Boolean))
    } else if (a === '--role' || a === '-r') {
      parsed.role = args[++i] || 'admin'
    } else if (a === '--key' || a === '-k') {
      parsed.key = args[++i] || parsed.key
    }
  }
  return parsed
}

async function initAdmin(keyPath) {
  if (admin.apps.length) return
  if (keyPath) {
    const serviceAccount = require(keyPath)
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() })
  }
}

async function setAdmin(email, role) {
  const user = await admin.auth().getUserByEmail(email)
  const existing = user.customClaims || {}
  await admin.auth().setCustomUserClaims(user.uid, { ...existing, role })
  console.log(`Granted ${role} to: ${email}`)
}

;(async () => {
  try {
    const { emails, role, key } = parseArgs()
    if (!emails.length) {
      console.error('Error: provide at least one --email address')
      process.exit(1)
    }
    await initAdmin(key)
    for (const email of emails) {
      await setAdmin(email, role)
    }
    console.log('Done. Ask users to sign out/in to refresh claims.')
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()


