<script type="module">
  import { db } from "/firebase.js";
  import {
    collection,
    addDoc
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

  /**
   * Send a notification to a user.
   * @param {string} userId - Firebase UID of the user
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   */
  export async function sendNotification(userId, title, message) {
    await addDoc(collection(db, "notifications"), {
      user_id: userId,
      title,
      message,
      read: false,
      created_at: Date.now()
    });
  }
</script>
