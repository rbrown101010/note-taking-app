import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, setDoc, getDoc, Timestamp, query, where, getDocs } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Note, Topic } from "./types";

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
export const storage = getStorage(app);
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
    console.error("Error signing in with Google:", error);
    throw error;
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
      await initializeDefaultTopics(user.uid);
    } catch (error) {
      console.error("Error creating user document", error);
    }
  } else {
    await updateDoc(userDocRef, {
      lastLoginAt: Timestamp.now(),
    });
  }
};

export const initializeDefaultTopics = async (userId: string) => {
  const defaultTopics = [
    { name: "No Topic", color: "bg-gray-200", isDefault: true, order: 1000 },
    { name: "Voice Notes", color: "bg-blue-200", isDefault: true, order: 1001 }
  ];

  for (const topic of defaultTopics) {
    const topicQuery = query(
      collection(db, `users/${userId}/topics`),
      where("name", "==", topic.name),
      where("isDefault", "==", true)
    );
    const topicSnapshot = await getDocs(topicQuery);

    if (topicSnapshot.empty) {
      await addTopic({ ...topic, userId }, userId);
    }
  }
};

export const addTopic = async (topic: Omit<Topic, 'id'>, userId: string) => {
  try {
    const docRef = await addDoc(collection(db, `users/${userId}/topics`), topic);
    return { id: docRef.id, ...topic } as Topic;
  } catch (error) {
    console.error("Error adding topic:", error);
    throw error;
  }
};

export const updateTopic = async (id: string, topicUpdates: Partial<Topic>, userId: string) => {
  try {
    const topicRef = doc(db, `users/${userId}/topics`, id);
    await updateDoc(topicRef, topicUpdates);
    console.log("Topic updated successfully");
    return { id, ...topicUpdates };
  } catch (error) {
    console.error("Error updating topic:", error);
    throw error;
  }
};

export const deleteTopic = async (id: string, userId: string) => {
  try {
    await deleteDoc(doc(db, `users/${userId}/topics`, id));
  } catch (error) {
    console.error("Error deleting topic:", error);
    throw error;
  }
};

export const addNote = async (note: Omit<Note, 'id'>, userId: string) => {
  try {
    const noteToAdd = {
      ...note,
      createdAt: Timestamp.fromDate(note.createdAt),
      updatedAt: Timestamp.fromDate(note.updatedAt)
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

export const uploadMedia = async (userId: string, noteId: string, file: File): Promise<string> => {
  const storageRef = ref(storage, `users/${userId}/notes/${noteId}/${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const deleteMedia = async (userId: string, noteId: string, fileName: string): Promise<void> => {
  const filePath = `users/${userId}/notes/${noteId}/${fileName}`;
  console.log("Attempting to delete file:", filePath);
  const storageRef = ref(storage, filePath);
  try {
    await deleteObject(storageRef);
    console.log("File successfully deleted");
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

export const updateNoteMedia = async (userId: string, noteId: string, media: string[]): Promise<void> => {
  const noteRef = doc(db, `users/${userId}/notes`, noteId);
  await updateDoc(noteRef, { media });
};

export default app;
