import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "./Sidebar";
import NoteEditor from "./NoteEditor";
import VoiceRecorder from './VoiceRecorder';
import { Category, Note, User } from '../types';
import { Mic } from 'lucide-react';

interface LibraryLayoutProps {
  user: User;
  onSignOut: () => void;
}

const LibraryLayout: React.FC<LibraryLayoutProps> = ({ user, onSignOut }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);

  useEffect(() => {
    const categoriesQuery = query(collection(db, `users/${user.id}/categories`));
    const notesQuery = query(collection(db, `users/${user.id}/notes`));

    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        parentId: doc.data().parentId || null
      } as Category));
      setCategories(categoriesData);
    });

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Note));
      setNotes(notesData);
    });

    return () => {
      unsubscribeCategories();
      unsubscribeNotes();
    };
  }, [user.id]);

  const handleVoiceRecordClick = () => {
    setIsVoiceRecorderOpen(true);
  };

  const handleNoteCreated = (newNote: Note) => {
    setNotes(prevNotes => {
      const existingNoteIndex = prevNotes.findIndex(note => note.id === newNote.id);
      if (existingNoteIndex !== -1) {
        // Update existing note
        const updatedNotes = [...prevNotes];
        updatedNotes[existingNoteIndex] = newNote;
        return updatedNotes;
      } else {
        // Add new note
        return [...prevNotes, newNote];
      }
    });
    setIsVoiceRecorderOpen(false);
  };

  const handleNewNoteClick = async () => {
    const newNote: Omit<Note, 'id'> = {
      title: 'New Note',
      content: '',
      categoryId: selectedCategory === 'all' ? (categories[0]?.id || '') : selectedCategory,
      tags: [],
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id
    };

    try {
      const docRef = await addDoc(collection(db, `users/${user.id}/notes`), newNote);
      const createdNote: Note = { id: docRef.id, ...newNote };
      setEditingNote(createdNote); // This line opens the note for editing immediately
    } catch (error) {
      console.error("Error adding new note:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 font-sans">
      <Sidebar
        categories={categories}
        notes={notes}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        onVoiceRecordClick={handleVoiceRecordClick}
        user={user}
        onSignOut={onSignOut}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-gray-800">
          <h2 className="text-3xl font-bold text-white">Notes</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleNewNoteClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors duration-200 shadow-md"
            >
              New Note
            </button>
            <button 
              onClick={handleVoiceRecordClick}
              className="bg-white hover:bg-gray-100 text-blue-600 px-4 py-2 rounded-full flex items-center transition-colors duration-200 shadow-md"
            >
              <Mic className="mr-2" /> new
            </button>
          </div>
        </div>
        {isVoiceRecorderOpen && (
          <VoiceRecorder 
            categories={categories} 
            onNoteCreated={handleNoteCreated} 
            onClose={() => setIsVoiceRecorderOpen(false)}
            userId={user.id}
            autoStart={true}
          />
        )}
        <NoteEditor
          notes={notes.filter(note => selectedCategory === 'all' || note.categoryId === selectedCategory)
                     .filter(note => !selectedTag || note.tags.includes(selectedTag))}
          categories={categories}
          editingNote={editingNote}
          setEditingNote={setEditingNote}
          selectedCategory={selectedCategory}
          user={user}
        />
      </div>
    </div>
  );
};

export default LibraryLayout;