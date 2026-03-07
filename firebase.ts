
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, isSupported } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBG3wmPtyQVtoG7EIHJ9jmJhSAHlYRkdU",
  authDomain: "smart-task-app-84eef.firebaseapp.com",
  projectId: "smart-task-app-84eef",
  storageBucket: "smart-task-app-84eef.appspot.com",
  messagingSenderId: "213683351587",
  appId: "1:213683351587:web:f8578669ade8cb102a4196",
  measurementId: "G-PQKCN1544H"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
  db = getFirestore(app);
  storage = getStorage(app, "gs://smart-task-app-84eef.firebasestorage.app");
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app, "gs://smart-task-app-84eef.firebasestorage.app");
}

// Initialize Analytics
isSupported().then(isSupported => {
    if (isSupported) {
        getAnalytics(app);
    }
});

export { db, auth, storage };
