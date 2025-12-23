<script type="module">
  import { db } from "/firebase.js";
  import {
    doc,
    setDoc
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

  /**
   * Start streaming washer location to Firestore.
   * @param {object} user - Firebase user object
   * @param {function} setStatusText - optional callback for UI updates
   * @returns {number|null} watchId
   */
  export function startWasherLocationStream(user, setStatusText) {
    if (!navigator.geolocation) {
      setStatusText?.("Location not supported.");
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      async pos => {
        try {
          await setDoc(
            doc(db, "locations", user.uid),
            {
              user_id: user.uid,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              updated_at: Date.now()
            },
            { merge: true }
          );

          setStatusText?.("Location sharing is ON.");
        } catch (err) {
          console.error("Location update error:", err);
          setStatusText?.("Error sending location.");
        }
      },
      err => {
        console.error("Geolocation error:", err);
        setStatusText?.("Unable to get your location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    return watchId;
  }
</script>
