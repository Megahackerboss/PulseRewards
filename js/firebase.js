import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";

import { firebaseConfig } from "./config.js";

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  setDoc,
  onSnapshot
};

export const fnOpenLootbox     = httpsCallable(functions, 'openLootbox');
export const fnClaimFreeBox    = httpsCallable(functions, 'claimFreeBox');
export const fnClaimAdLootbox  = httpsCallable(functions, 'claimAdLootbox');
export const fnClaimTask       = httpsCallable(functions, 'claimTask');
export const fnRedeemReward    = httpsCallable(functions, 'redeemReward');
export const fnRedeemPromoCode = httpsCallable(functions, 'redeemPromoCode');