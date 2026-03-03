import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, isSupported } from "firebase/analytics";
import { FIREBASE_API_KEY } from '@env';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "smart-task-native-865a0.firebaseapp.com",
  projectId: "smart-task-native-865a0",
  storageBucket: "smart-task-native-865a0.firebasestorage.app",
  messagingSenderId: "256148183587",
  appId: "1:256148183587:web:cd0ac5ca9f293a188bef96",
  measurementId: "G-37NPSZVMTF"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Analytics
isSupported().then(isSupported => {
    if (isSupported) {
        getAnalytics(app);
    }
});

export { db, auth };
