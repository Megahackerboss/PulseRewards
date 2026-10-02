import { store, freeBoxReady, freeBoxRemaining, adBoxReady, adBoxRemaining } from "./state.js";
import { TASKS, REWARDS, LOOTBOXES, FREE_BOX, AD_BOX, VIEWS } from "./config.js";
import { fmt, ptsWord, timeAgo, fullDate, formatDuration } from "./ui.js";

function nextReward() {
  const sorted = [...REWARDS].sort((a, b) => a.pts - b.pts);
  const userPts = store.state ? store.state.points : 0;
  return sorted.find(r => r.pts > userPts) || sorted[sorted.length - 1];
}

function maxPrize(box) {
  return box.table.reduce((m, r) => Math.max(m, r.pts), 0);
}

export function renderAll() {
  if (!store.state) return;
  renderNav();
  renderDashboard();
  renderTasks();
  renderLootboxes();
  renderRewards();
  renderHistory();
  renderProfile();
}

export function renderNav() {
  const linkCls = id => `px-3.5 py-2 rounded-xl text-sm font-medium transition ${
    store.currentView === id ? 'nav-active' : 'text-white/60 hover:text-white hover:bg-white/5'
  }`;
  const mobCls = id => `w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition ${
    store.currentView === id ? 'nav-active' : 'text-white/60 hover:text-white hover:bg-white/5'
  }`;
  document.getElementById('nav-links').innerHTML =
    VIEWS.map(v => `<button data-action="nav" data-nav="${v.id}" class="${linkCls(v.id)}">${v.label}</button>`).join('');
  document.getElementById('mobile-menu').innerHTML =
    VIEWS.map(v => `<button data-action="nav" data-nav="${v.id}" class="${mobCls(v.id)}">${v.label}</button>`).join('');

  document.getElementById('nav-points').textContent = fmt(store.state.points);
  document.getElementById('nav-avatar').textContent = (store.state.user?.username?.[0] || 'U').toUpperCase();
  document.getElementById('profile-username').textContent = store.state.user?.username || 'Użytkownik';
  document.getElementById('profile-email').textContent = store.state.user?.email || store.currentUser?.email || '—';
}

