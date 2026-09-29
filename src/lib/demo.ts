import type { AppState, Memory, Media, MemoryType, Person, Collection } from './types';

export const DEFAULT_TYPES: MemoryType[] = [
  { id: 'everyday', label: 'Everyday', emoji: '☀️' },
  { id: 'photo', label: 'Photos', emoji: '📸' },
  { id: 'story', label: 'Story', emoji: '✍️' },
  { id: 'met', label: 'We met', emoji: '❤️', milestone: true },
  { id: 'married', label: 'We got married', emoji: '💍', milestone: true },
  { id: 'home', label: 'New home', emoji: '🏠', milestone: true },
  { id: 'baby', label: 'Baby born', emoji: '👶', milestone: true },
  { id: 'steps', label: 'First steps', emoji: '👣', milestone: true },
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'graduation', label: 'Graduation', emoji: '🎓', milestone: true },
  { id: 'trip', label: 'Trip', emoji: '✈️' },
  { id: 'school', label: 'School', emoji: '🏫', milestone: true },
  { id: 'festival', label: 'Festival', emoji: '🎉' },
  { id: 'achievement', label: 'Achievement', emoji: '🏆', milestone: true },
  { id: 'funny', label: 'Funny moment', emoji: '😂' },
  { id: 'date', label: 'Important date', emoji: '📅' },
  { id: 'wedding', label: 'Wedding', emoji: '💐' },
];

export const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 'c-birthdays', name: 'Our Birthdays', emoji: '🎂' },
  { id: 'c-trips', name: 'Our Vacations', emoji: '✈️' },
  { id: 'c-festivals', name: 'Our Festivals', emoji: '🪔' },
  { id: 'c-kids', name: 'Our Kids', emoji: '🧸' },
  { id: 'c-home', name: 'Our Home', emoji: '🏠' },
  { id: 'c-weddings', name: 'Our Weddings', emoji: '💐' },
  { id: 'c-firsts', name: 'Our Firsts', emoji: '🌱' },
  { id: 'c-funny', name: 'Our Funny Moments', emoji: '😂' },
  { id: 'c-adventures', name: 'Our Adventures', emoji: '🏔️' },
];

const people: Person[] = [
  { id: 'dadaji', name: 'Dadaji', relation: 'Grandfather', birthday: '1954-01-18', generation: 0, tint: '#F6B73C' },
  { id: 'dadiji', name: 'Dadiji', relation: 'Grandmother', birthday: '1958-06-02', generation: 0, tint: '#F28FB1' },
  { id: 'dad', name: 'Dad', relation: 'Father', birthday: '1986-11-04', generation: 1, tint: '#5FA8E0' },
  { id: 'mom', name: 'Mom', relation: 'Mother', birthday: '1988-04-21', generation: 1, tint: '#F58A6B' },
  { id: 'chitransh', name: 'Chitransh', relation: 'Son', birthday: '2016-03-14', generation: 2, tint: '#5CC08A' },
  { id: 'shivansh', name: 'Shivansh', relation: 'Son', birthday: '2021-09-29', generation: 2, tint: '#FFD24A' },
  { id: 'eva', name: 'Eva', relation: 'Daughter', birthday: '2025-07-08', generation: 2, tint: '#B993F0' },
];

let seed = 11;
const R = [4 / 3, 3 / 4, 1, 3 / 2, 4 / 5];
function shots(scenes: string[], count: number, videos = 0): Media[] {
  const out: Media[] = [];
  for (let i = 0; i < count; i++) {
    seed += 7;
    const s = scenes[i % scenes.length];
    const ratio = i === 0 ? 4 / 3 : R[(seed >> 1) % R.length];
    out.push({ id: `p${seed}`, kind: 'photo', src: `scene:${s}:${seed}:${ratio}`, ratio });
  }
  for (let i = 0; i < videos; i++) {
    seed += 7;
    const s = scenes[(i + 1) % scenes.length];
    out.push({ id: `v${seed}`, kind: 'video', src: `scene:${s}:${seed}:${16 / 9}`, ratio: 16 / 9 });
  }
  return out;
}

