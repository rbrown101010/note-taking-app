import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Note, Category } from "./types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const registerUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await createUserDocument(user);
    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await createUserDocument(user);
    return user;
  } catch (error) {
    if (error.code === 'auth/cancelled-popup-request') {
      console.log("Google Sign-In was cancelled by the user");
      throw new Error("Sign-in cancelled. Please try again.");
    } else if (error.code === 'auth/popup-closed-by-user') {
      console.log("Google Sign-In popup was closed by the user");
      throw new Error("Sign-in popup closed. Please try again.");
    } else if (error.code === 'auth/popup-blocked') {
      console.log("Google Sign-In popup was blocked");
      throw new Error("Sign-in popup was blocked. Please allow popups for this site and try again.");
    } else {
      console.error("Error signing in with Google", error);
      throw new Error("An error occurred during sign-in. Please try again.");
    }
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const createUserDocument = async (user: User) => {
  if (!user) return;

  const userDocRef = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userDocRef);

  if (!userSnapshot.exists()) {
    const { email, displayName, photoURL } = user;
    try {
      await setDoc(userDocRef, {
        email,
        displayName,
        photoURL,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
      });
      await initializeDefaultCategories(user.uid);
    } catch (error) {
      console.error("Error creating user document", error);
    }
  } else {
    await updateDoc(userDocRef, {
      lastLoginAt: Timestamp.now(),
    });
  }
};

export const addCategory = async (category: Omit<Category, 'id'>, userId: string) => {
  try {
    const docRef = await addDoc(collection(db, `users/${userId}/categories`), {
      ...category,
      parentId: category.parentId || null
    });
    return { id: docRef.id, ...category } as Category;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

export const updateCategory = async (id: string, category: Partial<Category>, userId: string) => {
  try {
    await updateDoc(doc(db, `users/${userId}/categories`, id), category);
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

export const deleteCategory = async (id: string, userId: string) => {
  try {
    await deleteDoc(doc(db, `users/${userId}/categories`, id));
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

export const addNote = async (note: Omit<Note, 'id'>, userId: string) => {
  try {
    const noteToAdd = {
      ...note,
      createdAt: Timestamp.fromDate(note.createdAt || new Date()),
      updatedAt: Timestamp.fromDate(note.updatedAt || new Date())
    };
    const docRef = await addDoc(collection(db, `users/${userId}/notes`), noteToAdd);
    return { id: docRef.id, ...note } as Note;
  } catch (error) {
    console.error("Error adding note:", error);
    throw error;
  }
};

export const updateNote = async (id: string, note: Partial<Note>, userId: string) => {
  try {
    const noteToUpdate = {
      ...note,
      updatedAt: Timestamp.fromDate(new Date())
    };
    await updateDoc(doc(db, `users/${userId}/notes`, id), noteToUpdate);
  } catch (error) {
    console.error("Error updating note:", error);
    throw error;
  }
};

export const deleteNote = async (id: string, userId: string) => {
  try {
    await deleteDoc(doc(db, `users/${userId}/notes`, id));
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};

export const addVoiceNote = async (note: Omit<Note, 'id'>, userId: string) => {
  const voiceNote = { 
    ...note, 
    isVoiceNote: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return addNote(voiceNote, userId);
};

export const initializeDefaultCategories = async (userId: string) => {
  const defaultCategories = [
    { name: "Uncategorized", color: "bg-gray-200", parentId: null },
    { name: "Voice Notes", color: "bg-blue-200", parentId: null }
  ];

  for (const category of defaultCategories) {
    await addCategory(category, userId);
  }
};

export default app;
