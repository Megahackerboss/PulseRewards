import { FUNNY_ADS, AD_BOX } from "./config.js";
import { store, adBoxReady, adBoxRemaining } from "./state.js";
import { fnClaimAdLootbox } from "./firebase.js";
import { renderAll, renderLootboxes } from "./views.js";

const nf = new Intl.NumberFormat('pl-PL');
export const fmt = n => nf.format(Math.round(n || 0));

export function ptsWord(n) {
  if (n === 1) return 'punkt';
  const d = n % 10, h = n % 100;
  if (d >= 2 && d <= 4 && !(h >= 12 && h <= 14)) return 'punkty';
  return 'punktów';
}

export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return 'przed chwilą';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m} min temu`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} godz. temu`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'wczoraj';
  if (d < 30)  return `${d} dni temu`;
  return new Date(ts).toLocaleDateString('pl-PL');
}

export function fullDate(ts) {
  return new Date(ts).toLocaleDateString('pl-PL', { day:'numeric', month:'long', year:'numeric' });
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function toast(message, type = 'info') {
  const wrap = document.getElementById('toasts');
  const el = document.createElement('div');
  const accents = {
    success: 'border-emerald-400/30 text-emerald-200',
    error:   'border-rose-400/30 text-rose-200',
    info:    'border-violet-400/30 text-violet-100',
  };
  const icons = { success:'✅', error:'⚠️', info:'💡' };
  el.className = `toast glass rounded-2xl px-4 py-3 text-sm font-medium
                  flex items-start gap-2.5 shadow-2xl border ${accents[type] || accents.info}`;
  el.innerHTML = `<span class="shrink-0">${icons[type] || '💡'}</span><span>${message}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .35s, transform .35s';
    el.style.opacity = '0'; el.style.transform = 'translateY(-12px)';
    setTimeout(() => el.remove(), 380);
  }, 3200);
}

// Konfetti
const confettiCanvas = document.getElementById('confetti');
const cctx = confettiCanvas.getContext('2d');
let particles = [], confettiRAF = null;
function resizeCanvas() { confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
addEventListener('resize', resizeCanvas); resizeCanvas();

export function confetti(count = 130) {
  const colors = ['#7c5cff', '#22d3ee', '#a855f7', '#f472b6', '#facc15', '#34d399', '#fbbf24'];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * innerWidth,
      y: -20 - Math.random() * innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2 + Math.random() * 3.4,
      size: 4 + Math.random() * 7,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.22,
      life: 1,
    });
  }
  if (!confettiRAF) confettiRAF = requestAnimationFrame(confettiTick);
}

function confettiTick() {
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.055;
    p.rot += p.vr; p.life -= 0.004;
    cctx.save();
    cctx.translate(p.x, p.y); cctx.rotate(p.rot);
    cctx.globalAlpha = Math.max(0, p.life);
    cctx.fillStyle = p.color;
    cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
    cctx.restore();
  });
  particles = particles.filter(p => p.life > 0 && p.y < innerHeight + 60);
  if (particles.length) confettiRAF = requestAnimationFrame(confettiTick);
  else { cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); confettiRAF = null; }
}

export function playOpenAnimation(emoji, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[93] grid place-items-center bg-black/80 backdrop-blur-md modal-backdrop';
  overlay.innerHTML = `
    <div class="text-center px-6">
      <div class="box-opening text-[7rem] sm:text-[9rem] leading-none drop-shadow-[0_0_50px_rgba(124,92,255,.95)]">${emoji}</div>
      <p class="mt-10 text-white/50 tracking-[.35em] text-[11px] uppercase animate-pulse">
        Losowanie na serwerze…
      </p>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.remove(); callback(); }, 1380);
}

