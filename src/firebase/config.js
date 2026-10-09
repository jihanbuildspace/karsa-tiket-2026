import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { initialEvents, initialPembeli, initialTiket } from './mockData';

// Storage keys
const FIREBASE_CONFIG_KEY = 'karsa_tiket_firebase_config';
const LOCAL_DB_KEY = 'karsa_tiket_local_db';

// Get config from localStorage or Vite env
export const getStoredFirebaseConfig = () => {
  const local = localStorage.getItem(FIREBASE_CONFIG_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Invalid stored config:', e);
    }
  }

  // Fallback to Vite env variables if defined
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  return null;
};

export const saveFirebaseConfig = (config) => {
  if (config) {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  } else {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
  }
};

let app = null;
let db = null;
let isFirebaseLive = false;

const config = getStoredFirebaseConfig();
if (config && config.projectId) {
  try {
    app = !getApps().length ? initializeApp(config) : getApp();
    db = getFirestore(app);
    isFirebaseLive = true;
    console.log('🔥 Connected to Firebase Firestore:', config.projectId);
  } catch (err) {
    console.warn('Firebase initialization error, fallback to local store:', err);
    isFirebaseLive = false;
  }
}

// Local mock database with persistence for demo mode
const getLocalDB = () => {
  const data = localStorage.getItem(LOCAL_DB_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Local DB parse error:', e);
    }
  }
  const initial = {
    event: [...initialEvents],
    pembeli: [...initialPembeli],
    tiket: [...initialTiket]
  };
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(initial));
  return initial;
};

const saveLocalDB = (data) => {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data));
};

export const resetLocalDB = () => {
  const initial = {
    event: [...initialEvents],
    pembeli: [...initialPembeli],
    tiket: [...initialTiket]
  };
  saveLocalDB(initial);
  return initial;
};

export { 
  app, 
  db, 
  isFirebaseLive,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment, 
  serverTimestamp,
  getLocalDB,
  saveLocalDB
};
