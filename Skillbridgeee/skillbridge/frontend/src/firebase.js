// firebase.js
// This file is your ENTIRE backend setup. No server to write or deploy.
//
// SETUP (do this first, takes ~10 minutes):
// 1. Go to https://console.firebase.google.com -> "Add project" -> name it "skillbridge"
// 2. In the project, click the "</>" (web) icon to register a web app
// 3. Copy the firebaseConfig object it gives you and paste it below,
//    replacing the placeholder values
// 4. In the left sidebar: Build -> Authentication -> Get Started ->
//    enable "Email/Password" sign-in method
// 5. In the left sidebar: Build -> Firestore Database -> Create database
//    -> start in TEST MODE (fine for a hackathon demo; not for production)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// firebase.js
// This file is your ENTIRE backend setup. No server to write or deploy.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCsLXAGuUEA5jmYF6RTj0AJDRMOdvsLMs8",
  authDomain: "skillbridge-93a40.firebaseapp.com",
  projectId: "skillbridge-93a40",
  storageBucket: "skillbridge-93a40.firebasestorage.app",
  messagingSenderId: "809034160266",
  appId: "1:809034160266:web:7242f1ffba526526f87573",
  measurementId: "G-940QCRSFE6",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);