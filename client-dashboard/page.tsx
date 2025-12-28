"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function ClientDashboard() {
  const [name, setName] = useState("Client");
  const [initial, setInitial] = useState("U");

  // -----------------------------
  // AUTH GUARD + LOAD PROFILE
  // -----------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const q = query(
        collection(db, "users"),
        where("uid", "==", user.uid)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const data = snap.docs[0].data();
        const displayName = data.name || "Client";
        setName(displayName);
        setInitial(displayName.charAt(0).toUpperCase());
      }
    });

    return () => unsub();
  }, []);

  // -----------------------------
  // NAVIGATION
  // -----------------------------
  function nav(path: string) {
    window.location.href = path;
  }

  return (
    <div className="page">
      <header className="dash-header">
        <div className="logo-circle">LB</div>
        <div className="avatar">{initial}</div>
      </header>

      <h1>Welcome back, {name}</h1>
      <p className="sub">Client mode · Find washers near you</p>

      {/* MINI MAP */}
      <div className="mini-map" id="miniMapContainer">
        <div id="miniMap"></div>
        <div className="mini-map-label">Nearby washers</div>
        <div className="mini-map-hint">Tap to open full map</div>
      </div>

      {/* GRID */}
      <section className="grid">
        <div className="card" onClick={() => nav("/client-map")}>
          <div className="card-title">Find a washer</div>
          <div className="card-sub">See nearby washers on the map.</div>
        </div>

        <div className="card" onClick={() => nav("/request-pickup")}>
          <div className="card-title">Request pickup</div>
          <div className="card-sub">Schedule a pickup from your location.</div>
        </div>

        <div className="card" onClick={() => nav("/inbox")}>
          <div className="card-title">Inbox</div>
          <div className="card-sub">Message washers about your loads.</div>
        </div>

        <div className="card" onClick={() => nav("/settings")}>
          <div className="card-title">Settings</div>
          <div className="card-sub">Update your profile & switch modes.</div>
        </div>
      </section>
    </div>
  );
}
