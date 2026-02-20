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

async function seedTextPrompts(useEmulator: boolean = true) {
  const db = initializeFirebaseAdmin({ useEmulator });

  console.log(
    `Seeding ${textPrompts.length} text prompts to ${
      useEmulator ? 'emulator' : 'production'
    }...`
  );

  const batch = db.batch();
  let count = 0;

  for (const text of textPrompts) {
    const docRef = db.collection('textPrompts').doc();
    batch.set(docRef, {
      text,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    count++;
  }

  await batch.commit();
  console.log(`✓ Successfully seeded ${count} text prompts`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const useEmulator = !args.includes('--env=production');

seedTextPrompts(useEmulator)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding text prompts:', error);
    process.exit(1);
  });
