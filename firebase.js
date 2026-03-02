
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA-yxUzxWe0UlRNP0q5ZzQKZLSEVq9iow4",
  authDomain: "quickly-1e2ee.firebaseapp.com",
  databaseURL: "https://quickly-1e2ee-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quickly-1e2ee",
  storageBucket: "quickly-1e2ee.firebasestorage.app",
  messagingSenderId: "793585881297",
  appId: "1:793585881297:web:72a6b2fa5252b4df23f5f0",
  measurementId: "G-RY17TRFVK9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
isSupported().then(isSupported => {
    if (isSupported) {
        getAnalytics(app);
    }
});

// Initialize Auth
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);