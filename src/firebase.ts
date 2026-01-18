// src/firebase.ts
import { initializeApp } from "firebase/app"
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth"
import type { User } from "firebase/auth"
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc
} from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxSK4rtvx81Fl9mLvQBNjsKvEweQQwyqk",
  authDomain: "quickcart-32798.firebaseapp.com",
  projectId: "quickcart-32798",
  storageBucket: "quickcart-32798.firebasestorage.app",
  messagingSenderId: "479160128408",
  appId: "1:479160128408:web:382a1f6d02284b2e5d51ed"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { 
  auth,
  db,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc
}

export type { User }