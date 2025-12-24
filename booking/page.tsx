<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Book Laundry Pickup – Laundry Bubbles</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Load Firebase -->
  <script type="module" src="/firebase.js"></script>

  <style>
    body {
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
  </style>
</head>

<body>
  <h1>Book Laundry Pickup</h1>

  <div class="card">
    <label>Number of Loads</label>
    <input id="loads" type="number" min="1" max="20" value="1" />

    <label>Pickup Date & Time</label>
    <input id="pickupTime" type="datetime-local" />

    <label>Notes for Your Washer</label>
    <textarea id="notes" placeholder="Any special instructions?"></textarea>

    <button class="btn" onclick="createOrder()">Confirm Booking</button>
    <a class="btn secondary" href="dashboard.html">Back to Dashboard</a>

    <div id="loading" class="loading" style="display:none;">Processing your order...</div>
  </div>

  <script type="module">
    import {
      onAuthStateChanged
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

    import {
      collection,
      doc,
      getDocs,
      addDoc,
      setDoc,
      updateDoc,
      query,
      where
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

    let currentUser = null;

    // -----------------------------
    // AUTH CHECK
    // -----------------------------
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "login.html";
      } else {
        currentUser = user;
      }
    });

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
    window.createOrder = async function () {
      if (!currentUser) return;

      const loads = Number(document.getElementById("loads").value);
      const pickupInput = document.getElementById("pickupTime").value;
      const notes = document.getElementById("notes").value.trim();
      const loading = document.getElementById("loading");

      if (!loads || loads < 1) {
        alert("Please enter a valid number of loads.");
        return;
      }
      if (!pickupInput) {
        alert("Please select a pickup date and time.");
        return;
      }

      loading.style.display = "block";

      const pickup_time = new Date(pickupInput).toISOString();

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

      loading.style.display = "none";

      // 5. Redirect to order detail
      window.location.href = `client-order-detail.html?order_id=${orderRef.id}`;
    };
  </script>
</body>
</html>
