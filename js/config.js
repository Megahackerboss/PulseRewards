export const firebaseConfig = {
  apiKey: "AIzaSyDu7QWUM1Zq4B1crSx0UfnPB_fRQGBJI4U",
  authDomain: "casino-f17da.firebaseapp.com",
  projectId: "casino-f17da",
  storageBucket: "casino-f17da.firebasestorage.app",
  messagingSenderId: "819263226212",
  appId: "1:819263226212:web:481c11da3101de7a5bfa71",
  measurementId: "G-GJSHX9Q989"
};

export const TASKS = [
  { id:'visit-site',    icon:'🌐', title:'Odwiedź stronę',            desc:'Wejdź na naszą stronę główną i rozejrzyj się przez chwilę.',  pts:10, url:'https://example.com',           gradient:'from-violet-500/30 to-indigo-700/30' },
  { id:'visit-partner', icon:'🤝', title:'Odwiedź naszego partnera',  desc:'Poznaj ofertę naszego partnera biznesowego.',                 pts:20, url:'https://partner.example.com',   gradient:'from-cyan-500/30 to-blue-700/30' },
  { id:'check-offer',   icon:'🏷️', title:'Sprawdź ofertę',            desc:'Zapoznaj się z aktualną ofertą specjalną tygodnia.',          pts:25, url:'https://example.com/oferta',    gradient:'from-fuchsia-500/30 to-purple-700/30' },
  { id:'join-discord',  icon:'💬', title:'Odwiedź naszego Discorda',  desc:'Dołącz do naszej społeczności i przywitaj się na #general.',  pts:30, url:'https://discord.gg/example',    gradient:'from-indigo-500/30 to-violet-700/30' },
  { id:'share-page',    icon:'📣', title:'Udostępnij stronę',         desc:'Podziel się naszą stroną w mediach społecznościowych.',       pts:50, url:'https://example.com/share',     gradient:'from-emerald-500/30 to-teal-700/30' },
];

export const REWARDS = [
  { id:'kukirin',    name:'KuKirin G2',        pts:10000, emoji:'🛴', desc:'Hulajnoga elektryczna. Otrzymasz 16-znakowy kod odbioru.', gradient:'from-violet-600/40 to-indigo-900/40' },
  { id:'headphones', name:'Słuchawki ANC',     pts:7500,  emoji:'🎧', desc:'Bezprzewodowe słuchawki ANC. Kod zrealizujesz w sklepie.',   gradient:'from-cyan-500/40 to-blue-900/40' },
  { id:'giftcard',   name:'Karta podarunkowa', pts:5000,  emoji:'💳', desc:'Voucher online o wartości 100 PLN.',                         gradient:'from-fuchsia-500/40 to-purple-900/40' },
  { id:'voucher',    name:'Bon zakupowy',      pts:2500,  emoji:'🎟️', desc:'Bon upominkowy 50 PLN do sklepów partnerskich.',            gradient:'from-emerald-500/40 to-teal-900/40' },
];

