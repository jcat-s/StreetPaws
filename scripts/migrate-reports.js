#!/usr/bin/env node

/**
 * Migration script to move existing reports from separate collections
 * to the unified reports/{id}/subcollection structure
 * 
 * Usage: node scripts/migrate-reports.js
 * 
 * Make sure to set up your Firebase credentials and run this from the project root
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Add your project ID here
  // projectId: 'your-project-id'
});

const db = admin.firestore();

async function migrateReports() {
  console.log('🚀 Starting reports migration...');
  
  try {
    // Migrate lost reports
    console.log('📋 Migrating lost reports...');
    await migrateCollection('lost', 'lost');
    
    // Migrate found reports  
    console.log('📋 Migrating found reports...');
    await migrateCollection('found', 'found');
    
    // Migrate abuse reports (they're already in reports collection, but we need to move them to subcollections)
    console.log('📋 Migrating abuse reports...');
    await migrateAbuseReports();
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function migrateCollection(sourceCollection, targetSubcollection) {
  const sourceRef = db.collection(sourceCollection);
  const snapshot = await sourceRef.get();
  
  if (snapshot.empty) {
    console.log(`   No documents found in ${sourceCollection} collection`);
    return;
  }
  
  console.log(`   Found ${snapshot.size} documents in ${sourceCollection} collection`);
  
  const batch = db.batch();
  let batchCount = 0;
  const maxBatchSize = 500; // Firestore batch limit
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Create parent document
    const parentRef = db.collection('reports').doc();
    batch.set(parentRef, {
      createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      createdBy: data.createdBy || null,
      status: data.status || 'open',
      type: targetSubcollection
    });
    
    // Create subcollection document
    const subcollectionRef = parentRef.collection(targetSubcollection).doc();
    batch.set(subcollectionRef, {
      ...data,
      createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp()
    });
    
    batchCount += 2;
    
    // Commit batch if it reaches the limit
    if (batchCount >= maxBatchSize) {
      await batch.commit();
      console.log(`   Committed batch of ${batchCount} operations`);
      batchCount = 0;
    }
  }
  
  // Commit remaining operations
  if (batchCount > 0) {
    await batch.commit();
    console.log(`   Committed final batch of ${batchCount} operations`);
  }
  
  console.log(`   ✅ Migrated ${snapshot.size} documents from ${sourceCollection} to reports/{id}/${targetSubcollection}`);
}

async function migrateAbuseReports() {
  // Get all documents from the reports collection that are abuse reports
  const reportsRef = db.collection('reports');
  const snapshot = await reportsRef.get();
  
  if (snapshot.empty) {
    console.log('   No documents found in reports collection');
    return;
  }
  
  console.log(`   Found ${snapshot.size} documents in reports collection`);
  
  const batch = db.batch();
  let batchCount = 0;
  let abuseCount = 0;
  const maxBatchSize = 500;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Check if this is an abuse report (has abuse-specific fields)
    if (data.type === 'abuse' || data.abuseType || data.incidentLocation) {
      // Create new parent document
      const newParentRef = db.collection('reports').doc();
      batch.set(newParentRef, {
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        createdBy: data.createdBy || null,
        status: data.status || 'open',
        type: 'abuse'
      });
      
      // Move data to abuse subcollection
      const abuseRef = newParentRef.collection('abuse').doc();
      batch.set(abuseRef, {
        ...data,
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Delete original document
      batch.delete(doc.ref);
      
      batchCount += 3;
      abuseCount++;
      
      // Commit batch if it reaches the limit
      if (batchCount >= maxBatchSize) {
        await batch.commit();
        console.log(`   Committed batch of ${batchCount} operations`);
        batchCount = 0;
      }
    }
  }
  
  // Commit remaining operations
  if (batchCount > 0) {
    await batch.commit();
    console.log(`   Committed final batch of ${batchCount} operations`);
  }
  
  console.log(`   ✅ Migrated ${abuseCount} abuse reports to reports/{id}/abuse`);
}

async function cleanupOldCollections() {
  console.log('🧹 Cleaning up old collections...');
  
  try {
    // Delete old lost collection
    await deleteCollection('lost');
    console.log('   ✅ Deleted old lost collection');
    
    // Delete old found collection
    await deleteCollection('found');
    console.log('   ✅ Deleted old found collection');
    
  } catch (error) {
    console.error('   ⚠️  Error cleaning up old collections:', error);
  }
}

async function deleteCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    return;
  }
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  
  // Recursively delete if there are more documents
  if (snapshot.size >= 500) {
    await deleteCollection(collectionName);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    console.log('🧹 Running cleanup only...');
    await cleanupOldCollections();
    return;
  }
  
  if (args.includes('--help')) {
    console.log(`
Usage: node scripts/migrate-reports.js [options]

Options:
  --cleanup    Only clean up old collections (after migration is complete)
  --help       Show this help message

Make sure to:
1. Download serviceAccountKey.json from Firebase Console
2. Place it in the project root
3. Update the projectId in this script
4. Run this script from the project root
    `);
    return;
  }
  
  await migrateReports();
  
  if (args.includes('--auto-cleanup')) {
    console.log('\n🔄 Auto-cleanup enabled, removing old collections...');
    await cleanupOldCollections();
  } else {
    console.log('\n💡 To clean up old collections, run: node scripts/migrate-reports.js --cleanup');
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the migration
main().catch(console.error);

