import { initializeFirebaseAdmin } from './firebaseAdmin';

async function checkPrompts() {
  const db = initializeFirebaseAdmin({ useEmulator: true });

  console.log('Checking Firestore emulator for prompt collections...\n');

  for (const collection of ['textPrompts', 'imagePrompts', 'votingPrompts']) {
    const snapshot = await db.collection(collection).limit(3).get();
    console.log(`${collection}: ${snapshot.size} docs found (showing up to 3)`);
    snapshot.forEach((doc) => {
      console.log(`  - ${doc.id}: ${JSON.stringify(doc.data())}`);
    });
    console.log();
  }

  // Also check what collections exist at root
  const collections = await db.listCollections();
  console.log('All root collections:');
  for (const col of collections) {
    const count = await col.count().get();
    console.log(`  - ${col.id} (${count.data().count} docs)`);
  }
}

checkPrompts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
