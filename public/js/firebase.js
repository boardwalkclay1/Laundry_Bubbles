// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCRjiZum9L0UGLxDap4duEN3VIPj4PAmvo",
  authDomain: "launrdy-bubbles.firebaseapp.com",
  projectId: "launrdy-bubbles",
  storageBucket: "launrdy-bubbles.firebasestorage.app",
  messagingSenderId: "625079841514",
  appId: "1:625079841514:web:472b2721f4acb836111d93",
  measurementId: "G-QT16Z65J1E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
