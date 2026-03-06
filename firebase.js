import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAXxwZeWLUtRNP0q5ZzQKZLSEVq9iow4",
  authDomain: "quickly-1e2ee.firebaseapp.com",
  projectId: "quickly-1e2ee",
  storageBucket: "smart-task-app-84eef.appspot.com",
  messagingSenderId: "793585881297",
  appId: "1:793585881297:web:da4300767c9be22723f5f0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);