export function showResultModal({ icon = '🎉', title = '', message = '', button = 'Super!' }) {
  document.getElementById('modal-root').innerHTML = `
    <div class="fixed inset-0 z-[94] grid place-items-center p-4 bg-black/75 backdrop-blur-md modal-backdrop"
         data-action="modal-backdrop">
      <div class="modal-card glass rounded-3xl max-w-sm w-full p-8 text-center relative overflow-hidden">
        <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-violet-600/35 blur-3xl"></div>
        <div class="relative">
          <div class="reveal text-6xl mb-5">${icon}</div>
          <h3 class="text-2xl font-extrabold tracking-tight">${title}</h3>
          <p class="mt-3 text-white/60 leading-relaxed">${message}</p>
          <button class="btn btn-primary w-full mt-8 py-3.5" data-action="close-modal">${button}</button>
        </div>
      </div>
    </div>`;
}

export function showCodeModal(code, rewardName) {
  document.getElementById('modal-root').innerHTML = `
    <div class="fixed inset-0 z-[94] grid place-items-center p-4 bg-black/75 backdrop-blur-md modal-backdrop"
         data-action="modal-backdrop">
      <div class="modal-card glass rounded-3xl max-w-md w-full p-8 text-center relative overflow-hidden">
        <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-violet-600/35 blur-3xl"></div>
        <div class="relative">
          <div class="reveal text-6xl mb-4">🎁</div>
          <h3 class="text-2xl font-black tracking-tight">Oto Twój kod!</h3>
          <p class="mt-2 text-sm text-white/60">
            Wymieniłeś punkty na nagrodę: <br>
            <span class="text-white font-bold">${rewardName}</span>
          </p>
          <div class="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
            <span class="code-badge text-lg sm:text-xl font-bold select-all tracking-wider">${code}</span>
            <button class="btn btn-primary px-3 py-2 text-xs" data-action="copy-code" data-code="${code}">
              📋 Kopiuj
            </button>
          </div>
          <p class="mt-3 text-[11px] text-white/40">
            Kod został trwale zapisany w bazie danych oraz w Twojej historii transakcji.
          </p>
          <button class="btn btn-ghost w-full mt-6 py-3.5 text-sm" data-action="close-modal">
            Zamknij
          </button>
        </div>
      </div>
    </div>`;
}

export function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

// Inicjalizacja YouTube Iframe API
if (!window.YT) {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode.insertBefore(tag, firstScript);
}

