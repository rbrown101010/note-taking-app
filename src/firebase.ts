import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC16WTtbRDTpXCZXhAeCcHzLkRvAaFODd4",
  authDomain: "note-taking-app-68b68.firebaseapp.com",
  projectId: "note-taking-app-68b68",
  storageBucket: "note-taking-app-68b68.appspot.com",
  messagingSenderId: "885505129732",
  appId: "1:885505129732:web:12f414e1bd97f19b08a451",
  measurementId: "G-YXVNB1TCFD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);