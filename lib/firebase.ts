// /lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCRjiZum9L0UGLxDap4duEN3VIPj4PAmvo",
  authDomain: "launrdy-bubbles.firebaseapp.com",
  projectId: "launrdy-bubbles",
  storageBucket: "launrdy-bubbles.firebasestorage.app",
  messagingSenderId: "625079841514",
  appId: "1:625079841514:web:472b2721f4acb836111d93",
  measurementId: "G-QT16Z65J1E",
};

// Prevent re‑initializing during hot reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
