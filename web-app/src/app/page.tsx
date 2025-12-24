"use client";

import { useEffect } from "react";
// @ts-ignore - firebase.js is a browser-side module
import { auth } from "../../firebase"; 
// If firebase.js is in /public, use: import { auth } from "/firebase.js";

export default function Home() {
  useEffect(() => {
    // Load Firebase Auth dynamically (client-side only)
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          window.location.href = "client-dashboard.html";
        }
      });
    });

    // Button handlers
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");

    if (loginBtn) loginBtn.onclick = () => (window.location.href = "login.html");
    if (signupBtn)
      signupBtn.onclick = () => (window.location.href = "signup.html");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 20%, rgba(77,166,255,0.18), transparent 60%), radial-gradient(circle at 80% 80%, rgba(122,92,255,0.18), transparent 60%), #030715",
        color: "#f9fbff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "30px 20px",
        overflowX: "hidden",
        position: "relative",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Grid Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.35,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header
        style={{
          width: "100%",
          maxWidth: "600px",
          display: "flex",
          justifyContent: "center",
          marginBottom: "40px",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #7a5cff, #4da6ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "20px",
              color: "#fff",
              boxShadow: "0 0 18px rgba(77,166,255,0.45)",
            }}
          >
            LB
          </div>
          <div style={{ fontSize: "20px", fontWeight: 600 }}>
            Laundry Bubbles
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ textAlign: "center", marginTop: "20px", zIndex: 2 }}>
        <h1
          style={{
            fontSize: "32px",
            lineHeight: 1.2,
            marginBottom: "12px",
            textShadow: "0 0 12px rgba(77,166,255,0.4)",
          }}
        >
          Fresh laundry,<br /> delivered with care
        </h1>

        <p style={{ fontSize: "15px", color: "#9aa3c7", marginBottom: "30px" }}>
          Pickup, wash, dry & fold — powered by trusted local washers.
        </p>

        <button
          id="loginBtn"
          style={{
            width: "100%",
            maxWidth: "320px",
            padding: "12px",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "16px",
            margin: "10px auto",
            display: "block",
            transition: "0.15s ease",
            background: "linear-gradient(135deg, #4da6ff, #7a5cff)",
            color: "#fff",
            boxShadow: "0 12px 28px rgba(77,166,255,0.45)",
          }}
        >
          Log In
        </button>

        <button
          id="signupBtn"
          style={{
            width: "100%",
            maxWidth: "320px",
            padding: "12px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.12)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "16px",
            margin: "10px auto",
            display: "block",
            transition: "0.15s ease",
            background: "rgba(255,255,255,0.06)",
            color: "#9aa3c7",
          }}
        >
          Create Account
        </button>
      </div>
    </main>
  );
}
