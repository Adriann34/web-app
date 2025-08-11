import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC96NV1dr-kqgBKkBnnMLZE0LeYS5VDMms",
  authDomain: "skedulo-a1340.firebaseapp.com",
  projectId: "skedulo-a1340",
  storageBucket: "skedulo-a1340.firebasestorage.app",
  messagingSenderId: "658005746379",
  appId: "1:658005746379:web:b9d5411baa2851f6e7b14e",
  measurementId: "G-9ESPP60LJ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;