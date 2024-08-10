import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Note, Category } from "./types";

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

export const addNote = async (note: Omit<Note, 'id'>) => {
  const docRef = await addDoc(collection(db, "notes"), note);
  return { id: docRef.id, ...note } as Note;
};

export const updateNote = async (id: string, note: Partial<Note>) => {
  await updateDoc(doc(db, "notes", id), note);
};

export const deleteNote = async (id: string) => {
  await deleteDoc(doc(db, "notes", id));
};

export const addCategory = async (category: Omit<Category, 'id'>) => {
  const docRef = await addDoc(collection(db, "categories"), category);
  return { id: docRef.id, ...category } as Category;
};

export const updateCategory = async (id: string, category: Partial<Category>) => {
  await updateDoc(doc(db, "categories", id), category);
};

export const deleteCategory = async (id: string) => {
  await deleteDoc(doc(db, "categories", id));
};

export const addVoiceNote = async (note: Omit<Note, 'id'>) => {
  const voiceNote = { ...note, isVoiceNote: true };
  return addNote(voiceNote);
};