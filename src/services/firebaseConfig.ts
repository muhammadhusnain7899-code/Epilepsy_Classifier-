import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Real configuration provided
const firebaseConfig = {
  apiKey: "AIzaSyBo3M0r8l7aUdBDwBtW2ybwXUmdNqMpz48",
  authDomain: "epilepsy-classifier.firebaseapp.com",
  projectId: "epilepsy-classifier",
  storageBucket: "epilepsy-classifier.firebasestorage.app",
  messagingSenderId: "428360070638",
  appId: "1:428360070638:web:d9eaffc3281bb775588aff"
};

// Initialize Firebase
let app;
let auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  app = getApp();
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };