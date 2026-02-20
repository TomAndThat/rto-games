import { FieldValue } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../firebaseAdmin';

const imagePrompts = [
  'Me and my family tree',
  'Me as a baby',
  'Me as a celebrity',
  'Me as a chef',
  'Me as a monarch',
  'Me as a pilot',
  'Me as a refuse collector',
  'Me as my favourite Teletubby',
  "Me as you've never seen me before",
  'Me asleep',
  'Me at a concert',
  'Me at a festival',
  'Me at breakfast time',
  'Me at my happiest',
  'Me at my lowest ebb',
  'Me at school',
  'Me at the bar',
  'Me at the beach',
  'Me at the fairground',
  'Me at the front of a conga line',
  'Me at the weekend',
  'Me at work',
  'Me befriending an anteater',
  'Me camping',
  'Me competing in the Olympics',
  'Me consuming a mysterious snack',
  'Me cooking',
  'Me creating a problem',
  'Me creating a ruckus',
  'Me doing an extreme sport',
  'Me doing something extraordinary',
  'Me doing work experience',
  'Me dreaming of elephants',
  'Me driving a train',
  "Me dropping it like it's hot",
  'Me drunk',
  'Me eating cereal in the shower',
  'Me exceeding all expectations',
  'Me filling in a spreadsheet',
  'Me fundraising',
  'Me gardening',
  'Me getting a new pet',
  'Me graduating',
  'Me hassling The Hoff',
  "Me having a doctor's appointment",
  'Me having an unusual lunch',
  'Me headlining Glastonbury',
  'Me hiding in a cupboard',
  'Me in a box',
  'Me in a call centre',
  'Me in a garden centre',
  'Me in a hot air balloon',
  'Me in a lift',
  'Me in a lovely hat',
  'Me in a magazine',
  'Me in a state of anxiety',
  'Me in B&Q',
  'Me in bed',
  'Me in disguise',
  'Me in great peril',
  'Me in love',
  'Me in my best outfit',
  'Me in my country mansion',
  'Me in my favourite film',
  'Me in my Halloween costume',
  'Me in the bath',
  'Me in the great outdoors',
  'Me in the Victorian era',
  'Me in the zone',
  'Me jumping out of a massive cake',
  'Me just after I was fired',
  'Me just before being arrested',
  'Me just before I was fired',
  'Me learning a new hobby',
  'Me looking my best',
  'Me looking my worst',
  'Me making a difficult decision',
  'Me making a fool of myself',
  'Me making a name for myself',
  'Me making a scene',
  'Me making the best decision of my life',
  'Me needing the toilet',
  'Me nude',
  'Me on a date',
  'Me on a roof',
  'Me on a trampoline',
  'Me on a zipline',
  'Me on drugs',
  'Me on holiday',
  'Me on my 18th birthday',
  'Me on my birthday',
  'Me on my gap year',
  'Me on my world tour',
  'Me on our wedding day',
  'Me on public transport',
  'Me on top of something unusual',
  'Me on TV',
  'Me playing Hide & Seek',
  'Me playing the kazoo',
  'Me playing the trumpet',
  'Me playing this game',
  'Me smoking a cigar',
  'Me snorkelling',
  'Me solving a problem',
  "Me swallowing something that oughtn't be swallowed",
  'Me swimming',
  'Me switching careers',
  'Me tackling a vast meal',
  'Me taking part in a family tradition',
  'Me teaching',
  'Me underground',
  'Me upside down',
  'Me vs Godzilla',
  'Me waking up and smelling the roses',
  'Me wielding a hosepipe',
  'Me with a disease',
  'Me with an injury',
  'Me with Henry VIII',
  'Me with makeup on',
  'Me with my best friend',
  'Me with my favourite animal',
  'Me with my worst phobia',
  'Me with oven gloves on',
  'Me with reason to celebrate',
  'Me witnessing an unusual incident',
  'Me, but more American',
  'Me, but more French',
  'Me, but more Russian',
  'Me, but more Spanish',
  'Me, crossing the line',
  'Me, dead',
  'Me, understandably peeved',
  'My mugshot',
];

async function seedImagePrompts(useEmulator: boolean = true) {
  const db = initializeFirebaseAdmin({ useEmulator });

  console.log(
    `Seeding ${imagePrompts.length} image prompts to ${
      useEmulator ? 'emulator' : 'production'
    }...`
  );

  const batch = db.batch();
  let count = 0;

  for (const text of imagePrompts) {
    const docRef = db.collection('imagePrompts').doc();
    batch.set(docRef, {
      text,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    count++;
  }

  await batch.commit();
  console.log(`✓ Successfully seeded ${count} image prompts`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const useEmulator = !args.includes('--env=production');

seedImagePrompts(useEmulator)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding image prompts:', error);
    process.exit(1);
  });
