import React, { useState, useEffect } from 'react';
import { updateDoc, doc, addDoc, collection, deleteDoc } from "firebase/firestore";
import { db } from '../firebase';
import { Note, Category } from '../types';
import { sortNotesByDate } from '../utils';
import AIChat from './AIChat';
import VoiceRecorder from './VoiceRecorder';

interface NoteEditorProps {
  notes: Note[];
  categories: Category[];
  editingNote: Note | null;
  setEditingNote: React.Dispatch<React.SetStateAction<Note | null>>;
  selectedCategory: string;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ notes, categories, editingNote, setEditingNote, selectedCategory }) => {
  const [localEditingNote, setLocalEditingNote] = useState<Note | null>(null);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);

  useEffect(() => {
    setSortedNotes(sortNotesByDate(notes));
  }, [notes]);

  const handleNoteClick = (note: Note) => {
    setEditingNote(note);
    setLocalEditingNote(note);
  };

  const handleLocalNoteChange = (newContent: string) => {
    if (localEditingNote) {
      const updatedNote = { ...localEditingNote, content: newContent, updatedAt: new Date() };
      const div = document.createElement('div');
      div.innerHTML = newContent;
      const text = div.textContent || div.innerText;
      updatedNote.tags = text.match(/#(\w+)/g)?.map(tag => tag.slice(1)) || [];
      setLocalEditingNote(updatedNote);
    }
  };

  const saveNote = async () => {
    if (localEditingNote) {
      const { id, ...noteWithoutId } = localEditingNote;
      await updateDoc(doc(db, "notes", id), { ...noteWithoutId, updatedAt: new Date() });
      setEditingNote(null);
      setLocalEditingNote(null);
    }
  };

  const createNewNote = async () => {
    const newNote: Omit<Note, 'id'> = {
      title: 'New Note',
      content: '',
      categoryId: selectedCategory === 'all' ? (categories[0]?.id || '') : selectedCategory,
      tags: [],
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const docRef = await addDoc(collection(db, "notes"), newNote);
    const createdNote = { id: docRef.id, ...newNote } as Note;
    setEditingNote(createdNote);
    setLocalEditingNote(createdNote);
  };

  const deleteNote = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteDoc(doc(db, "notes", noteId));
      if (editingNote?.id === noteId) {
        setEditingNote(null);
        setLocalEditingNote(null);
      }
    }
  };

  const handleVoiceNoteCreated = (newNote: Note) => {
    setEditingNote(newNote);
    setLocalEditingNote(newNote);
    setIsVoiceRecorderOpen(false);
  };

  return (
    <div className="flex-1 p-8 bg-gray-100">
      <div className="flex justify-between mb-8">
        <h2 className="text-3xl font-bold text-indigo-800">Notes</h2>
        <div className="flex space-x-4">
          <button 
            onClick={createNewNote} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full transition-colors duration-200 shadow-md"
          >
            New Note
          </button>
          <button
            onClick={() => setIsVoiceRecorderOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full transition-colors duration-200 shadow-md"
          >
            Record Voice Note
          </button>
        </div>
      </div>
      {isVoiceRecorderOpen && (
        <VoiceRecorder
          categories={categories}
          onNoteCreated={handleVoiceNoteCreated}
          onClose={() => setIsVoiceRecorderOpen(false)}
        />
      )}
      {localEditingNote ? (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-3/4 h-3/4 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <input
                value={localEditingNote.title}
                onChange={(e) => setLocalEditingNote({...localEditingNote, title: e.target.value})}
                className="text-2xl font-bold w-1/2 border-b-2 border-indigo-200 focus:border-indigo-600 outline-none px-2 py-1"
              />
              <div className="flex items-center">
                <select
                  value={localEditingNote.categoryId}
                  onChange={(e) => setLocalEditingNote({...localEditingNote, categoryId: e.target.value})}
                  className="mr-4 border rounded px-2 py-1 bg-gray-100 text-gray-800"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button onClick={saveNote} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full mr-2 transition-colors duration-200 shadow-md">
                  Save
                </button>
                <button onClick={() => setEditingNote(null)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-colors duration-200 shadow-md">
                  Cancel
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <AIChat
                content={localEditingNote.content}
                onChange={handleLocalNoteChange}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNotes.map((note) => {
            const category = categories.find(c => c.id === note.categoryId);
            return (
              <div 
                key={note.id} 
                className={`${category?.color || 'bg-white'} p-6 rounded-lg shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl relative overflow-hidden`}
                onClick={() => handleNoteClick(note)}
              >
                <h3 className="font-bold mb-2 text-xl text-gray-800">{note.title}</h3>
                <div className="text-sm text-gray-600 line-clamp-3" dangerouslySetInnerHTML={{ __html: note.content }} />
                <div className="mt-4 text-xs text-gray-500">{category?.name}</div>
                <div className="mt-1 text-xs text-gray-400">
                  Updated: {note.updatedAt.toLocaleString()}
                </div>
                <button 
                  className="absolute bottom-2 right-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                  onClick={(e) => deleteNote(note.id, e)}
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NoteEditor;