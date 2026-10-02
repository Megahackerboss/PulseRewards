import { store, freeBoxReady, freeBoxRemaining } from "./state.js";
import { TASKS, REWARDS, LOOTBOXES, FREE_BOX } from "./config.js";
import {
  fnClaimTask,
  fnOpenLootbox,
  fnClaimFreeBox,
  fnRedeemReward,
  fnRedeemPromoCode,
  signOut,
  auth
} from "./firebase.js";
import {
  toast,
  confetti,
  playOpenAnimation,
  showResultModal,
  showCodeModal,
  fmt,
  ptsWord,
  formatDuration
} from "./ui.js";
import { renderAll, renderLootboxes } from "./views.js";

export async function startTask(id) {
  const task = TASKS.find(t => t.id === id);
  if (!task || !store.state || store.state.tasks[id] === 'done') return;
  window.open(task.url, '_blank', 'noopener,noreferrer');
  toast('Link otwarty — wróć i kliknij "Odbierz punkty"!', 'info');
}

export async function claimTask(id) {
  try {
    toast('Weryfikacja na serwerze…', 'info');
    const result = await fnClaimTask({ taskId: id });
    toast(`Zadanie ukończone! +${result.data.pts} PTS`, 'success');
  } catch (err) {
    toast(err.message || 'Błąd odbierania zadania', 'error');
  }
}

export async function openLootbox(boxId) {
  if (store.isOpeningBox || !store.state) return;
  const box = LOOTBOXES.find(b => b.id === boxId);
  if (!box) return;

  if (store.state.points < box.price) {
    toast(`Za mało punktów! Brakuje Ci ${fmt(box.price - store.state.points)} ${ptsWord(box.price - store.state.points)}.`, 'error');
    return;
  }

  store.isOpeningBox = true;
  renderLootboxes();

  playOpenAnimation(box.emoji, async () => {
    try {
      const res = await fnOpenLootbox({ boxId });
      const win = res.data.win;
      store.isOpeningBox = false;
      renderAll();

      if (win > 0) {
        if (win >= 1000) confetti(240);
        else if (win >= 200) confetti(140);
        showResultModal({
          icon: win >= 10000 ? '👑' : win >= 5000 ? '💎' : win >= 1000 ? '🏆' : win >= 200 ? '💠' : '🎉',
          title: 'Gratulacje!',
          message: `Z <span class="text-white font-semibold">${box.name}</span> otrzymujesz:<br>
                    <span class="text-3xl font-black bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">+${fmt(win)} PTS</span>`,
          button: 'Super!',
        });
      } else {
        showResultModal({
          icon: '😕',
          title: 'Tym razem pusto',
          message: 'Szczęście czeka w kolejnej próbie!',
          button: 'Rozumiem',
        });
      }
    } catch (err) {
      store.isOpeningBox = false;
      renderAll();
      toast(err.message || 'Błąd podczas otwierania skrzynki', 'error');
    }
  });
}

export async function claimFreeBox() {
  if (store.isOpeningBox) return;
  if (!freeBoxReady()) {
    toast(`Free Box będzie dostępna za ${formatDuration(freeBoxRemaining())}`, 'info');
    return;
  }

  store.isOpeningBox = true;
  renderLootboxes();

  playOpenAnimation(FREE_BOX.emoji, async () => {
    try {
      const res = await fnClaimFreeBox({});
      const win = res.data.win;
      store.isOpeningBox = false;
      renderAll();

      if (win > 0) {
        confetti(90);
        showResultModal({
          icon: '🎉',
          title: 'Gratulacje!',
          message: `Otrzymujesz:<br><span class="text-3xl font-black bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">+${fmt(win)} PTS</span>`,
          button: 'Super!',
        });
      } else {
        showResultModal({
          icon: '😕',
          title: 'Free Box otwarta',
          message: 'Tym razem nic nie wypadło. Następna skrzynka za 24h.',
          button: 'OK',
        });
      }
    } catch (err) {
      store.isOpeningBox = false;
      renderAll();
      toast(err.message || 'Błąd Free Box', 'error');
    }
  });
}

export async function redeemReward(rewardId) {
  const reward = REWARDS.find(r => r.id === rewardId);
  if (!reward || !store.state) return;

  if (store.state.points < reward.pts) {
    toast(`Potrzebujesz jeszcze ${fmt(reward.pts - store.state.points)} ${ptsWord(reward.pts - store.state.points)}.`, 'error');
    return;
  }

  if (!confirm(`Czy na pewno chcesz wymienić ${fmt(reward.pts)} PTS na nagrodę "${reward.name}"? Otrzymasz unikalny 16-cyfrowy kod upominkowy.`)) {
    return;
  }

  try {
    toast('Generowanie kodu w chmurze…', 'info');
    const res = await fnRedeemReward({ rewardId });
    const { code, rewardName } = res.data;
    confetti(220);
    showCodeModal(code, rewardName);
  } catch (err) {
    toast(err.message || 'Błąd podczas odbierania nagrody', 'error');
  }
}

export async function redeemPromoCode(code) {
  try {
    const res = await fnRedeemPromoCode({ code });
    confetti(140);
    toast(`Kod ${res.data.code} aktywny! Otrzymujesz +${res.data.pts} PTS 🎉`, 'success');
    return true;
  } catch (err) {
    toast(err.message || 'Nie udało się aktywować kodu', 'error');
    return false;
  }
}

export function logout() {
  signOut(auth).then(() => toast('Wylogowano', 'info'));
}