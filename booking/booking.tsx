"use client";

import { useState, useEffect } from "react";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where
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

export default function BookPickupPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loads, setLoads] = useState(1);
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // AUTH CHECK
  // -----------------------------
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "/login.html";
      } else {
        setCurrentUser(user);
      }
    });
  }, []);

  // -----------------------------
  // NOTIFICATION SENDER
  // -----------------------------
  async function sendNotification(userId, title, message) {
    await addDoc(collection(db, "notifications"), {
      user_id: userId,
      title,
      message,
      createdAt: Date.now()
    });
  }

  // -----------------------------
  // AUTO-WASHER MATCHING LOGIC
  // -----------------------------
  async function findBestWasher() {
    const washersRef = collection(db, "users");

    const q = query(
      washersRef,
      where("role", "==", "washer"),
      where("verification_status", "==", "approved"),
      where("available", "==", true)
    );

    const snap = await getDocs(q);
    const washers = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (washers.length === 0) return null;

    washers.sort((a, b) => (a.radius || 999) - (b.radius || 999));

    return washers[0].id;
  }

  // -----------------------------
  // CREATE ORDER
  // -----------------------------
  async function createOrder() {
    if (!currentUser) return;

    if (!loads || loads < 1) {
      alert("Please enter a valid number of loads.");
      return;
    }
    if (!pickupTime) {
      alert("Please select a pickup date and time.");
      return;
    }

    setLoading(true);

    const pickup_time = new Date(pickupTime).toISOString();

    // 1. Find best washer
    const washerId = await findBestWasher();

    // 2. Create order
    const orderRef = await addDoc(collection(db, "orders"), {
      client_id: currentUser.uid,
      washer_id: washerId,
      status: "requested",
      loads,
      pickup_time,
      notes,
      createdAt: Date.now()
    });

    // 3. Notify client
    await sendNotification(
      currentUser.uid,
      "Order Created",
      "Your laundry order has been created!"
    );

    // 4. Notify washer (if matched)
    if (washerId) {
      await sendNotification(
        washerId,
        "New Order Assigned",
        "You have been assigned a new laundry order."
      );
    }

    setLoading(false);

    // 5. Redirect to order detail
    window.location.href = `/client-order-detail.html?order_id=${orderRef.id}`;
  }

  return (
    <div className="page-root">
      <style>{`
        body, .page-root {
          margin:0;
          font-family:Arial,sans-serif;
          background:linear-gradient(135deg,#d96e30,#f4c542);
          min-height:100vh;
          padding:20px;
          color:#5a3e2b;
        }
        h1 { text-align:center; margin-bottom:20px; }
        .card {
          background:#fff4d9;
          padding:20px;
          border-radius:16px;
          box-shadow:0 6px 16px rgba(0,0,0,0.25);
          max-width:480px;
          margin:0 auto;
        }
        label { font-weight:bold; display:block; margin-top:10px; }
        input, textarea {
          width:100%;
          padding:12px;
          margin-top:6px;
          border-radius:10px;
          border:2px solid #d96e30;
          background:white;
          box-sizing:border-box;
        }
        textarea { height:90px; resize:none; }
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
          margin-top:14px;
          border:none;
          cursor:pointer;
        }
        .secondary {
          background:#f4c542;
          color:#5a3e2b;
          border:2px solid #d96e30;
        }
        .loading {
          text-align:center;
          margin-top:10px;
          font-style:italic;
          opacity:0.8;
        }
      `}</style>

      <h1>Book Laundry Pickup</h1>

      <div className="card">
        <label>Number of Loads</label>
        <input
          type="number"
          min="1"
          max="20"
          value={loads}
          onChange={(e) => setLoads(Number(e.target.value))}
        />

        <label>Pickup Date & Time</label>
        <input
          type="datetime-local"
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
        />

        <label>Notes for Your Washer</label>
        <textarea
          placeholder="Any special instructions?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button className="btn" onClick={createOrder}>
          Confirm Booking
        </button>

        <a className="btn secondary" href="/dashboard.html">
          Back to Dashboard
        </a>

        {loading && (
          <div className="loading">Processing your order...</div>
        )}
      </div>
    </div>
  );
}
