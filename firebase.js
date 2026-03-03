import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAXxwZeWLUtRNP0q5ZzQKZLSEVq9iow4", // paste exact key from console
  authDomain: "quickly-1e2ee.firebaseapp.com",
  projectId: "quickly-1e2ee",
  storageBucket: "quickly-1e2ee.appspot.com",
  messagingSenderId: "793585881297",
  appId: "1:793585881297:web:da4300767c9be22723f5f0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);