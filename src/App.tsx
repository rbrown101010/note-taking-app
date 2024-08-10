import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from './firebase';
import NoteEditor from './components/NoteEditor';
import Sidebar from './components/Sidebar';
import { Note, Category } from './types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import 'react-calendar/dist/Calendar.css';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    const notesQuery = query(collection(db, "notes"));
    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as Note));
      setNotes(notesData);
    });

    const categoriesQuery = query(collection(db, "categories"));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        parentId: doc.data().parentId || null
      } as Category));
      setCategories(categoriesData);
    });

    return () => {
      unsubscribeNotes();
      unsubscribeCategories();
    };
  }, []);

  const filteredNotes = notes
    .filter(note => selectedCategory === 'all' || note.categoryId === selectedCategory)
    .filter(note => !selectedTag || note.tags.includes(selectedTag));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-100">
        <Sidebar
          categories={categories}
          notes={notes}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
        />
        <div className="flex-1 flex flex-col">
          <NoteEditor
            notes={filteredNotes}
            categories={categories}
            editingNote={editingNote}
            setEditingNote={setEditingNote}
            selectedCategory={selectedCategory}
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default App;
