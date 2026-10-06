import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApnOocMKxam0h02OqqxOgEIgI1Jjzx5r8",
  authDomain: "emergencyresponsesystem-8686b.firebaseapp.com",
  projectId: "emergencyresponsesystem-8686b",
  storageBucket: "emergencyresponsesystem-8686b.firebasestorage.app",
  messagingSenderId: "626095788579",
  appId: "1:626095788579:web:def06559dbf077bb689796",
  measurementId: "G-8DHLVLTQSN"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);