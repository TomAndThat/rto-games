import { FieldValue } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../firebaseAdmin';

const votingPrompts = [
  'Will the real {playerName} please stand up?',
  "Who's the real {playerName}?",
  "Which is {playerName}'s answer?",
  'Pick the genuine {playerName}!',
  'What did the real {playerName} say?',
  'Who is the authentic {playerName}?',
  'Which one is the real {playerName}?',
  "Which of these is {playerName}'s answer?",
  'Which of these was written by {playerName}?',
  'Can you catch the real {playerName}?',
  'Which {playerName} is the most {playerName}?',
  "Who's the bona fide {playerName}?",
  'Which one is the OG {playerName}?',
  'Can you spot which one is the true {playerName}?',
];

async function seedVotingPrompts(useEmulator: boolean = true) {
  const db = initializeFirebaseAdmin({ useEmulator });

  console.log(
    `Seeding ${votingPrompts.length} voting prompts to ${
      useEmulator ? 'emulator' : 'production'
    }...`
  );

  const batch = db.batch();
  let count = 0;

  for (const text of votingPrompts) {
    const docRef = db.collection('votingPrompts').doc();
    batch.set(docRef, {
      text,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    count++;
  }

  await batch.commit();
  console.log(`✓ Successfully seeded ${count} voting prompts`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const useEmulator = !args.includes('--env=production');

seedVotingPrompts(useEmulator)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding voting prompts:', error);
    process.exit(1);
  });
