/* eslint-disable */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// 1. KODY PROMOCYJNE
const PROMO_CODES = {
  START:   { pts: 150, desc: "Bonus startowy" },
  VIP2026: { pts: 300, desc: "Specjalny kod VIP" }
};

// 2. NAGRODY
const REWARDS = {
  kukirin:    { name: "KuKirin G2",        pts: 10000 },
  headphones: { name: "Słuchawki ANC",     pts: 7500 },
  giftcard:   { name: "Karta podarunkowa", pts: 5000 },
  voucher:    { name: "Bon zakupowy",      pts: 2500 }
};

// 3. SKRZYNKI PŁATNE
const LOOTBOXES = {
  basic: {
    price: 50,
    table: [
      { pts: 0, chance: 30 }, { pts: 15, chance: 25 }, { pts: 50, chance: 20 },
      { pts: 100, chance: 15 }, { pts: 200, chance: 7 }, { pts: 500, chance: 2.5 }, { pts: 1000, chance: 0.5 }
    ]
  },
  premium: {
    price: 250,
    table: [
      { pts: 0, chance: 30 }, { pts: 100, chance: 25 }, { pts: 250, chance: 20 },
      { pts: 500, chance: 12 }, { pts: 1000, chance: 8 }, { pts: 2500, chance: 4.5 }, { pts: 5000, chance: 0.5 }
    ]
  },
  elite: {
    price: 500,
    table: [
      { pts: 0, chance: 30 }, { pts: 250, chance: 25 }, { pts: 500, chance: 20 },
      { pts: 1000, chance: 15 }, { pts: 2500, chance: 7 }, { pts: 5000, chance: 2.5 }, { pts: 10000, chance: 0.5 }
    ]
  },
  mega: {
    price: 1000,
    table: [{ pts: 0, chance: 50 }, { pts: 3500, chance: 50 }]
  },
  ultra: {
    price: 2500,
    table: [
      { pts: 0, chance: 45 }, { pts: 1500, chance: 20 }, { pts: 3000, chance: 15 },
      { pts: 5000, chance: 12 }, { pts: 8000, chance: 6 }, { pts: 12000, chance: 2 }
    ]
  },
  legendary: {
    price: 5000,
    table: [
      { pts: 0, chance: 55 }, { pts: 5000, chance: 25 }, { pts: 8000, chance: 12 },
      { pts: 12000, chance: 7.5 }, { pts: 15000, chance: 0.5 }
    ]
  }
};

const TASKS = {
  "visit-site": 10,
  "visit-partner": 20,
  "check-offer": 25,
  "join-discord": 30,
  "share-page": 50
};

// 4. FREE BOX (24h)
const FREE_BOX_COOLDOWN = 24 * 60 * 60 * 1000;
const FREE_BOX_TABLE = [{ pts: 0, chance: 50 }, { pts: 30, chance: 50 }];

// 5. AD LOOTBOX (10 minut cooldown, nagrody 5x mniejsze niż Basic)
const AD_BOX_COOLDOWN = 10 * 60 * 1000; // 10 minut
const AD_BOX_TABLE = [
  { pts: 0,   chance: 30 },
  { pts: 3,   chance: 25 },
  { pts: 10,  chance: 20 },
  { pts: 20,  chance: 15 },
  { pts: 40,  chance: 7 },
  { pts: 100, chance: 2.5 },
  { pts: 200, chance: 0.5 }
];

function generateGiftCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function rollReward(table) {
  const total = table.reduce((s, r) => s + r.chance, 0);
  let r = Math.random() * total;
  for (const row of table) {
    r -= row.chance;
    if (r <= 0) return row.pts;
  }
  return table[table.length - 1].pts;
}

// NOWOŚĆ: SKRZYNKA ZA REKLAMĘ (AD LOOTBOX)
exports.claimAdLootbox = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Wymagane zalogowanie.");
  const userRef = db.collection("users").doc(request.auth.uid);

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError("not-found", "Konto nie istnieje.");
    const user = snap.data();

    const now = Date.now();
    if (now - (user.adBoxAt || 0) < AD_BOX_COOLDOWN) {
      throw new HttpsError("failed-precondition", "Skrzynka za reklamę nie jest jeszcze dostępna.");
    }

    const win = rollReward(AD_BOX_TABLE);
    const newPoints = (user.points || 0) + win;

    const historyItem = {
      id: "h_" + now,
      delta: win,
      label: win > 0 ? "Wygrana ze skrzynki za reklamę" : "Skrzynka za reklamę — brak wygranej",
      kind: "adbox",
      ts: now
    };

    tx.update(userRef, {
      points: newPoints,
      adBoxAt: now,
      "stats.lootboxes": admin.firestore.FieldValue.increment(1),
      history: [historyItem, ...(user.history || [])].slice(0, 100)
    });

    return { win, newPoints };
  });
});

// REALIZACJA KODU PROMOCYJNEGO
exports.redeemPromoCode = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Wymagane zalogowanie.");
  const rawCode = request.data.code;
  if (!rawCode || typeof rawCode !== "string") {
    throw new HttpsError("invalid-argument", "Wprowadź kod.");
  }

  const code = rawCode.trim().toUpperCase();
  const promo = PROMO_CODES[code];
  if (!promo) {
    throw new HttpsError("not-found", "Nieprawidłowy kod promocyjny.");
  }

  const userRef = db.collection("users").doc(request.auth.uid);

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError("not-found", "Konto nie istnieje.");
    const user = snap.data();

    const usedCodes = user.usedPromoCodes || [];
    if (usedCodes.includes(code)) {
      throw new HttpsError("already-exists", "Ten kod został już przez Ciebie wykorzystany.");
    }

    const newPoints = (user.points || 0) + promo.pts;
    const now = Date.now();

    const historyItem = {
      id: "h_" + now,
      delta: promo.pts,
      label: `Kod promocyjny: ${code}`,
      kind: "bonus",
      code: code,
      ts: now
    };

    tx.update(userRef, {
      points: newPoints,
      usedPromoCodes: admin.firestore.FieldValue.arrayUnion(code),
      history: [historyItem, ...(user.history || [])].slice(0, 100)
    });

    return { success: true, pts: promo.pts, code, newPoints };
  });
});

