import { FieldValue } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../firebaseAdmin';

/**
 * Catfish instruction prompt templates.
 *
 * `{playerName}` is substituted server-side at startGame time with the
 * name of the player whose prompt the catfish is impersonating.
 */
const catfishInstructionPrompts = [
  'Put yourself in {playerName}\u2019s shoes and answer this',
  'How do you think {playerName} would respond to this?',
  'Channel your inner {playerName} and answer as they would',
  'Imagine you\u2019re {playerName}\u2026',
  'Think like {playerName} and give their honest answer',
  'You are {playerName}. What do you say?',
  'Pretend you\u2019re {playerName} for this one\u2026',
  'What would {playerName} say to this?',
  'Step into {playerName}\u2019s world and answer honestly',
  'Become {playerName} and give their genuine response',
  'Get inside {playerName}\u2019s head for this one',
  'Answer this the way {playerName} would',
  'Try to think exactly like {playerName} would',
  'Give {playerName}\u2019s authentic answer to this',
  'Convince everyone you\u2019re {playerName} with your answer',
  'Do your best {playerName} impression here',
  'Answer this as {playerName} would \u2014 try to be convincing',
  'Walk a mile in {playerName}\u2019s shoes for this one',
  'What\u2019s going through {playerName}\u2019s head when they see this?',
  'Be {playerName}. Answer honestly, as they would',
];

async function seedCatfishInstructionPrompts(useEmulator: boolean = true) {
  const db = initializeFirebaseAdmin({ useEmulator });

  console.log(
    `Seeding ${catfishInstructionPrompts.length} catfish instruction prompts to ${
      useEmulator ? 'emulator' : 'production'
    }...`,
  );

  const batch = db.batch();

  for (const text of catfishInstructionPrompts) {
    const docRef = db.collection('catfishInstructionPrompts').doc();
    batch.set(docRef, {
      text,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(
    `\u2713 Successfully seeded ${catfishInstructionPrompts.length} catfish instruction prompts`,
  );
}

const args = process.argv.slice(2);
const useEmulator = !args.includes('--env=production');

seedCatfishInstructionPrompts(useEmulator)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding catfish instruction prompts:', error);
    process.exit(1);
  });