// Rewarded Ad Player (YouTube)
export function showAdPlayerAndClaim() {
  if (store.isOpeningBox) {
    toast('Trwa już otwieranie innej skrzynki…', 'info');
    return;
  }
  if (!store.currentUser) {
    toast('Zaloguj się, aby obejrzeć reklamę!', 'error');
    return;
  }
  if (!adBoxReady()) {
    const rem = adBoxRemaining();
    toast(`Kolejna reklama będzie dostępna za ${formatDuration(rem)}.`, 'info');
    return;
  }

  const ad = FUNNY_ADS[Math.floor(Math.random() * FUNNY_ADS.length)];
  let remaining = 15, totalTime = 15, finished = false, ytPlayer = null;

  const overlay = document.createElement('div');
  overlay.id = 'ad-modal-overlay';
  overlay.className = 'fixed inset-0 z-[120] grid place-items-center bg-black/95 backdrop-blur-2xl p-4 modal-backdrop';

  overlay.innerHTML = `
    <div class="glass rounded-3xl max-w-lg w-full overflow-hidden border border-amber-400/30 shadow-2xl relative">
      <div class="px-5 py-3.5 bg-black/80 border-b border-white/10 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          <span class="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded border border-amber-400/30">
            ${ad.sponsor} • Reklama
          </span>
        </div>
        <div class="flex items-center gap-2.5">
          <button id="ad-yt-audio" class="text-xs text-white/80 hover:text-white bg-white/10 px-3 py-1 rounded-lg transition font-medium">
            🔊 Wycisz
          </button>
          <span id="ad-sec-badge" class="text-xs font-mono font-black text-amber-300 bg-white/10 px-2.5 py-1 rounded-lg">15s</span>
        </div>
      </div>

      <div class="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        <div id="yt-player-slot" class="w-full h-full pointer-events-none"></div>
        <div id="ad-loading-spinner" class="absolute inset-0 grid place-items-center bg-black text-xs text-white/60">
          <span class="animate-pulse">▶ Ładowanie spotu reklamowego…</span>
        </div>
      </div>

      <div class="p-5 bg-black/70 border-t border-white/10">
        <div class="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-3">
          <div id="ad-fill-bar" class="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 transition-all duration-300" style="width: 0%"></div>
        </div>
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-bold text-white truncate">${ad.title}</p>
            <p class="text-[11px] text-white/50 truncate">${ad.desc}</p>
          </div>
          <button class="btn btn-gold text-xs px-4 py-2 shrink-0 pointer-events-none opacity-90 shadow-gold">
            Zainstaluj
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const fillBar = overlay.querySelector('#ad-fill-bar');
  const secBadge = overlay.querySelector('#ad-sec-badge');
  const audioBtn = overlay.querySelector('#ad-yt-audio');
  const spinner = overlay.querySelector('#ad-loading-spinner');

  const completeReward = async () => {
    if (finished) return;
    finished = true;
    if (ytPlayer && ytPlayer.destroy) {
      try { ytPlayer.destroy(); } catch(e){}
    }
    overlay.remove();

    store.isOpeningBox = true;
    renderLootboxes();

    playOpenAnimation(AD_BOX.emoji, async () => {
      try {
        const res = await fnClaimAdLootbox({});
        const win = res.data.win;
        store.isOpeningBox = false;
        renderAll();

        if (win > 0) {
          confetti(win >= 40 ? 180 : 100);
          showResultModal({
            icon: win >= 100 ? '💎' : '📺',
            title: 'Nagroda za reklamę odebrana!',
            message: `Zabawna reklama zaliczona! Ze skrzynki wypada:<br><span class="text-3xl font-black bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">+${fmt(win)} PTS</span>`,
            button: 'Świetnie!',
          });
        } else {
          showResultModal({
            icon: '😕',
            title: 'Tym razem bez wygranej',
            message: 'Kolejny spot reklamowy i skrzynka dostępne za 10 minut!',
            button: 'OK',
          });
        }
      } catch (err) {
        store.isOpeningBox = false;
        renderAll();
        toast(err.message || 'Błąd odbierania nagrody za reklamę', 'error');
      }
    });
  };

  let timerInterval = null;
  const startTimer = () => {
    if (timerInterval) return;
    if (spinner) spinner.remove();

    timerInterval = setInterval(() => {
      remaining--;
      const progress = ((totalTime - remaining) / totalTime) * 100;
      fillBar.style.width = progress + '%';
      secBadge.textContent = remaining + 's';

      if (remaining <= 0) {
        clearInterval(timerInterval);
        completeReward();
      }
    }, 1000);
  };

  const createPlayer = () => {
    ytPlayer = new YT.Player('yt-player-slot', {
      videoId: ad.videoId,
      playerVars: {
        autoplay: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, playsinline: 1, mute: 0
      },
      events: {
        onReady: (event) => { event.target.playVideo(); startTimer(); },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) startTimer();
          if (event.data === YT.PlayerState.ENDED) {
            if (timerInterval) clearInterval(timerInterval);
            completeReward();
          }
        },
        onError: () => startTimer()
      }
    });
  };

  if (window.YT && window.YT.Player) createPlayer();
  else {
    window.onYouTubeIframeAPIReady = createPlayer;
    setTimeout(startTimer, 1500);
  }

  audioBtn.addEventListener('click', () => {
    if (!ytPlayer || !ytPlayer.isMuted) return;
    if (ytPlayer.isMuted()) {
      ytPlayer.unMute();
      audioBtn.textContent = '🔊 Wycisz';
    } else {
      ytPlayer.mute();
      audioBtn.textContent = '🔇 Włącz dźwięk';
    }
  });
}