<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Account Info – Laundry Spot</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Load Firebase (must be first) -->
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
    h1 { text-align:center; margin-bottom:10px; }
    .card {
      background:#fff4d9;
      padding:20px;
      border-radius:16px;
      box-shadow:0 6px 16px rgba(0,0,0,0.25);
      max-width:520px;
      margin:0 auto 20px;
    }
    .label { font-weight:bold; display:block; margin-bottom:6px; }
    input {
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
  </style>
</head>

<body>
  <h1>Account Info</h1>

  <div class="card">
    <label class="label">Email</label>
    <input id="emailInput" disabled />

    <label class="label">Name</label>
    <input id="nameInput" placeholder="Your name" />

    <label class="label">Phone</label>
    <input id="phoneInput" placeholder="Your phone number" />

    <button class="btn" id="saveBtn">Save Account Info</button>
    <button class="btn secondary" onclick="window.location.href='dashboard.html'">Back to Dashboard</button>

    <div id="statusText"></div>
    <div id="errorText"></div>
  </div>

  <script type="module">
    import {
      onAuthStateChanged,
      updateProfile
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

    import {
      doc,
      getDoc,
      setDoc,
      updateDoc
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

    const emailInput = document.getElementById("emailInput");
    const nameInput = document.getElementById("nameInput");
    const phoneInput = document.getElementById("phoneInput");
    const saveBtn = document.getElementById("saveBtn");
    const statusText = document.getElementById("statusText");
    const errorText = document.getElementById("errorText");

    statusText.innerText = "Loading account...";

    // 🔥 AUTH GUARD
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      const userId = user.uid;
      const userEmail = user.email;

      emailInput.value = userEmail;

      // 🔥 Load Firestore profile
      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        nameInput.value = data.name || "";
        phoneInput.value = data.phone || "";
        statusText.innerText = "Profile loaded.";
      } else {
        // Create empty profile if missing
        await setDoc(ref, {
          email: userEmail,
          name: "",
          phone: "",
          createdAt: Date.now()
        });
        statusText.innerText = "Profile created.";
      }

      // 🔥 Save button
      saveBtn.onclick = async () => {
        statusText.innerText = "Saving...";
        errorText.innerText = "";

        try {
          await updateDoc(ref, {
            name: nameInput.value || "",
            phone: phoneInput.value || ""
          });

          // Update Firebase Auth displayName
          await updateProfile(user, {
            displayName: nameInput.value || null
          });

          statusText.innerText = "Account info saved!";
        } catch (err) {
          console.error(err);
          statusText.innerText = "Error saving account info.";
          errorText.innerText = err.message;
        }
      };
    });
  </script>
</body>
</html>
