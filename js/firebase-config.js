import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDaPvOB_hQnvGhiWpF77JG1euFNgu5kC94",
  authDomain: "pet-hotel-9116c.firebaseapp.com",
  projectId: "pet-hotel-9116c",
  storageBucket: "pet-hotel-9116c.appspot.com",
  messagingSenderId: "550182128399",
  appId: "1:550182128399:web:74b7ed2fd96cb2f8524c7a",
  measurementId: "G-68HVJYMQ53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
const auth = getAuth(app);
console.log(app);