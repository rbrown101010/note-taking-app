// src/components/FolderNotes.tsx

import React, { useState } from 'react';
import { Note, Folder, FolderNotesProps } from '../types';
import { addDoc, updateDoc, deleteDoc, collection, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Edit, Trash2, Star } from 'lucide-react';

const FolderNotes: React.FC<FolderNotesProps> = ({ folder, notes, userId }) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const handleAddNote = async () => {
    if (newNoteTitle && folder) {
      try {
        const newNote: Omit<Note, 'id'> = {
          title: newNoteTitle,
          content: '',
          folderId: folder.id,
          userId: userId,
          isSupernote: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: []
        };
        await addDoc(collection(db, `users/${userId}/notes`), newNote);
        setIsAddingNote(false);
        setNewNoteTitle('');
      } catch (error) {
        console.error("Error adding new note:", error);
      }
    }
  };

  const handleUpdateNote = async (updatedNote: Note) => {
    try {
      await updateDoc(doc(db, `users/${userId}/notes`, updatedNote.id), updatedNote);
      setEditingNote(null);
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteDoc(doc(db, `users/${userId}/notes`, noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
        if (editingNote?.id === noteId) {
          setEditingNote(null);
        }
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }
  };

  const toggleSupernote = async (note: Note) => {
    try {
      const updatedNote = { ...note, isSupernote: !note.isSupernote };
      await updateDoc(doc(db, `users/${userId}/notes`, note.id), updatedNote);
    } catch (error) {
      console.error("Error toggling supernote:", error);
    }
  };

  if (!folder) {
    return <div className="p-4">Please select a folder</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{folder.name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map(note => (
          <div 
            key={note.id} 
            className={`p-4 border rounded cursor-pointer ${
              note.isSupernote ? 'bg-yellow-100' : 'bg-white'
            }`}
            onClick={() => setSelectedNote(note)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">{note.title}</h3>
              <div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSupernote(note);
                  }}
                  className="mr-2 text-yellow-500 hover:text-yellow-600"
                >
                  <Star size={16} fill={note.isSupernote ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingNote(note);
                  }}
                  className="mr-2 text-blue-500 hover:text-blue-600"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">{note.updatedAt.toLocaleString()}</p>
          </div>
        ))}
      </div>
      {isAddingNote ? (
        <div className="mt-4">
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="New note title"
            className="px-2 py-1 border rounded mr-2"
          />
          <button
            onClick={handleAddNote}
            className="px-4 py-1 bg-green-500 text-white rounded mr-2"
          >
            Add Note
          </button>
          <button
            onClick={() => {
              setIsAddingNote(false);
              setNewNoteTitle('');
            }}
            className="px-4 py-1 bg-red-500 text-white rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingNote(true)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded flex items-center"
        >
          <Plus size={16} className="mr-2" /> Add New Note
        </button>
      )}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-2">{selectedNote.title}</h3>
            <p className="mb-4">{selectedNote.content}</p>
            <button
              onClick={() => setSelectedNote(null)}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded w-full max-w-2xl">
            <input
              type="text"
              value={editingNote.title}
              onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
              className="w-full px-2 py-1 border rounded mb-2"
            />
            <textarea
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              className="w-full h-64 px-2 py-1 border rounded mb-2"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleUpdateNote(editingNote)}
                className="px-4 py-2 bg-green-500 text-white rounded mr-2"
              >
                Save
              </button>
              <button
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderNotes;