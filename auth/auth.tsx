"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

// -----------------------------
// Firebase Init (safe for Next.js)
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCRjiZum9L0UGLxDap4duEN3VIPj4PAmvo",
  authDomain: "launrdy-bubbles.firebaseapp.com",
  projectId: "launrdy-bubbles",
  storageBucket: "launrdy-bubbles.firebasestorage.app",
  messagingSenderId: "625079841514",
  appId: "1:625079841514:web:472b2721f4acb836111d93",
  measurementId: "G-QT16Z65J1E",
};

function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function AccountInfoPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [status, setStatus] = useState("Loading account...");
  const [error, setError] = useState("");

  // AUTH GUARD + LOAD PROFILE
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = "/login";
        return;
      }

      setUser(u);
      const userId = u.uid;
      const userEmail = u.email || "";
      setEmail(userEmail);

      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data() as { name?: string; phone?: string };
        setName(data.name || "");
        setPhone(data.phone || "");
        setStatus("Profile loaded.");
      } else {
        await setDoc(ref, {
          email: userEmail,
          name: "",
          phone: "",
          createdAt: Date.now(),
        });
        setStatus("Profile created.");
      }
    });

    return () => unsub();
  }, []);

  async function handleSave() {
    if (!user) return;

    setStatus("Saving...");
    setError("");

    try {
      const ref = doc(db, "users", user.uid);

      await updateDoc(ref, {
        name: name || "",
        phone: phone || "",
      });

      await updateProfile(user, {
        displayName: name || null,
      });

      setStatus("Account info saved!");
    } catch (err: any) {
      console.error(err);
      setStatus("Error saving account info.");
      setError(err.message || "Unknown error");
    }
  }

  return (
    <div className="account-page-root">
      <style>{`
        .account-page-root {
          margin: 0;
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg,#d96e30,#f4c542);
          min-height: 100vh;
          padding: 20px;
          color: #5a3e2b;
        }
        h1 { text-align: center; margin-bottom: 10px; }
        .card {
          background:#fff4d9;
          padding:20px;
          border-radius:16px;
          box-shadow:0 6px 16px rgba(0,0,0,0.25);
          max-width:520px;
          margin:0 auto 20px;
        }
        .label { font-weight:bold; display:block; margin-bottom:6px; }
        .input {
          width:100%;
          padding:12px;
          margin-bottom:14px;
          border-radius:10px;
          border:2px solid #d96e30;
          background:white;
          box-sizing:border-box;
        }
        .btn {
          display:block;
          width:100%;
          padding:14px;
          background:#d96e30;
          color:white;
          text-align:center;
          border-radius:10px;
          font-weight:bold;
          text-decoration:none;
          margin-top:12px;
          border:none;
          cursor:pointer;
          box-sizing:border-box;
        }
        .secondary {
          background:#f4c542;
          color:#5a3e2b;
          border:2px solid #d96e30;
        }
        #statusText { font-size:0.85rem; margin-top:8px; min-height:1em; }
        #errorText { font-size:0.8rem; margin-top:4px; color:#b83a2e; white-space:pre-wrap; }
      `}</style>

      <h1>Account Info</h1>

      <div className="card">
        <label className="label">Email</label>
        <input className="input" value={email} disabled />

        <label className="label">Name</label>
        <input
          className="input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="label">Phone</label>
        <input
          className="input"
          placeholder="Your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button className="btn" onClick={handleSave}>
          Save Account Info
        </button>

        <button
          className="btn secondary"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          Back to Dashboard
        </button>

        <div id="statusText">{status}</div>
        <div id="errorText">{error}</div>
      </div>
    </div>
  );
}
