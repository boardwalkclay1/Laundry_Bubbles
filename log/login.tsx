"use client";

import { useState, useEffect } from "react";
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// -----------------------------
// Firebase Init
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCRjiZum9L0UGLxDap4duEN3VIPj4PAmvo",
  authDomain: "launrdy-bubbles.firebaseapp.com",
  projectId: "launrdy-bubbles",
  storageBucket: "launrdy-bubbles.firebasestorage.app",
  messagingSenderId: "625079841514",
  appId: "1:625079841514:web:472b2721f4acb836111d93",
  measurementId: "G-QT16Z65J1E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // -----------------------------
  // Auto‑redirect if logged in
  // -----------------------------
  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      const role = snap.data().role;

      if (role === "washer") window.location.href = "/washer-dashboard.html";
      else if (role === "admin") window.location.href = "/admin-dashboard.html";
      else window.location.href = "/client-dashboard.html";
    });
  }, []);

  // -----------------------------
  // Login Handler
  // -----------------------------
  async function handleLogin() {
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const ref = doc(db, "users", cred.user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setError("Account profile not found.");
        return;
      }

      const role = snap.data().role;

      if (role === "washer") window.location.href = "/washer-dashboard.html";
      else if (role === "admin") window.location.href = "/admin-dashboard.html";
      else window.location.href = "/client-dashboard.html";

    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="page-root">
      <style>{`
        :root {
          --primary: #4da6ff;
          --accent: #7a5cff;
          --text: #f9fbff;
          --muted: #9aa3c7;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, sans-serif; }

        .page-root {
          min-height: 100vh;
          background:
            radial-gradient(circle at 20% 20%, rgba(77,166,255,0.18), transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(122,92,255,0.18), transparent 60%),
            #030715;
          color: var(--text);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          position: relative;
        }

        .grid-overlay {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }

        .card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          padding: 26px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.5);
          position: relative;
          z-index: 2;
        }

        h1 {
          font-size: 24px;
          margin-bottom: 6px;
          text-shadow: 0 0 12px rgba(77,166,255,0.4);
        }

        .subtitle {
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 20px;
        }

        label {
          display: block;
          font-size: 13px;
          margin-bottom: 4px;
          color: var(--muted);
        }

        input {
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: var(--text);
          margin-bottom: 14px;
          font-size: 14px;
        }

        input:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 8px rgba(77,166,255,0.4);
        }

        .btn {
          width: 100%;
          padding: 12px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          margin-top: 10px;
          transition: 0.15s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: #fff;
          box-shadow: 0 12px 28px rgba(77,166,255,0.45);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(77,166,255,0.6);
        }

        .link {
          color: var(--primary);
          font-size: 13px;
          cursor: pointer;
          text-decoration: none;
        }

        .link:hover { text-decoration: underline; }

        .footer {
          text-align: center;
          margin-top: 14px;
          font-size: 13px;
          color: var(--muted);
        }

        .error {
          color: #ff4d6a;
          font-size: 13px;
          margin-bottom: 10px;
          min-height: 16px;
        }
      `}</style>

      <div className="grid-overlay"></div>

      <div className="card">
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to continue</p>

        <div className="error">{error}</div>

        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn btn-primary" onClick={handleLogin}>
          Sign In
        </button>

        <p className="footer">
          Don’t have an account?{" "}
          <a className="link" href="/signup.html">Create one</a>
        </p>
      </div>
    </div>
  );
}
