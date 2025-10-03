#!/usr/bin/env node

/**
 * Copy docs from top-level collections `lost` and `found`
 * into `reports-lost` and `reports-found` with published=true.
 *
 * Usage: node scripts/migrate-lost-found-to-reports.js
 *
 * Requirements:
 * - Download your Firebase Admin SDK key as serviceAccountKey.json
 *   and place it in the project root.
 */

const admin = require('firebase-admin')

let serviceAccount
try {
  serviceAccount = require('../serviceAccountKey.json')
} catch (e) {
  console.error('Missing serviceAccountKey.json in project root.')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function migrateCollection(source, target) {
  console.log(`\n📦 Migrating ${source} -> ${target}`)
  const snap = await db.collection(source).get()
  if (snap.empty) {
    console.log(`   No documents in ${source}`)
    return 0
  }

  let migrated = 0
  let batch = db.batch()
  let ops = 0

  for (const doc of snap.docs) {
    const data = doc.data() || {}

    // Normalize fields expected by the app
    const normalized = {
      animalType: data.animalType || data.type || 'dog',
      animalName: data.animalName || data.name || '',
      breed: data.breed || '',
      colors: data.colors || '',
      age: data.age || data.estimatedAge || '',
      estimatedAge: data.estimatedAge || data.age || '',
      gender: data.gender || '',
      size: data.size || '',
      lastSeenLocation: source === 'lost' ? (data.lastSeenLocation || data.location || '') : undefined,
      lastSeenDate: source === 'lost' ? (data.lastSeenDate || data.date || '') : undefined,
      lastSeenTime: source === 'lost' ? (data.lastSeenTime || data.time || '') : undefined,
      foundLocation: source === 'found' ? (data.foundLocation || data.location || '') : undefined,
      foundDate: source === 'found' ? (data.foundDate || data.date || '') : undefined,
      foundTime: source === 'found' ? (data.foundTime || data.time || '') : undefined,
      contactName: data.contactName || data.reporterName || '',
      contactPhone: data.contactPhone || data.reporterPhone || '',
      contactEmail: data.contactEmail || data.reporterEmail || '',
      additionalDetails: data.additionalDetails || data.description || '',
      description: data.description || '',
      image: data.image || '',
      uploadObjectKey: data.uploadObjectKey || undefined,
      published: true,
      createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: data.createdAtMs || undefined
    }

    // Remove undefined fields to avoid schema noise
    Object.keys(normalized).forEach(k => normalized[k] === undefined && delete normalized[k])

    const targetRef = db.collection(target).doc(doc.id)
    batch.set(targetRef, normalized, { merge: true })
    ops += 1
    migrated += 1

    if (ops >= 450) { // keep headroom under 500 limit
      await batch.commit()
      console.log(`   Committed batch: ${ops} ops`)
      batch = db.batch()
      ops = 0
    }
  }

  if (ops > 0) {
    await batch.commit()
    console.log(`   Committed final batch: ${ops} ops`)
  }

  console.log(`   ✅ Migrated ${migrated} documents from ${source} to ${target}`)
  return migrated
}

async function main() {
  console.log('🚀 Starting Lost/Found -> reports-* migration')
  const lost = await migrateCollection('lost', 'reports-lost')
  const found = await migrateCollection('found', 'reports-found')
  console.log(`\n✅ Done. Migrated totals → lost: ${lost}, found: ${found}`)
}

main().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})