let n = 0;
function m(
  date: string,
  title: string,
  type: string,
  scenes: string[],
  photos: number,
  o: Partial<Memory> & { videos?: number } = {},
): Memory {
  n++;
  const { videos = 0, ...rest } = o;
  return {
    id: `m${n}`,
    title,
    date,
    type,
    people: [],
    tags: [],
    media: scenes.length ? shots(scenes, photos, videos) : [],
    createdAt: n,
    ...rest,
  };
}

const ALL = ['dad', 'mom', 'chitransh', 'shivansh'];
const ALL5 = [...ALL, 'eva'];

const memories: Memory[] = [
  // 2012–2016: how it began
  m('2012-08-17', 'The day we met', 'met', ['rain'], 2, {
    people: ['dad', 'mom'], place: 'Bengaluru', favorite: true, collections: ['c-firsts'],
    story: 'A friend’s birthday on Church Street, a sudden downpour, and one shared umbrella. We talked until the café closed and the rain didn’t stop.',
  }),
  m('2013-02-10', 'We got married', 'married', ['wedding', 'festival'], 6, {
    people: ['dad', 'mom', 'dadaji', 'dadiji'], place: 'Amritsar', favorite: true, yearly: true, collections: ['c-weddings', 'c-firsts'],
    story: 'Marigolds everywhere, Dadiji crying through the whole ceremony, and a baraat that danced for two hours straight.',
  }),
  m('2014-05-02', 'Keys to our first home', 'home', ['home', 'kitchen'], 4, {
    people: ['dad', 'mom'], place: 'Indiranagar, Bengaluru', collections: ['c-home', 'c-firsts'],
    story: 'Empty rooms, one mattress and a pressure cooker. We ate dal on the floor and thought it was the best meal of our lives.',
  }),
  m('2016-03-14', 'Chitransh was born', 'baby', ['nursery'], 5, {
    people: ['dad', 'mom', 'chitransh', 'dadaji', 'dadiji'], place: 'Bengaluru', favorite: true, collections: ['c-kids', 'c-firsts'],
    story: '3.1 kg of pure noise. Dadaji held him first and refused to give him back.',
  }),
  m('2019-12-26', 'Snow for the first time', 'trip', ['snow', 'mountains'], 6, {
    people: ['dad', 'mom', 'chitransh'], place: 'Manali', collections: ['c-trips', 'c-adventures', 'c-firsts'], videos: 1,
    story: 'Chitransh tasted the snow before he touched it. Then he refused to come inside.',
  }),
  m('2021-09-29', 'Shivansh was born', 'baby', ['nursery'], 5, {
    people: ['dad', 'mom', 'chitransh', 'shivansh'], place: 'Bengaluru', favorite: true, collections: ['c-kids', 'c-firsts'],
    story: 'Chitransh became a big brother at 5 and announced he would teach Shivansh cricket “from tomorrow.”',
  }),

  // 2022
  m('2022-02-12', 'Cousin Simran’s wedding', 'wedding', ['wedding', 'festival'], 7, {
    people: [...ALL, 'dadaji', 'dadiji'], place: 'Amritsar', collections: ['c-weddings'], videos: 1,
    story: 'Three days of sangeet, the boys asleep under the dessert table, and Dadaji winning the bhangra-off.',
  }),
  m('2022-06-05', 'Sunday at Cubbon Park', 'everyday', ['park'], 3, {
    people: ALL, place: 'Cubbon Park, Bengaluru',
    story: 'Nothing special. Just the four of us on a blanket, a flask of chai and a kite that never really flew.',
  }),
  m('2022-09-29', 'Shivansh’s first birthday', 'birthday', ['birthday'], 6, {
    people: [...ALL, 'dadaji', 'dadiji'], place: 'Home', favorite: true, collections: ['c-birthdays', 'c-kids', 'c-firsts'], videos: 1,
    story: 'He put his whole hand in the cake, looked around at everyone, and laughed like he knew exactly what he’d done.',
  }),
  m('2022-10-24', 'Diwali at Dadaji’s', 'festival', ['festival'], 5, {
    people: [...ALL, 'dadaji', 'dadiji'], place: 'Amritsar', collections: ['c-festivals'],
    story: 'Chitransh lit his first diya on his own and guarded it all night.',
  }),

  // 2023
  m('2023-03-12', 'Shivansh’s first steps', 'steps', ['garden', 'kitchen'], 4, {
    people: ALL, place: 'Home', favorite: true, collections: ['c-kids', 'c-firsts'], videos: 1,
    story: 'Today Shivansh took his first steps. Everyone was screaming and laughing. He took four steps, sat down, and clapped for himself.',
  }),
  m('2023-03-14', 'Chitransh turns 7', 'birthday', ['birthday'], 4, {
    people: ALL, place: 'Home', collections: ['c-birthdays'],
    story: 'A cricket-bat cake, seven candles and one very serious speech about how he is “basically grown up now.”',
  }),
  m('2023-06-18', 'Chitransh’s first day of Class 2', 'school', ['school'], 3, {
    people: ['mom', 'chitransh'], place: 'Bengaluru', collections: ['c-kids'],
    story: 'New shoes, a bag bigger than him, and not a single look back at the gate. Mom cried in the car.',
  }),
  m('2023-09-29', 'Goa, just the four of us', 'trip', ['beach', 'lake'], 7, {
    people: ALL, place: 'Goa', collections: ['c-trips', 'c-adventures'], videos: 2,
    story: 'Today we went to the beach with the kids. The boys spent the entire afternoon collecting shells. It was one of those simple days we never want to forget.',
  }),

  // 2024
  m('2024-03-25', 'Holi in the building', 'festival', ['park', 'festival'], 5, {
    people: ALL, place: 'Home', collections: ['c-festivals', 'c-funny'], videos: 1,
    story: 'Shivansh chased the security uncle with a water gun for twenty minutes. We are still apologising.',
  }),
  m('2024-06-10', 'Shivansh starts playschool', 'school', ['school'], 3, {
    people: ['dad', 'shivansh'], place: 'Bengaluru', collections: ['c-kids', 'c-firsts'],
    story: 'He waved at everyone, including the plants.',
  }),
  m('2024-09-29', 'Shivansh turns 3', 'birthday', ['birthday', 'park'], 5, {
    people: [...ALL, 'dadaji', 'dadiji'], place: 'Home', collections: ['c-birthdays'],
    story: 'A dinosaur party. He wanted to be the dinosaur, the cake and the guest of honour all at once.',
  }),
  m('2024-11-01', 'Diwali lights', 'festival', ['festival'], 4, {
    people: ALL, place: 'Home', collections: ['c-festivals'],
  }),
  m('2024-12-22', 'Road trip to Coorg', 'trip', ['mountains', 'lake'], 6, {
    people: ALL, place: 'Coorg', collections: ['c-trips', 'c-adventures'], videos: 1,
    story: 'Coffee estates, a flat tyre in the rain and the best maggi of our lives at a roadside stall.',
  }),

  // 2025
  m('2025-01-19', 'Our new home', 'home', ['home', 'kitchen'], 5, {
    people: ALL, place: 'Whitefield, Bengaluru', favorite: true, collections: ['c-home'],
    story: 'A room for each boy, a balcony for Mom’s plants and space for one more.',
  }),
  m('2025-07-08', 'Eva was born ❤️', 'baby', ['nursery'], 8, {
    people: [...ALL5, 'dadaji', 'dadiji'], place: 'Bengaluru', favorite: true, collections: ['c-kids', 'c-firsts'], videos: 2,
    story: 'Our daughter. The boys have not stopped whispering around her since. Shivansh brought her his favourite toy truck on day one.',
  }),
  m('2025-08-03', 'First family photo with Eva', 'photo', ['kitchen', 'garden'], 6, {
    people: ALL5, place: 'Home', collections: ['c-kids'],
    story: 'Five of us now. It took forty tries and a lot of bribery to get everyone looking at the camera at once.',
  }),
  m('2025-09-29', 'Family dinner for Shivansh’s 4th', 'birthday', ['dinner', 'birthday'], 5, {
    people: [...ALL5, 'dadaji', 'dadiji'], place: 'Home', collections: ['c-birthdays'],
    story: 'Dadiji’s rajma, Dad’s terrible jokes and Eva asleep through the whole song.',
  }),
  m('2025-10-20', 'Eva’s first Diwali', 'festival', ['festival'], 5, {
    people: ALL5, place: 'Home', collections: ['c-festivals', 'c-firsts'],
    story: 'She stared at the diyas for an hour and would not look away.',
  }),
  m('2025-12-28', 'Dubai with Dadaji and Dadiji', 'trip', ['city', 'beach'], 7, {
    people: [...ALL5, 'dadaji', 'dadiji'], place: 'Dubai', collections: ['c-trips', 'c-adventures'], videos: 1,
    story: 'Burj Khalifa at sunset, a desert safari where Dadaji rode the camel twice, and Eva’s first flight.',
  }),

  // 2026
  m('2026-01-01', 'New Year on the balcony', 'everyday', ['city', 'home'], 3, {
    people: ALL5, place: 'Home',
  }),
  m('2026-02-10', '13 years married', 'date', ['dinner'], 2, {
    people: ['dad', 'mom'], place: 'Bengaluru',
    story: 'Same restaurant as our first anniversary. Same table, too.',
  }),
  m('2026-03-04', 'Holi with Eva', 'festival', ['park'], 4, {
    people: ALL5, place: 'Home', collections: ['c-festivals', 'c-funny'],
    story: 'Eva got exactly one dot of pink on her nose and looked deeply offended.',
  }),
  m('2026-03-14', 'Chitransh turns 10', 'birthday', ['birthday'], 6, {
    people: [...ALL5, 'dadaji', 'dadiji'], place: 'Home', collections: ['c-birthdays'], videos: 1,
    story: 'Double digits. He asked for a telescope and stayed up to see Saturn.',
  }),
  m('2026-04-26', 'Chitransh’s first cricket trophy', 'achievement', ['park'], 3, {
    people: ['dad', 'chitransh', 'shivansh'], place: 'Bengaluru',
    story: 'Player of the match. Shivansh carried the trophy home and told everyone it was his.',
  }),
  m('2026-06-14', 'Summer in the hills', 'trip', ['mountains', 'lake', 'park'], 7, {
    people: ALL5, place: 'Ooty', collections: ['c-trips', 'c-adventures'], videos: 2,
    story: 'A toy train, a boat on the lake and three kids asleep in the back seat on the way down.',
  }),
  m('2026-07-08', 'Eva’s first birthday', 'birthday', ['birthday', 'garden'], 7, {
    people: [...ALL5, 'dadaji', 'dadiji'], place: 'Home', favorite: true, collections: ['c-birthdays', 'c-kids', 'c-firsts'], videos: 2,
    story: 'She took two wobbly steps toward the cake and the whole room went silent. Then she sat down and ate the icing.',
  }),
  m('2026-08-16', 'Monsoon pakoras', 'everyday', ['rain', 'kitchen'], 3, {
    people: ALL5, place: 'Home',
    story: 'Power cut, candles, and Mom’s pakoras. The boys called it the best evening of the holidays.',
  }),
  m('2026-09-07', 'Ganesh Chaturthi', 'festival', ['festival'], 5, {
    people: [...ALL5, 'dadaji', 'dadiji'], place: 'Home', collections: ['c-festivals'],
  }),
  m('2026-09-20', 'Sunday pancake disaster', 'funny', ['kitchen'], 3, {
    people: ['dad', 'chitransh', 'shivansh'], place: 'Home', collections: ['c-funny'],
    story: 'The boys made breakfast for Mom. There is still batter on the ceiling.',
  }),
];

export function demoState(): AppState {
  return {
    family: {
      name: 'Khalsa',
      since: '2012-08-17',
      intro: 'Two people who shared an umbrella in the rain, three kids, two grandparents who spoil everyone, and a lot of dal. This is where we keep the moments we never want to forget.',
      privacy: 'private',
      theme: 'system',
    },
    people: people.map((p) => ({ ...p })),
    memories: memories.map((x) => ({ ...x, media: x.media.map((y) => ({ ...y })) })),
    types: DEFAULT_TYPES.map((t) => ({ ...t })),
    collections: DEFAULT_COLLECTIONS.map((c) => ({ ...c })),
    demo: true,
  };
}

export function emptyState(name = 'Our'): AppState {
  return {
    family: { name, since: new Date().toISOString().slice(0, 10), intro: '', privacy: 'private', theme: 'system' },
    people: [],
    memories: [],
    types: DEFAULT_TYPES.map((t) => ({ ...t })),
    collections: DEFAULT_COLLECTIONS.map((c) => ({ ...c })),
    demo: false,
  };
}
