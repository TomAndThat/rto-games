import { FieldValue } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../firebaseAdmin';

const textPrompts = [
  'A fact about me that you may not know',
  'An important fact',
  'An overshare',
  'Describe your dream first date',
  'Describe your ideal partner',
  'For what in your life do you feel most grateful?',
  'How many pairs of shoes do you own?',
  'How much do you get paid?',
  'How would you describe your fashion sense?',
  'How would you summarise your political views?',
  'I am a great friend because...',
  'I am a great person to spend time with because...',
  'I am hooked on...',
  "I can't go into Poundland without buying...",
  "I couldn't live without...",
  "I won't shut up about...",
  'I would love to go to...',
  "I'll know I've made it when...",
  "I'm so glad that nobody can see me when I...",
  "I'm weirdly attracted to...",
  'If I could appear on any show, it would be...',
  'If I had to redecorate my bedroom, I would choose...',
  'If I was Prime Minister, I would...',
  'If you could employ an assistant, what would they do?',
  'If you could invite anyone in the world to dinner, who would it be?',
  'If you could live anywhere in the world, where would it be?',
  'If you could swap lives with anyone, who would it be?',
  "If you found out you'll die in a year, how would you live differently?",
  'If you got a new cat, what would you call it?',
  'If you had a billboard, what would you advertise?',
  'If you had a yacht, what would you call it?',
  'If you had to prepare a meal for everyone, what would you make?',
  'My 3 simple pleasures',
  'My most controversial opinion is...',
  "My parents think I'm...",
  'My typical day off involves...',
  'Never have I ever...',
  'Something I only learnt very recently',
  "Tell us something that you wouldn't share with your parents",
  'The best person I follow on social media is...',
  'The best way to win me over is...',
  "The show you'd most like to be in",
  'Two truths and a lie',
  'What are you famous for?',
  'What bores you the most?',
  "What constitues a 'perfect' day for you?",
  'What do you do to relax?',
  'What do you think when you look in the mirror?',
  'What do you value most in a friendship?',
  'What do you wish everyone knew about you?',
  'What do you wish you could spend more time doing?',
  "What do you wish you'd never done?",
  'What do your friends think of you?',
  'What does your most disturbing nightmare involve?',
  'What have you always dreamed of doing?',
  'What keeps you awake at night?',
  'What kind of lover are you?',
  'What makes you such a great person?',
  'What song do you sing in the shower?',
  'What was your favourite subject at school?',
  'What was your most frivolous purchase?',
  'What was your worst subject at school?',
  'What would be your death row meal?',
  'What would you advise that everyone invests their money in?',
  'What would you be most likely to be arrested for?',
  'What would you do if you won the lottery?',
  'What would you like to be remembered for?',
  'What would you say to your 10-year-old self?',
  "What's the best place you've ever spent the night?",
  "What's the best way you've ever spent 5 minutes?",
  "What's the biggest thing you own?",
  "What's the most beautiful thing you own?",
  "What's the most dangerous thing you've ever done?",
  "What's the most expensive thing you've ever bought?",
  "What's the most shameful thing you've ever done for money?",
  "What's the secret that we ought to know about you sooner or later?",
  "What's your biggest regret?",
  "What's your deepest insecurity about yourself?",
  "What's your dream job?",
  "What's your drink of choice?",
  "What's your favourite bit of the internet?",
  "What's your favourite body part?",
  "What's your favourite colour?",
  "What's your favourite film?",
  "What's your favourite food?",
  "What's your favourite form of exercise?",
  "What's your favourite holiday location?",
  "What's your favourite memory?",
  "What's your favourite pudding?",
  "What's your favourite song?",
  "What's your favourite sport?",
  "What's your go-to karaoke song?",
  "What's your greatest talent?",
  "What's your guilty pleasure?",
  "What's your ideal pet?",
  "What's your least favourite musical genre?",
  "What's your middle name?",
  "What's your morning routine?",
  "What's your most embarrassing moment?",
  "What's your most pointless belonging?",
  "What's your most unhealthy obsession?",
  "What's your musical taste?",
  "What's your natural hair colour?",
  "What's your proudest achievement?",
  "What's your specialist skill in the zombie apocalypse?",
  "What's your unusual party trick?",
  'When did you last cry?',
  'When do you feel your most attractive?',
  'When do you feel your most authentic self?',
  'Where were you born?',
  'Which app do you use the most?',
  'Which daily task are you the worst at?',
  'Which languages do you speak?',
  "Who's your celebrity crush?",
  "Who's your least favourite celebrity?",
  'You may not believe it, but I...',
  'Your usual takeaway order',
];

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

/**
 * Catfish instruction prompt templates.
 * `{playerName}` is substituted server-side at startGame time.
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

async function seedAllPrompts(useEmulator: boolean = true) {
  const db = initializeFirebaseAdmin({ useEmulator });

  console.log(
    `\nSeeding all prompts to ${useEmulator ? 'emulator' : 'production'}...\n`
  );

  // Seed text prompts
  console.log(`Seeding ${textPrompts.length} text prompts...`);
  const textBatch = db.batch();
  for (const text of textPrompts) {
    const docRef = db.collection('textPrompts').doc();
    textBatch.set(docRef, {
      text,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await textBatch.commit();
  console.log(`✓ Successfully seeded ${textPrompts.length} text prompts\n`);

  // Seed image prompts
  console.log(`Seeding ${imagePrompts.length} image prompts...`);
  const imageBatch = db.batch();
  for (const text of imagePrompts) {
    const docRef = db.collection('imagePrompts').doc();
    imageBatch.set(docRef, {
      text,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await imageBatch.commit();
  console.log(`✓ Successfully seeded ${imagePrompts.length} image prompts\n`);

  // Seed voting prompts
  console.log(`Seeding ${votingPrompts.length} voting prompts...`);
  const votingBatch = db.batch();
  for (const text of votingPrompts) {
    const docRef = db.collection('votingPrompts').doc();
    votingBatch.set(docRef, {
      text,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await votingBatch.commit();
  console.log(`✓ Successfully seeded ${votingPrompts.length} voting prompts\n`);

  // Seed catfish instruction prompts
  console.log(`Seeding ${catfishInstructionPrompts.length} catfish instruction prompts...`);
  const instructionBatch = db.batch();
  for (const text of catfishInstructionPrompts) {
    const docRef = db.collection('catfishInstructionPrompts').doc();
    instructionBatch.set(docRef, {
      text,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await instructionBatch.commit();
  console.log(`✓ Successfully seeded ${catfishInstructionPrompts.length} catfish instruction prompts\n`);

  const total = textPrompts.length + imagePrompts.length + votingPrompts.length + catfishInstructionPrompts.length;
  console.log(`✓ All done! Seeded ${total} prompts total.`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const useEmulator = !args.includes('--env=production');

seedAllPrompts(useEmulator)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding prompts:', error);
    process.exit(1);
  });