export function renderDashboard() {
  const el = document.getElementById('view-dashboard');
  const next = nextReward();
  const pct = Math.min(100, (store.state.points / next.pts) * 100);
  const missing = Math.max(0, next.pts - store.state.points);
  const availableTasks = TASKS.filter(t => (store.state.tasks?.[t.id] || 'available') !== 'done').length;
  const recent = (store.state.history || []).slice(0, 5);

  el.innerHTML = `
  <div class="space-y-6">
    <section class="relative overflow-hidden glass rounded-3xl p-6 sm:p-10 card">
      <div class="absolute -top-28 -right-20 w-72 h-72 rounded-full bg-violet-600/25 blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-36 -left-24 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none"></div>
      <div class="relative">
        <p class="text-[11px] font-bold uppercase tracking-[.28em] text-violet-300/80">Twoje punkty</p>
        <div class="mt-3 flex flex-wrap items-end gap-3">
          <span id="hero-points"
                class="text-6xl sm:text-7xl font-black tracking-tight tabular-nums
                       bg-gradient-to-r from-white via-violet-100 to-cyan-200 bg-clip-text text-transparent">
            ${fmt(store.state.points)}
          </span>
          <span class="mb-2 text-2xl font-extrabold text-violet-300">PTS</span>
        </div>

        <div class="mt-8 max-w-2xl">
          <div class="flex flex-wrap items-center justify-between gap-2 text-sm mb-2.5">
            <span class="text-white/50">Postęp do nagrody:
              <span class="text-white font-semibold">${next.emoji} ${next.name}</span>
            </span>
            <span class="text-white/50 tabular-nums">${fmt(store.state.points)} / ${fmt(next.pts)} PTS</span>
          </div>
          <div class="progress-track h-3"><div class="progress-fill" style="width:${pct}%"></div></div>
          <p class="mt-2.5 text-xs font-medium ${missing > 0 ? 'text-amber-300/90' : 'text-emerald-300'}">
            ${missing > 0 ? `Potrzebujesz jeszcze ${fmt(missing)} ${ptsWord(missing)}` : 'Możesz już odebrać kod na tę nagrodę! 🎁'}
          </p>
        </div>

        <div class="mt-8 flex flex-wrap gap-3">
          <button class="btn btn-primary px-5 py-3 text-sm" data-action="nav" data-nav="tasks">⚡ Zdobądź punkty</button>
          <button class="btn btn-ghost px-5 py-3 text-sm" data-action="nav" data-nav="lootboxes">🎁 Otwórz lootbox</button>
          <button class="btn btn-gold px-5 py-3 text-sm" data-action="nav" data-nav="rewards">🏆 Odbierz kody</button>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      ${statCard('Wykonane zadania',  fmt(store.state.stats?.tasks || 0),     '✅', 'z ' + TASKS.length + ' dostępnych')}
      ${statCard('Otwarte lootboxy',  fmt(store.state.stats?.lootboxes || 0), '📦', 'w tym skrzynki za reklamy')}
      ${statCard('Wypłacone kody',    fmt(store.state.stats?.rewards || 0),   '🎟️', 'wygenerowane vouchery')}
      ${statCard('Dostępne zadania',  fmt(availableTasks),                    '🎯', 'czeka na wykonanie')}
    </section>

    <section class="glass rounded-3xl p-6 sm:p-7">
      <div class="flex items-center justify-between gap-4 mb-5">
        <h2 class="text-lg font-bold tracking-tight">Ostatnia aktywność</h2>
        <button class="text-xs font-semibold text-violet-300 hover:text-violet-200 transition"
                data-action="nav" data-nav="history">Zobacz całą historię →</button>
      </div>
      <div class="space-y-2">
        ${recent.length ? recent.map(historyRow).join('') : `<p class="text-sm text-white/35 py-6 text-center">Brak aktywności. Zacznij od wykonania zadania!</p>`}
      </div>
    </section>
  </div>`;
}

function statCard(label, value, icon, sub) {
  return `
  <div class="glass card rounded-2xl p-5">
    <div class="flex items-center justify-between">
      <span class="text-2xl">${icon}</span>
      <span class="text-2xl font-black tabular-nums tracking-tight">${value}</span>
    </div>
    <p class="mt-3 text-[11px] font-bold uppercase tracking-widest text-white/40">${label}</p>
    <p class="mt-1 text-[11px] text-white/25">${sub}</p>
  </div>`;
}

export function renderTasks() {
  const el = document.getElementById('view-tasks');
  const doneCount = TASKS.filter(t => (store.state.tasks?.[t.id] || 'available') === 'done').length;
  el.innerHTML = `
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">Zdobądź punkty</h1>
        <p class="mt-2 text-white/50 text-sm sm:text-base">Wykonuj zadania, a punkty trafią prosto do Twojej bazy Firestore.</p>
      </div>
      <div class="glass rounded-2xl px-5 py-3">
        <p class="text-[10px] font-bold uppercase tracking-widest text-white/40">Ukończone</p>
        <p class="text-2xl font-black tabular-nums">${doneCount}<span class="text-white/25 text-lg font-bold">/${TASKS.length}</span></p>
      </div>
    </header>
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      ${TASKS.map(taskCard).join('')}
    </div>
  </div>`;
}

