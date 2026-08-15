// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtnzYAEvy92g2eEPRmPrEIt9k1WQwFlUc",
  authDomain: "ai-exam-builder-39eb0.firebaseapp.com",
  databaseURL:
    "https://ai-exam-builder-39eb0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ai-exam-builder-39eb0",
  storageBucket: "ai-exam-builder-39eb0.firebasestorage.app",
  messagingSenderId: "168993320047",
  appId: "1:168993320047:web:9be437fb6ce2a87c02319a",
  measurementId: "G-3B5DVC4MHP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export { app };
