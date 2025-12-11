// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB0NdOhuo6w6V5OeM2tNo6KYMvP6ujAqqI",
  authDomain: "quest-crm.firebaseapp.com",
  projectId: "quest-crm",
  storageBucket: "quest-crm.firebasestorage.app",
  messagingSenderId: "1093096235062",
  appId: "1:1093096235062:web:2c2a5d03fc58973a5a3897",
  measurementId: "G-47M4HXHKG6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db };
