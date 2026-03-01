// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBVrj7HxF-sLQULQaKHJnPJv90haxUfbpw",
  authDomain: "vazi-ops.firebaseapp.com",
  projectId: "vazi-ops",
  storageBucket: "vazi-ops.firebasestorage.app",
  messagingSenderId: "676923623997",
  appId: "1:676923623997:web:163ce2c883040479607854",
  measurementId: "G-HT6QJD4T0L",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