export const LOOTBOXES = [
  {
    id: 'basic', name: 'Basic Lootbox', emoji: '🎁', price: 50, tier: 'basic',
    gradient: 'from-violet-500/30 to-indigo-800/40',
    table: [
      { pts: 0, chance: 30 }, { pts: 15, chance: 25 }, { pts: 50, chance: 20 },
      { pts: 100, chance: 15 }, { pts: 200, chance: 7 }, { pts: 500, chance: 2.5 }, { pts: 1000, chance: 0.5 }
    ]
  },
  {
    id: 'premium', name: 'Premium Lootbox', emoji: '💎', price: 250, tier: 'premium',
    gradient: 'from-cyan-500/30 to-blue-800/40',
    table: [
      { pts: 0, chance: 30 }, { pts: 100, chance: 25 }, { pts: 250, chance: 20 },
      { pts: 500, chance: 12 }, { pts: 1000, chance: 8 }, { pts: 2500, chance: 4.5 }, { pts: 5000, chance: 0.5 }
    ]
  },
  {
    id: 'elite', name: 'Elite Lootbox', emoji: '⚡', price: 500, tier: 'elite',
    gradient: 'from-fuchsia-500/30 to-purple-800/40',
    table: [
      { pts: 0, chance: 30 }, { pts: 250, chance: 25 }, { pts: 500, chance: 20 },
      { pts: 100, chance: 15 }, { pts: 2500, chance: 7 }, { pts: 5000, chance: 2.5 }, { pts: 10000, chance: 0.5 }
    ]
  },
  {
    id: 'mega', name: 'Mega Lootbox', emoji: '🔥', price: 1000, tier: 'mega', badge: '50/50',
    gradient: 'from-amber-500/30 to-orange-800/40',
    table: [{ pts: 0, chance: 50 }, { pts: 3500, chance: 50 }]
  },
  {
    id: 'ultra', name: 'Ultra Lootbox', emoji: '🚀', price: 2500, tier: 'ultra',
    gradient: 'from-rose-500/30 to-pink-800/40',
    table: [
      { pts: 0, chance: 45 }, { pts: 1500, chance: 20 }, { pts: 3000, chance: 15 },
      { pts: 5000, chance: 12 }, { pts: 8000, chance: 6 }, { pts: 12000, chance: 2 }
    ]
  },
  {
    id: 'legendary', name: 'Legendary Lootbox', emoji: '👑', price: 5000, tier: 'legendary', badge: 'MAX 15 000',
    gradient: 'from-yellow-500/30 to-amber-800/40',
    table: [
      { pts: 0, chance: 55 }, { pts: 5000, chance: 25 }, { pts: 8000, chance: 12 },
      { pts: 12000, chance: 7.5 }, { pts: 15000, chance: 0.5 }
    ]
  }
];

export const FREE_BOX = {
  name: 'Free Box',
  emoji: '🎀',
  cooldown: 24 * 60 * 60 * 1000,
  table: [{ pts: 0, chance: 50 }, { pts: 30, chance: 50 }]
};

export const AD_BOX = {
  name: 'Ad Lootbox',
  emoji: '📺',
  cooldown: 10 * 60 * 1000,
  table: [
    { pts: 0,   chance: 30 },
    { pts: 3,   chance: 25 },
    { pts: 10,  chance: 20 },
    { pts: 20,  chance: 15 },
    { pts: 40,  chance: 7 },
    { pts: 100, chance: 2.5 },
    { pts: 200, chance: 0.5 }
  ]
};

export const FUNNY_ADS = [
  {
    videoId: "owGykVbfgUE",
    sponsor: "Old Spice",
    title: "Old Spice — Siedzę na koniu",
    desc: "Niemożliwe stało się możliwe. Prawdziwa męskość w 15 sekund."
  },
  {
    videoId: "1ZX_1aZ5b7E",
    sponsor: "Snickers",
    title: "Snickers — Nie jesteś sobą, gdy jesteś głodny",
    desc: "Zjedz Snickersa, bo gwiazdorzysz jak Mr. Bean na treningu ninja."
  },
  {
    videoId: "Y-3v8uhyPvw",
    sponsor: "Doritos",
    title: "Doritos — Kiedy chrupnięcie wchodzi za mocno",
    desc: "Maksymalna chrupkość i zero kompromisów. Chrup z nami!"
  },
  {
    videoId: "qzp4fBqF_bY",
    sponsor: "Sakeru Gummy",
    title: "Long Long Man — Najbardziej dramatyczna reklama",
    desc: "Dramat, zazdrość i niewiarygodnie długa żelka."
  }
];

export const VIEWS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tasks',     label: 'Zadania'   },
  { id: 'lootboxes', label: 'Lootboxy'  },
  { id: 'rewards',   label: 'Nagrody'   },
  { id: 'history',   label: 'Historia'  },
  { id: 'profile',   label: 'Profil'    },
];