import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase"; // Updated import path
import Sidebar from "./Sidebar";
import NoteEditor from "./NoteEditor";
import VoiceRecorder from './VoiceRecorder'; // Import VoiceRecorder component
import { Category, Note } from '../types';

const LibraryLayout: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);

  useEffect(() => {
    const categoriesQuery = query(collection(db, "categories"));
    const notesQuery = query(collection(db, "notes"));

    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(categoriesData);
    });

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      setNotes(notesData);
    });

    return () => {
      unsubscribeCategories();
      unsubscribeNotes();
    };
  }, []);

  const filteredNotes = notes
    .filter(note => selectedCategory === 'all' || note.categoryId === selectedCategory)
    .filter(note => !selectedTag || note.tags.includes(selectedTag));

  const handleVoiceRecordClick = () => {
    setIsVoiceRecorderOpen(true);
  };

  const handleNoteCreated = (newNote: Note) => {
    setNotes(prevNotes => [...prevNotes, newNote]);
    setIsVoiceRecorderOpen(false); // Close the voice recorder after creating a note
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
        onVoiceRecordClick={handleVoiceRecordClick} // Pass the onVoiceRecordClick function
      />
      <div className="flex-1 flex flex-col">
        {isVoiceRecorderOpen && (
          <div className="p-4 bg-white shadow">
            <VoiceRecorder 
              categories={categories} 
              onNoteCreated={handleNoteCreated} 
              onClose={() => setIsVoiceRecorderOpen(false)} // Pass the onClose function
            />
          </div>
        )}
        <NoteEditor
          notes={filteredNotes}
          categories={categories}
          editingNote={editingNote}
          setEditingNote={setEditingNote}
        />
      </div>
    </div>
  );
};

export default LibraryLayout;