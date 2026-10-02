import { db, doc, onSnapshot } from "./firebase.js";
import { renderAll } from "./views.js";
import { toast } from "./ui.js";
import { FREE_BOX, AD_BOX } from "./config.js";

export const store = {
  currentUser: null,
  state: null,
  currentView: 'dashboard',
  isOpeningBox: false,
  unsubscribeFirestore: null
};

export function subscribeUserData(uid) {
  if (store.unsubscribeFirestore) store.unsubscribeFirestore();
  store.unsubscribeFirestore = onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) {
      store.state = snap.data();
      renderAll();
    }
  }, (err) => {
    console.error(err);
    toast("Brak uprawnień lub błąd Firestore", "error");
  });
}

export function freeBoxReady() {
  if (!store.state) return false;
  return Date.now() - (store.state.freeBoxAt || 0) >= FREE_BOX.cooldown;
}

export function freeBoxRemaining() {
  if (!store.state) return FREE_BOX.cooldown;
  return Math.max(0, FREE_BOX.cooldown - (Date.now() - (store.state.freeBoxAt || 0)));
}

export function adBoxReady() {
  if (!store.state) return false;
  return Date.now() - (store.state.adBoxAt || 0) >= AD_BOX.cooldown;
}

export function adBoxRemaining() {
  if (!store.state) return AD_BOX.cooldown;
  return Math.max(0, AD_BOX.cooldown - (Date.now() - (store.state.adBoxAt || 0)));
}