import { store, freeBoxReady, freeBoxRemaining, adBoxReady, adBoxRemaining, subscribeUserData } from "./state.js";
import { auth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, doc, setDoc, db } from "./firebase.js";
import { renderNav, renderLootboxes } from "./views.js";
import { toast, closeModal, showAdPlayerAndClaim, formatDuration } from "./ui.js";
import {
  startTask,
  claimTask,
  openLootbox,
  claimFreeBox,
  redeemReward,
  redeemPromoCode,
  logout
} from "./actions.js";

let authMode = 'register';

export function setView(id) {
  store.currentView = id;
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + id));
  renderNav();
  document.getElementById('mobile-menu').classList.add('hidden');
  document.getElementById('profile-menu').classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Obsługa logowania / rejestracji
function setAuthMode(mode) {
  authMode = mode;
  const title = document.getElementById('auth-title');
  const desc = document.getElementById('auth-desc');
  const submitBtn = document.getElementById('auth-submit-btn');
  const usernameGroup = document.getElementById('auth-group-username');
  const tabReg = document.getElementById('auth-tab-register');
  const tabLog = document.getElementById('auth-tab-login');
  document.getElementById('auth-error').classList.add('hidden');

  if (mode === 'register') {
    tabReg.className = 'flex-1 py-2 rounded-lg bg-violet-600 text-white transition';
    tabLog.className = 'flex-1 py-2 rounded-lg text-white/50 hover:text-white transition';
    title.innerHTML = 'Dołącz do programu i zbieraj punkty';
    desc.innerHTML = 'Załóż konto i zgarnij <span class="text-violet-300 font-semibold">+50 PTS</span> bonusu startowego w Firebase.';
    submitBtn.textContent = '🎁 Zarejestruj się i odbierz +50 PTS';
    usernameGroup.classList.remove('hidden');
    document.getElementById('auth-username').required = true;
  } else {
    tabLog.className = 'flex-1 py-2 rounded-lg bg-violet-600 text-white transition';
    tabReg.className = 'flex-1 py-2 rounded-lg text-white/50 hover:text-white transition';
    title.innerHTML = 'Witaj z powrotem';
    desc.innerHTML = 'Zaloguj się na swoje konto, aby pobrać punkty i nagrody.';
    submitBtn.textContent = '🚀 Zaloguj się';
    usernameGroup.classList.add('hidden');
    document.getElementById('auth-username').required = false;
  }
}

document.getElementById('auth-tab-register').addEventListener('click', () => setAuthMode('register'));
document.getElementById('auth-tab-login').addEventListener('click', () => setAuthMode('login'));

document.getElementById('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const username = document.getElementById('auth-username').value.trim() || 'Gracz';
  const errorBox = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit-btn');

  errorBox.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Przetwarzanie…';

  try {
    if (authMode === 'register') {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username });

      await setDoc(doc(db, 'users', cred.user.uid), {
        user: { username, email, createdAt: Date.now() },
        points: 50,
        stats: { tasks: 0, lootboxes: 0, rewards: 0 },
        tasks: {},
        usedPromoCodes: [],
        history: [{
          id: 'h_' + Date.now(),
          delta: 50,
          label: 'Bonus za rejestrację',
          kind: 'bonus',
          ts: Date.now()
        }],
        freeBoxAt: 0,
        adBoxAt: 0
      });
      toast('Konto utworzone! +50 PTS na start 🎁', 'success');
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      toast('Zalogowano pomyślnie!', 'success');
    }
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = authMode === 'register' ? '🎁 Zarejestruj się i odbierz +50 PTS' : '🚀 Zaloguj się';
  }
});

// Nasłuch stanu sesji Firebase Auth
onAuthStateChanged(auth, (user) => {
  if (user) {
    store.currentUser = user;
    document.getElementById('auth-gate').classList.add('hidden');
    subscribeUserData(user.uid);
  } else {
    store.currentUser = null;
    store.state = null;
    if (store.unsubscribeFirestore) store.unsubscribeFirestore();
    document.getElementById('auth-gate').classList.remove('hidden');
  }
});

// Obsługa formularza kodu promocyjnego
document.addEventListener('submit', async (e) => {
  if (e.target && e.target.id === 'promo-form') {
    e.preventDefault();
    const input = document.getElementById('promo-input');
    const submitBtn = document.getElementById('promo-submit-btn');
    const code = (input.value || '').trim().toUpperCase();
    if (!code) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Weryfikacja…';

    const success = await redeemPromoCode(code);
    if (success) input.value = '';

    submitBtn.disabled = false;
    submitBtn.textContent = 'Aktywuj kod ⚡';
  }
});

// Centralna delegacja zdarzeń kliknięcia
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-action]');
  if (!trigger) return;
  const action = trigger.dataset.action;

  switch (action) {
    case 'nav': setView(trigger.dataset.nav); break;
    case 'task-start': startTask(trigger.dataset.id); break;
    case 'task-claim': claimTask(trigger.dataset.id); break;
    case 'open-lootbox': openLootbox(trigger.dataset.id); break;
    case 'claim-freebox': claimFreeBox(); break;
    case 'claim-adbox': showAdPlayerAndClaim(); break;
    case 'redeem': redeemReward(trigger.dataset.id); break;
    case 'copy-code': {
      const code = trigger.dataset.code;
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          toast(`Skopiowano kod: ${code}`, 'success');
        });
      }
      break;
    }
    case 'close-modal': closeModal(); break;
    case 'modal-backdrop': if (!e.target.closest('.modal-card')) closeModal(); break;
    case 'toggle-profile': {
      e.stopPropagation();
      document.getElementById('profile-menu').classList.toggle('hidden');
      break;
    }
    case 'toggle-mobile': document.getElementById('mobile-menu').classList.toggle('hidden'); break;
    case 'logout': logout(); break;
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#profile-wrap')) {
    document.getElementById('profile-menu')?.classList.add('hidden');
  }
});

// Odliczanie timerów (Free Box & Ad Box)
setInterval(() => {
  if (!store.state || store.currentView !== 'lootboxes') return;

  const fbCountdown = document.getElementById('freebox-countdown');
  if (fbCountdown) {
    if (freeBoxReady()) renderLootboxes();
    else fbCountdown.textContent = formatDuration(freeBoxRemaining());
  }

  const adCountdown = document.getElementById('adbox-countdown');
  if (adCountdown) {
    if (adBoxReady()) renderLootboxes();
    else adCountdown.textContent = formatDuration(adBoxRemaining());
  }
}, 1000);

document.getElementById('footer-year').textContent = new Date().getFullYear();