// WYMIANA NA 16-CYFROWY KOD UPOMINKOWY
exports.redeemReward = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Wymagane zalogowanie.");
  const { rewardId } = request.data;
  const reward = REWARDS[rewardId];
  if (!reward) throw new HttpsError("invalid-argument", "Niepoprawne ID nagrody.");

  const userRef = db.collection("users").doc(request.auth.uid);
  const giftCode = generateGiftCode();
  const now = Date.now();

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError("not-found", "Konto nie istnieje.");
    const user = snap.data();

    if ((user.points || 0) < reward.pts) {
      throw new HttpsError("failed-precondition", "Niewystarczająca liczba punktów.");
    }

    const newPoints = user.points - reward.pts;

    const codeRef = db.collection("gift_codes").doc(giftCode);
    tx.set(codeRef, {
      code: giftCode,
      rewardId: rewardId,
      rewardName: reward.name,
      pts: reward.pts,
      userId: request.auth.uid,
      userEmail: user.user?.email || request.auth.token.email || "",
      createdAt: now,
      status: "active"
    });

    const historyItem = {
      id: "h_" + now,
      delta: -reward.pts,
      label: `Wypłacono na kod: ${giftCode} (${reward.name})`,
      kind: "redeem",
      code: giftCode,
      rewardId: rewardId,
      ts: now
    };

    tx.update(userRef, {
      points: newPoints,
      "stats.rewards": admin.firestore.FieldValue.increment(1),
      history: [historyItem, ...(user.history || [])].slice(0, 100)
    });

    return { success: true, code: giftCode, rewardName: reward.name, newPoints };
  });
});

// OTWIERANIE PŁATNYCH SKRZYNEK
exports.openLootbox = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Wymagane logowanie.");
  const { boxId } = request.data;
  const box = LOOTBOXES[boxId];
  if (!box) throw new HttpsError("invalid-argument", "Nieznana skrzynka.");

  const userRef = db.collection("users").doc(request.auth.uid);

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError("not-found", "Konto nie istnieje.");
    const user = snap.data();

    if ((user.points || 0) < box.price) {
      throw new HttpsError("failed-precondition", "Niewystarczająca liczba punktów.");
    }

    const win = rollReward(box.table);
    const newPoints = user.points - box.price + win;

    const historyItems = [
      ...(win > 0 ? [{
        id: "h_" + Date.now() + "_win",
        delta: win,
        label: "Wygrana ze skrzynki " + boxId,
        kind: "win",
        ts: Date.now() + 1
      }] : []),
      {
        id: "h_" + Date.now() + "_cost",
        delta: -box.price,
        label: "Otwarto skrzynkę " + boxId,
        kind: "lootbox",
        ts: Date.now()
      }
    ];

    tx.update(userRef, {
      points: newPoints,
      "stats.lootboxes": admin.firestore.FieldValue.increment(1),
      history: [...historyItems, ...(user.history || [])].slice(0, 100)
    });

    return { win, newPoints };
  });
});

// FREE BOX (24h)
exports.claimFreeBox = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Wymagane logowanie.");
  const userRef = db.collection("users").doc(request.auth.uid);

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError("not-found", "Konto nie istnieje.");
    const user = snap.data();

    const now = Date.now();
    if (now - (user.freeBoxAt || 0) < FREE_BOX_COOLDOWN) {
      throw new HttpsError("failed-precondition", "Free Box nie jest jeszcze gotowa.");
    }

    const win = rollReward(FREE_BOX_TABLE);
    const newPoints = (user.points || 0) + win;

    const historyItem = {
      id: "h_" + now,
      delta: win,
      label: win > 0 ? "Wygrana z Free Box" : "Free Box — brak wygranej",
      kind: "freebox",
      ts: now
    };

    tx.update(userRef, {
      points: newPoints,
      freeBoxAt: now,
      "stats.lootboxes": admin.firestore.FieldValue.increment(1),
      history: [historyItem, ...(user.history || [])].slice(0, 100)
    });

    return { win, newPoints };
  });
});

// ODBIERANIE ZADAŃ
exports.claimTask = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Wymagane logowanie.");
  const { taskId } = request.data;
  const taskPts = TASKS[taskId];
  if (!taskPts) throw new HttpsError("invalid-argument", "Nieznane zadanie.");

  const userRef = db.collection("users").doc(request.auth.uid);

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const user = snap.data();

    if (user.tasks && user.tasks[taskId] === "done") {
      throw new HttpsError("already-exists", "Zadanie zostało już wykonane.");
    }

    const historyItem = {
      id: "h_" + Date.now(),
      delta: taskPts,
      label: "Wykonano zadanie",
      kind: "task",
      ts: Date.now()
    };

    tx.update(userRef, {
      points: (user.points || 0) + taskPts,
      [`tasks.${taskId}`]: "done",
      "stats.tasks": admin.firestore.FieldValue.increment(1),
      history: [historyItem, ...(user.history || [])].slice(0, 100)
    });

    return { success: true, pts: taskPts };
  });
});