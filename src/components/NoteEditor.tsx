import React, { useState, useEffect } from 'react';
import { updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from '../firebase';
import { Note, Topic, User } from '../types';
import { sortNotesByDate } from '../utils';
import AIChat from './AIChat';

interface NoteEditorProps {
  notes: Note[];
  topics: Topic[];
  editingNote: Note | null;
  setEditingNote: React.Dispatch<React.SetStateAction<Note | null>>;
  selectedTopic: string;
  user: User;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ notes, topics, editingNote, setEditingNote, selectedTopic, user }) => {
  const [localEditingNote, setLocalEditingNote] = useState<Note | null>(null);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);

  useEffect(() => {
    setSortedNotes(sortNotesByDate(notes));
  }, [notes]);

  useEffect(() => {
    if (editingNote) {
      setLocalEditingNote(editingNote);
    }
  }, [editingNote]);

  const handleNoteClick = (note: Note) => {
    setEditingNote(note);
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
      await updateDoc(doc(db, `users/${user.id}/notes`, id), { ...noteWithoutId, updatedAt: new Date() });
      setEditingNote(null);
      setLocalEditingNote(null);
    }
  };

  const deleteNote = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteDoc(doc(db, `users/${user.id}/notes`, noteId));
      if (editingNote?.id === noteId) {
        setEditingNote(null);
        setLocalEditingNote(null);
      }
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-900">
      {localEditingNote ? (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl w-3/4 h-3/4 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <input
                value={localEditingNote.title}
                onChange={(e) => setLocalEditingNote({...localEditingNote, title: e.target.value})}
                className="text-2xl font-bold w-1/2 border-b-2 border-blue-500 focus:border-blue-600 outline-none px-2 py-1 bg-gray-800 text-white"
              />
              <div className="flex items-center">
                <select
                  value={localEditingNote.topicId}
                  onChange={(e) => setLocalEditingNote({...localEditingNote, topicId: e.target.value})}
                  className="mr-4 border rounded px-2 py-1 bg-gray-700 text-white"
                >
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                <button onClick={saveNote} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full mr-2 transition-colors duration-200 shadow-md">
                  Save
                </button>
                <button onClick={() => {setEditingNote(null); setLocalEditingNote(null);}} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-colors duration-200 shadow-md">
                  Cancel
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-800">
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
            const topic = topics.find(t => t.id === note.topicId);
            return (
              <div 
                key={note.id}
                className={`${topic?.color || 'bg-gray-800'} p-6 rounded-lg shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl relative overflow-hidden`}
                onClick={() => handleNoteClick(note)}
              >
                <h3 className="font-bold mb-2 text-xl text-gray-900">{note.title}</h3>
                <div className="text-sm text-gray-800 line-clamp-3" dangerouslySetInnerHTML={{ __html: note.content }} />
                <div className="mt-4 text-xs text-gray-700">{topic?.name}</div>
                <div className="mt-1 text-xs text-gray-600">
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