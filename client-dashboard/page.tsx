<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Client Dashboard – Laundry Bubbles</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- Load Firebase -->
  <script type="module" src="/firebase.js"></script>

  <style>
    :root {
      --primary:#4da6ff; --accent:#7a5cff; --text:#f9fbff; --muted:#9aa3c7;
      --card:rgba(255,255,255,0.05);
    }
    * { margin:0; padding:0; box-sizing:border-box; font-family:system-ui,sans-serif; }

    body {
      min-height:100vh;
      background:
        radial-gradient(circle at 20% 20%,rgba(77,166,255,0.18),transparent 60%),
        radial-gradient(circle at 80% 80%,rgba(122,92,255,0.18),transparent 60%),
        #030715;
      color:var(--text);
      padding:18px;
      overflow-x:hidden;
    }

    header {
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:22px;
    }

    .logo-circle {
      width:42px; height:42px;
      border-radius:50%;
      background:linear-gradient(135deg,var(--accent),var(--primary));
      display:flex; align-items:center; justify-content:center;
      font-weight:700; font-size:18px; color:#fff;
      box-shadow:0 0 14px rgba(77,166,255,0.45);
    }

    .avatar {
      width:38px; height:38px;
      border-radius:50%;
      background:rgba(255,255,255,0.08);
      border:1px solid rgba(255,255,255,0.15);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer;
    }

    h1 { font-size:24px; margin-bottom:6px; }
    .sub { font-size:14px; color:var(--muted); margin-bottom:18px; }

    .mini-map {
      width:100%;
      height:180px;
      border-radius:20px;
      border:1px solid rgba(255,255,255,0.14);
      overflow:hidden;
      position:relative;
      cursor:pointer;
      box-shadow:0 12px 30px rgba(0,0,0,0.6);
      margin-bottom:22px;
    }

    #miniMap { width:100%; height:100%; }

    .mini-map-label {
      position:absolute; left:12px; bottom:12px;
      background:rgba(3,7,21,0.9);
      padding:4px 10px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,0.18);
      font-size:13px;
    }

    .mini-map-hint {
      position:absolute; right:12px; bottom:12px;
      font-size:11px; color:var(--muted);
    }

    .grid {
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
      gap:16px;
    }

    .card {
      background:var(--card);
      border:1px solid rgba(255,255,255,0.12);
      border-radius:18px;
      padding:16px;
      cursor:pointer;
      transition:0.15s ease;
    }

    .card:hover {
      transform:translateY(-3px);
      border-color:var(--primary);
      box-shadow:0 14px 30px rgba(77,166,255,0.4);
    }

    .card-title { font-size:16px; margin-bottom:4px; }
    .card-sub { font-size:12px; color:var(--muted); }
  </style>
</head>

<body>
  <header>
    <div class="logo-circle">LB</div>
    <div class="avatar" id="avatarInitial">U</div>
  </header>

  <h1 id="greeting">Welcome back</h1>
  <p class="sub">Client mode · Find washers near you</p>

  <!-- MINI INTERACTIVE MAP -->
  <div class="mini-map" id="miniMapContainer">
    <div id="miniMap"></div>
    <div class="mini-map-label">Nearby washers</div>
    <div class="mini-map-hint">Tap to open full map</div>
  </div>

  <section class="grid">
    <div class="card" onclick="nav('client-map.html')">
      <div class="card-title">Find a washer</div>
      <div class="card-sub">See nearby washers on the map.</div>
    </div>

    <div class="card" onclick="nav('request-pickup.html')">
      <div class="card-title">Request pickup</div>
      <div class="card-sub">Schedule a pickup from your location.</div>
    </div>

    <div class="card" onclick="nav('inbox.html')">
      <div class="card-title">Inbox</div>
      <div class="card-sub">Message washers about your loads.</div>
    </div>

    <div class="card" onclick="nav('settings.html')">
      <div class="card-title">Settings</div>
      <div class="card-sub">Update your profile & switch modes.</div>
    </div>
  </section>

  <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB02c_eleXuhHWdSMJzqk9mESbXn_PT2zc"></script>

  <script type="module">
    import {
      onAuthStateChanged
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

    import {
      collection,
      query,
      where,
      getDocs
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

    function nav(page){ window.location.href = page; }

    const avatar = document.getElementById("avatarInitial");
    const greeting = document.getElementById("greeting");

    let currentUser = null;

    // -----------------------------
    // AUTH GUARD + LOAD USER PROFILE
    // -----------------------------
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      currentUser = user;

      // Load Firestore profile
      const snap = await getDocs(
        query(collection(db, "users"), where("uid", "==", user.uid))
      );

      if (!snap.empty) {
        const data = snap.docs[0].data();
        greeting.textContent = `Welcome back, ${data.name || "Client"}`;
        avatar.textContent = (data.name || "U").charAt(0).toUpperCase();
      }
    });

    // -----------------------------
    // LOAD REAL WASHERS FROM FIRESTORE
    // -----------------------------
    async function loadWashers() {
      const q = query(
        collection(db, "users"),
        where("role", "==", "washer"),
        where("verification_status", "==", "approved"),
        where("available", "==", true)
      );

      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data());
    }

    // -----------------------------
    // MINI MAP
    // -----------------------------
    async function initMiniMap() {
      const washers = await loadWashers();

      const defaultPos = { lat:33.7490, lng:-84.3880 };

      const map = new google.maps.Map(document.getElementById("miniMap"), {
        center: defaultPos,
        zoom: 12,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        styles: [
          { elementType:"geometry", stylers:[{color:"#1d1d2b"}] },
          { elementType:"labels.text.fill", stylers:[{color:"#f9fbff"}] }
        ]
      });

      washers.forEach(w => {
        if (w.lat && w.lng) {
          new google.maps.Marker({
            position:{lat:w.lat, lng:w.lng},
            map,
            icon:"https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          });
        }
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const userPos = { lat:pos.coords.latitude, lng:pos.coords.longitude };
          map.setCenter(userPos);

          new google.maps.Marker({
            position:userPos,
            map,
            icon:"https://maps.google.com/mapfiles/ms/icons/red-dot.png"
          });
        });
      }

      document.getElementById("miniMapContainer").onclick = () => nav("client-map.html");
    }

    window.onload = initMiniMap;
  </script>
</body>
</html>