function taskCard(task) {
  const status = store.state.tasks?.[task.id] || 'available';
  const done = status === 'done';
  const statusMap = {
    available: ['Dostępne', 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20'],
    done:      ['Wykonane',  'bg-white/5 text-white/35 border-white/10'],
  };
  const [statusLabel, statusCls] = statusMap[status] || statusMap.available;
  const button = done
    ? `<button class="btn btn-ghost px-4 py-2.5 text-sm" disabled>✓ Wykonane</button>`
    : `<button class="btn btn-primary px-4 py-2.5 text-sm" data-action="task-claim" data-id="${task.id}">Odbierz +${task.pts} PTS</button>`;

  return `
  <article class="glass card rounded-2xl p-5 flex flex-col ${done ? 'opacity-60' : ''}">
    <div class="flex items-start justify-between gap-3">
      <div class="w-12 h-12 rounded-2xl grid place-items-center text-2xl bg-gradient-to-br ${task.gradient} shadow-glowSm">${task.icon}</div>
      <span class="text-xs font-extrabold text-violet-200 bg-violet-500/10 border border-violet-400/25 rounded-full px-3 py-1.5 tabular-nums">+${task.pts} PTS</span>
    </div>
    <h3 class="mt-4 font-bold text-[17px] tracking-tight">${task.title}</h3>
    <p class="mt-1.5 text-sm text-white/45 leading-relaxed">${task.desc}</p>
    <div class="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
      <span class="text-[10px] font-bold uppercase tracking-widest border rounded-full px-2.5 py-1 ${statusCls}">${statusLabel}</span>
      ${button}
    </div>
  </article>`;
}

export function renderLootboxes() {
  const el = document.getElementById('view-lootboxes');
  const readyFree = freeBoxReady();
  const remFree = freeBoxRemaining();
  const readyAd = adBoxReady();
  const remAd = adBoxRemaining();

  el.innerHTML = `
  <div class="space-y-8">
    <header>
      <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">Lootboxy</h1>
      <p class="mt-2 text-white/50 text-sm sm:text-base">
        Otwieraj darmowe skrzynki, oglądaj reklamy lub spróbuj szczęścia w skrzynkach za punkty.
      </p>
    </header>

    <div class="grid lg:grid-cols-2 gap-5">
      <!-- FREE BOX -->
      <article class="glass card rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
        <div class="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none"></div>
        <div class="relative">
          <div class="flex items-center gap-4 mb-4">
            <div class="lootbox-visual w-16 h-16 rounded-2xl grid place-items-center text-3xl
                        bg-gradient-to-br from-cyan-500/30 to-blue-800/40 border border-white/10 shadow-glowSm shrink-0">
              ${FREE_BOX.emoji}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-extrabold tracking-tight">${FREE_BOX.name}</h2>
                <span class="text-[9px] font-bold uppercase tracking-widest text-cyan-300 bg-cyan-500/10 border border-cyan-400/25 rounded-full px-2 py-0.5">Raz / 24h</span>
              </div>
              <p class="mt-1 text-xs text-white/45">Darmowa dzienna skrzynka punktowa.</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 text-[11px] mb-5">
            ${FREE_BOX.table.map(r => `
              <span class="px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5">
                <span class="font-bold ${r.pts > 0 ? 'text-white/85' : 'text-white/40'}">${r.pts > 0 ? '+' + fmt(r.pts) + ' PTS' : '0 PTS'}</span>
                <span class="text-white/40"> · ${r.chance}%</span>
              </span>`).join('')}
          </div>
        </div>
        <div class="relative pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          ${readyFree ? `
            <span class="text-xs text-emerald-300 font-semibold">Gotowa do odebrania!</span>
            <button class="btn btn-primary px-5 py-2.5 text-xs" data-action="claim-freebox" ${store.isOpeningBox ? 'disabled' : ''}>
              🎀 Odbierz Free Box
            </button>
          ` : `
            <div>
              <p class="text-[10px] font-bold uppercase text-white/40">Dostępna za</p>
              <p id="freebox-countdown" class="text-sm font-black tabular-nums text-cyan-300">${formatDuration(remFree)}</p>
            </div>
            <button class="btn btn-ghost px-4 py-2.5 text-xs" data-action="claim-freebox">Odebrana</button>
          `}
        </div>
      </article>

      <!-- AD LOOTBOX -->
      <article class="glass card rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between border-amber-400/20">
        <div class="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none"></div>
        <div class="relative">
          <div class="flex items-center gap-4 mb-4">
            <div class="lootbox-visual w-16 h-16 rounded-2xl grid place-items-center text-3xl
                        bg-gradient-to-br from-amber-500/30 to-orange-800/40 border border-amber-400/30 shadow-glowSm shrink-0">
              ${AD_BOX.emoji}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-extrabold tracking-tight">${AD_BOX.name}</h2>
                <span class="text-[9px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-400/25 rounded-full px-2 py-0.5">Raz / 10 min</span>
              </div>
              <p class="mt-1 text-xs text-white/45">Obejrzyj 15s wideo (nagrody = Basic / 5).</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 text-[11px] mb-5">
            ${AD_BOX.table.map(r => `
              <span class="px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5">
                <span class="font-bold ${r.pts > 0 ? 'text-amber-200' : 'text-white/40'}">${r.pts > 0 ? '+' + fmt(r.pts) + ' PTS' : '0 PTS'}</span>
                <span class="text-white/40"> · ${r.chance}%</span>
              </span>`).join('')}
          </div>
        </div>
        <div class="relative pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          ${readyAd ? `
            <span class="text-xs text-amber-300 font-semibold">Reklama gotowa!</span>
            <button class="btn btn-gold px-5 py-2.5 text-xs shadow-gold" data-action="claim-adbox">
              📺 Obejrzyj reklamę (+PTS)
            </button>
          ` : `
            <div>
              <p class="text-[10px] font-bold uppercase text-white/40">Kolejna reklama za</p>
              <p id="adbox-countdown" class="text-sm font-black tabular-nums text-amber-300">${formatDuration(remAd)}</p>
            </div>
            <button class="btn btn-ghost px-4 py-2.5 text-xs" data-action="claim-adbox">Oczekuje (${formatDuration(remAd)})</button>
          `}
        </div>
      </article>
    </div>

    <!-- PŁATNE BOXES -->
    <section>
      <div class="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight">Płatne lootboxy</h2>
          <p class="mt-1 text-sm text-white/45">Zabezpieczone przed manipulacją w konsoli deweloperskiej.</p>
        </div>
        <div class="glass rounded-2xl px-4 py-2.5 hidden sm:block">
          <p class="text-[10px] font-bold uppercase tracking-widest text-white/40">Twoje saldo</p>
          <p class="text-lg font-black tabular-nums">${fmt(store.state.points)} <span class="text-xs text-violet-300">PTS</span></p>
        </div>
      </div>
      <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        ${LOOTBOXES.map(lootboxCard).join('')}
      </div>
    </section>
  </div>`;
}

function lootboxCard(box) {
  const can = store.state.points >= box.price;
  const missing = Math.max(0, box.price - store.state.points);
  const top = maxPrize(box);
  const isLegendary = box.tier === 'legendary';
  const isMega = box.tier === 'mega';

  return `
  <article class="glass card rounded-2xl p-5 flex flex-col relative overflow-hidden ${isLegendary ? 'legendary-shine' : ''}">
    <div class="relative flex items-start justify-between gap-3">
      <div class="w-14 h-14 rounded-2xl grid place-items-center text-3xl bg-gradient-to-br ${box.gradient} border border-white/10 shadow-glowSm">
        ${box.emoji}
      </div>
      <div class="flex flex-col items-end gap-1.5">
        ${box.badge ? `<span class="text-[10px] font-bold uppercase tracking-widest text-amber-200 bg-amber-500/15 border border-amber-400/30 rounded-full px-2.5 py-1">${box.badge}</span>` : ''}
        <span class="text-[10px] font-bold uppercase tracking-widest text-white/40">MAX ${fmt(top)}</span>
      </div>
    </div>
    <h3 class="relative mt-4 font-bold text-[17px] tracking-tight">${box.name}</h3>
    <div class="relative mt-2 flex items-center gap-2 text-2xl font-black tabular-nums">
      ${fmt(box.price)}<span class="text-sm font-extrabold text-violet-300">PTS</span>
    </div>
    <div class="relative mt-5 pt-4 border-t border-white/5 space-y-2">
      <p class="text-[10px] font-bold uppercase tracking-widest text-white/40">Szanse</p>
      ${box.table.slice().reverse().map(r => chanceRow(r.pts, r.chance, isLegendary ? 'amber' : isMega ? 'orange' : 'violet')).join('')}
    </div>
    <div class="relative mt-5 pt-4 border-t border-white/5 flex flex-col gap-2">
      <button class="btn ${can ? (isLegendary ? 'btn-gold' : 'btn-primary') : 'btn-ghost'} w-full py-3 text-sm"
              data-action="open-lootbox" data-id="${box.id}"
              ${can && !store.isOpeningBox ? '' : 'disabled'}>
        ${can ? (isLegendary ? '👑 Otwórz Legendary' : '🎁 Otwórz za ' + fmt(box.price) + ' PTS') : 'Za mało punktów'}
      </button>
      ${can ? '' : `<p class="text-[11px] text-amber-300/90 font-medium text-center">Potrzebujesz jeszcze ${fmt(missing)} ${ptsWord(missing)}</p>`}
    </div>
  </article>`;
}

function chanceRow(pts, chance, tone = 'violet') {
  const tones = {
    violet: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
    amber:  'bg-gradient-to-r from-amber-400 to-yellow-500',
    orange: 'bg-gradient-to-r from-orange-400 to-amber-500',
  };
  return `
  <div>
    <div class="flex items-center justify-between text-xs mb-1">
      <span class="font-semibold ${pts > 0 ? 'text-white/80' : 'text-white/40'}">
        ${pts > 0 ? '+' + fmt(pts) + ' PTS' : 'Brak wygranej'}
      </span>
      <span class="text-white/40 font-semibold tabular-nums">${chance}%</span>
    </div>
    <div class="h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div class="h-full rounded-full ${tones[tone] || tones.violet}" style="width:${chance}%"></div>
    </div>
  </div>`;
}

export function renderRewards() {
  const el = document.getElementById('view-rewards');
  const sorted = [...REWARDS].sort((a, b) => b.pts - a.pts);
  el.innerHTML = `
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">Odbierz nagrody</h1>
        <p class="mt-2 text-white/50 text-sm sm:text-base">
          Wymień punkty na unikalny 16-znakowy kod upominkowy zaprogramowany w bazie danych.
        </p>
      </div>
      <div class="glass rounded-2xl px-5 py-3">
        <p class="text-[10px] font-bold uppercase tracking-widest text-white/40">Twoje saldo</p>
        <p class="text-2xl font-black tabular-nums">${fmt(store.state.points)} <span class="text-sm text-violet-300">PTS</span></p>
      </div>
    </header>
    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
      ${sorted.map(rewardCard).join('')}
    </div>
  </div>`;
}

function rewardCard(reward) {
  const can = store.state.points >= reward.pts;
  const missing = Math.max(0, reward.pts - store.state.points);
  return `
  <article class="glass card rounded-2xl overflow-hidden flex flex-col">
    <div class="relative h-40 bg-gradient-to-br ${reward.gradient} grid place-items-center overflow-hidden">
      <span class="relative text-6xl drop-shadow-[0_8px_20px_rgba(0,0,0,.5)]">${reward.emoji}</span>
    </div>
    <div class="p-5 flex flex-col flex-1">
      <h3 class="font-bold text-[17px] tracking-tight">${reward.name}</h3>
      <p class="mt-1.5 text-sm text-white/45 leading-relaxed flex-1">${reward.desc}</p>
      <div class="mt-5 flex items-center justify-between gap-3">
        <span class="font-black tabular-nums text-lg">${fmt(reward.pts)} <span class="text-xs font-bold text-violet-300">PTS</span></span>
      </div>
      <button class="btn ${can ? 'btn-primary' : 'btn-ghost'} w-full mt-4 py-3 text-sm"
              data-action="redeem" data-id="${reward.id}" ${can ? '' : 'disabled'}>
        ${can ? '🎟️ Wygeneruj kod' : 'Zablokowane'}
      </button>
      ${can ? '' : `<p class="mt-2.5 text-[11px] text-amber-300/90 font-medium text-center">Brakuje ${fmt(missing)} ${ptsWord(missing)}</p>`}
    </div>
  </article>`;
}

export function renderHistory() {
  const el = document.getElementById('view-history');
  const items = store.state.history || [];
  el.innerHTML = `
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">Historia</h1>
        <p class="mt-2 text-white/50 text-sm sm:text-base">Wszystkie wpisy transakcyjne z bazy Firestore.</p>
      </div>
      <div class="glass rounded-2xl px-5 py-3">
        <p class="text-[10px] font-bold uppercase tracking-widest text-white/40">Wpisów</p>
        <p class="text-2xl font-black tabular-nums">${fmt(items.length)}</p>
      </div>
    </header>
    <div class="glass rounded-3xl p-2 sm:p-3">
      ${items.length ? `<div class="space-y-1">${items.map(historyRow).join('')}</div>` : `<p class="text-sm text-white/35 py-16 text-center">Brak wpisów.</p>`}
    </div>
  </div>`;
}

function historyRow(item) {
  const positive = item.delta > 0;
  const negative = item.delta < 0;
  const colorCls = positive ? 'text-emerald-400' : negative ? 'text-rose-400' : 'text-white/35';
  const sign = positive ? '+' : '';
  const deltaText = item.delta === 0 ? '0 PTS' : `${sign}${fmt(item.delta)} PTS`;
  const icons = { bonus:'🎁', task:'✅', lootbox:'📦', win:'💎', freebox:'🎀', adbox:'📺', redeem:'🎟️', other:'•' };
  const icon = icons[item.kind] || icons.other;

  const codeButton = item.code ? `
    <button class="btn btn-ghost px-2.5 py-1 text-[11px] text-violet-300 hover:text-white"
            data-action="copy-code" data-code="${item.code}">
      📋 ${item.code}
    </button>
  ` : '';

  return `
  <div class="flex items-center gap-3.5 px-3 sm:px-4 py-3.5 rounded-2xl hover:bg-white/[.04] transition-colors">
    <div class="w-10 h-10 shrink-0 rounded-xl grid place-items-center text-lg bg-white/5 border border-white/10">${icon}</div>
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <p class="text-sm font-medium truncate">${item.label}</p>
        ${codeButton}
      </div>
      <p class="text-[11px] text-white/35 mt-0.5">${timeAgo(item.ts)}</p>
    </div>
    <span class="shrink-0 text-sm font-extrabold tabular-nums ${colorCls}">${deltaText}</span>
  </div>`;
}

export function renderProfile() {
  const el = document.getElementById('view-profile');
  const username = store.state.user?.username || 'Gracz';
  const initial = (username[0] || 'U').toUpperCase();
  const email = store.state.user?.email || store.currentUser?.email || '—';
  const createdAt = store.state.user?.createdAt || Date.now();
  const usedCodes = store.state.usedPromoCodes || [];

  el.innerHTML = `
  <div class="space-y-6">
    <header>
      <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">Profil</h1>
      <p class="mt-2 text-white/50 text-sm sm:text-base">Konto połączone z Firebase Authentication.</p>
    </header>

    <section class="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden">
      <div class="absolute -top-28 -right-16 w-72 h-72 rounded-full bg-violet-600/20 blur-3xl pointer-events-none"></div>
      <div class="relative flex flex-col sm:flex-row sm:items-center gap-5">
        <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-400 grid place-items-center text-3xl font-black shadow-glow shrink-0">${initial}</div>
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-extrabold tracking-tight truncate">${username}</h2>
          <p class="text-sm text-white/45 truncate mt-0.5">${email}</p>
          <p class="text-xs text-white/30 mt-2">ID Konta: <span class="font-mono text-white/40">${store.currentUser.uid}</span></p>
        </div>
        <div class="glass rounded-2xl px-5 py-3.5 text-center shrink-0">
          <p class="text-[10px] font-bold uppercase tracking-widest text-white/40">Punkty</p>
          <p class="text-2xl font-black tabular-nums">${fmt(store.state.points)}</p>
        </div>
      </div>
    </section>

    <!-- FORMULARZ KODU PROMOCYJNEGO -->
    <section class="glass rounded-3xl p-6 sm:p-7 relative overflow-hidden">
      <div class="absolute -bottom-24 -right-12 w-64 h-64 rounded-full bg-violet-600/15 blur-3xl pointer-events-none"></div>
      <div class="relative">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🎟️</span>
          <h3 class="font-bold text-lg tracking-tight">Zrealizuj kod promocyjny</h3>
        </div>
        <p class="text-xs text-white/50 mb-5 leading-relaxed">
          Wpisz kod promocyjny, aby natychmiast otrzymać darmowe punkty (np. kod <span class="text-violet-300 font-bold bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-400/25">START</span> daje +150 PTS).
        </p>

        <form id="promo-form" class="flex flex-col sm:flex-row gap-3">
          <input id="promo-input"
                 class="field uppercase tracking-wider font-bold placeholder:normal-case placeholder:font-normal flex-1"
                 placeholder="Wpisz kod, np. START"
                 maxlength="20"
                 required
                 autocomplete="off">
          <button id="promo-submit-btn" type="submit" class="btn btn-primary px-7 py-3.5 text-sm shrink-0">
            Aktywuj kod ⚡
          </button>
        </form>

        ${usedCodes.length ? `
          <div class="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-2">
            <span class="text-[11px] font-semibold text-white/40">Wykorzystane kody:</span>
            ${usedCodes.map(c => `<span class="text-[11px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-white/70">${c}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      ${profileStat('Wykonane zadania', store.state.stats?.tasks || 0,     '✅')}
      ${profileStat('Otwarte lootboxy', store.state.stats?.lootboxes || 0, '📦')}
      ${profileStat('Wypłacone kody',   store.state.stats?.rewards || 0,   '🎟️')}
    </section>

    <section class="glass rounded-3xl p-6 sm:p-7">
      <h3 class="font-bold tracking-tight mb-4">Informacje o koncie</h3>
      <dl class="space-y-1">
        ${dataRow('Nazwa użytkownika', username)}
        ${dataRow('E-mail', email)}
        ${dataRow('Data dołączenia', fullDate(createdAt))}
      </dl>
      <div class="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-3">
        <button class="btn btn-danger px-5 py-3 text-sm" data-action="logout">Wyloguj się</button>
      </div>
    </section>
  </div>`;
}

function profileStat(label, value, icon) {
  return `
  <div class="glass card rounded-2xl p-6 flex items-center gap-4">
    <div class="w-12 h-12 rounded-2xl grid place-items-center text-2xl bg-white/5 border border-white/10">${icon}</div>
    <div>
      <p class="text-2xl font-black tabular-nums">${fmt(value)}</p>
      <p class="text-[11px] font-bold uppercase tracking-widest text-white/40 mt-0.5">${label}</p>
    </div>
  </div>`;
}

function dataRow(label, value) {
  return `
  <div class="flex items-center justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
    <dt class="text-sm text-white/40">${label}</dt>
    <dd class="text-sm font-medium truncate">${value}</dd>
  </div>`;
}