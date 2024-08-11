// src/components/Layout.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { User, Folder, Note } from '../types';
import Sidebar from './Sidebar';
import FolderNotes from './FolderNotes';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, getDocs } from 'firebase/firestore';
import { Loader } from 'lucide-react';

interface LayoutProps {
  user: User;
  onSignOut: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onSignOut }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    setIsLoading(true);
    console.log("Fetching folders for user ID:", user.id);
    const foldersQuery = query(
      collection(db, `users/${user.id}/folders`),
      orderBy('createdAt', 'desc')
    );

    try {
      const querySnapshot = await getDocs(foldersQuery);
      const foldersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Folder));
      console.log("Folders snapshot received:", foldersData.length, "documents");
      setFolders(foldersData);
      setIsLoading(false);

      if (!selectedFolder && foldersData.length > 0) {
        setSelectedFolder(foldersData[0].id);
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
      setError("Failed to load folders. Please try again later.");
      setIsLoading(false);
    }
  }, [user.id, selectedFolder]);

  const fetchNotes = useCallback(async () => {
    if (!selectedFolder) return;

    setIsLoading(true);
    const notesQuery = query(
      collection(db, `users/${user.id}/notes`),
      where('folderId', '==', selectedFolder),
      orderBy('updatedAt', 'desc')
    );

    try {
      const querySnapshot = await getDocs(notesQuery);
      const notesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Note));
      setNotes(notesData);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to load notes. Please try again later.");
      setIsLoading(false);
    }
  }, [user.id, selectedFolder]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    if (selectedFolder) {
      fetchNotes();
    }
  }, [fetchNotes, selectedFolder]);

  useEffect(() => {
    const initializeUserFolders = async () => {
      if (folders.length === 0) {
        console.log("No folders found. Creating initial folder.");
        try {
          const newFolder: Omit<Folder, 'id'> = {
            name: "My First Folder",
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await addDoc(collection(db, `users/${user.id}/folders`), newFolder);
        } catch (error) {
          console.error("Error creating initial folder:", error);
          setError("Failed to create initial folder. Please try again later.");
        }
      }
    };

    initializeUserFolders();
  }, [folders, user.id]);

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
    setNotes([]); // Clear notes when changing folders
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        folders={folders}
        selectedFolder={selectedFolder}
        setSelectedFolder={handleFolderSelect}
        user={user}
        onSignOut={onSignOut}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader className="animate-spin text-gray-500" size={48} />
          </div>
        ) : (
          <FolderNotes
            folder={folders.find((f) => f.id === selectedFolder) || null}
            notes={notes}
            userId={user.id}
          />
        )}
      </main>
    </div>
  );
};

export default Layout;