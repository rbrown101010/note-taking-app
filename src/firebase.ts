import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, setDoc, getDoc, Timestamp, query, where, getDocs, DocumentReference, Firestore } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup, Auth, UserCredential } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Note, Topic } from "./types";

console.log('Environment Variables:', import.meta.env);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: ReturnType<typeof getStorage>;
let googleProvider: GoogleAuthProvider;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export const registerUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user: User = userCredential.user;
    await createUserDocument(user);
    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
};

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const user: User = result.user;
    await createUserDocument(user);
    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const createUserDocument = async (user: User): Promise<void> => {
  if (!user) return;

  const userDocRef: DocumentReference = doc(db, "users", user.uid);
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
      throw error;
    }
  } else {
    await updateDoc(userDocRef, {
      lastLoginAt: Timestamp.now(),
    });
  }
};

export const initializeDefaultTopics = async (userId: string): Promise<void> => {
  const defaultTopics: Omit<Topic, 'id'>[] = [
    { name: "No Topic", description: "Default topic for uncategorized notes", color: "bg-gray-200", isDefault: true, order: 1000, userId },
    { name: "Voice Notes", description: "Topic for voice-recorded notes", color: "bg-blue-200", isDefault: true, order: 1001, userId }
  ];

  for (const topic of defaultTopics) {
    const topicQuery = query(
      collection(db, `users/${userId}/topics`),
      where("name", "==", topic.name),
      where("isDefault", "==", true)
    );
    const topicSnapshot = await getDocs(topicQuery);

    if (topicSnapshot.empty) {
      await addTopic(topic, userId);
    }
  }
};

export const addTopic = async (topic: Omit<Topic, 'id'>, userId: string): Promise<Topic> => {
  try {
    const docRef = await addDoc(collection(db, `users/${userId}/topics`), topic);
    return { id: docRef.id, ...topic };
  } catch (error) {
    console.error("Error adding topic:", error);
    throw error;
  }
};

export const updateTopic = async (id: string, topicUpdates: Partial<Topic>, userId: string): Promise<Partial<Topic> & { id: string }> => {
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

export const deleteTopic = async (id: string, userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, `users/${userId}/topics`, id));
  } catch (error) {
    console.error("Error deleting topic:", error);
    throw error;
  }
};

export const addNote = async (note: Omit<Note, 'id'>, userId: string): Promise<Note> => {
  try {
    const noteToAdd = {
      ...note,
      createdAt: Timestamp.fromDate(note.createdAt),
      updatedAt: Timestamp.fromDate(note.updatedAt)
    };
    const docRef = await addDoc(collection(db, `users/${userId}/notes`), noteToAdd);
    return { id: docRef.id, ...note };
  } catch (error) {
    console.error("Error adding note:", error);
    throw error;
  }
};

export const updateNote = async (id: string, note: Partial<Note>, userId: string): Promise<void> => {
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

export const deleteNote = async (id: string, userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, `users/${userId}/notes`, id));
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};

export const addVoiceNote = async (note: Omit<Note, 'id'>, userId: string): Promise<Note> => {
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

export { app, db, auth, storage };