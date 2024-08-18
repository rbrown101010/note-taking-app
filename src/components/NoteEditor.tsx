import React, { useState, useEffect } from 'react';
import { updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from '../firebase';
import { Note, Topic, User } from '../types';
import { sortNotesByDate } from '../utils';
import AIChat from './AIChat';
import NoteView from './NoteView';
import { Edit, Trash2, PinIcon, ArchiveIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NoteEditorProps {
  notes: Note[];
  pinnedNotes: Note[];
  topics: Topic[];
  editingNote: Note | null;
  setEditingNote: React.Dispatch<React.SetStateAction<Note | null>>;
  selectedTopic: string;
  user: User;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ notes, pinnedNotes, topics, editingNote, setEditingNote, selectedTopic, user }) => {
  const [localEditingNote, setLocalEditingNote] = useState<Note | null>(null);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);
  const [sortedPinnedNotes, setSortedPinnedNotes] = useState<Note[]>([]);
  const [sortedArchivedNotes, setSortedArchivedNotes] = useState<Note[]>([]);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  useEffect(() => {
    setSortedNotes(sortNotesByDate(notes.filter(note => !note.pinned && !note.archived)));
    setSortedPinnedNotes(sortNotesByDate(pinnedNotes));
    setSortedArchivedNotes(sortNotesByDate(notes.filter(note => note.archived)));
  }, [notes, pinnedNotes]);

  useEffect(() => {
    if (editingNote) {
      setLocalEditingNote(editingNote);
      setViewingNote(null);
    }
  }, [editingNote]);

  const handleNoteClick = (note: Note) => {
    setViewingNote(note);
    setEditingNote(null);
  };

  const handleEditClick = (note: Note, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingNote(note);
    setViewingNote(null);
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
      if (viewingNote?.id === noteId) {
        setViewingNote(null);
      }
    }
  };

  const togglePinNote = async (note: Note, event: React.MouseEvent) => {
    event.stopPropagation();
    const updatedNote = { ...note, pinned: !note.pinned, archived: false };
    await updateDoc(doc(db, `users/${user.id}/notes`, note.id), { pinned: updatedNote.pinned, archived: false });
  };

  const toggleArchiveNote = async (note: Note, event: React.MouseEvent) => {
    event.stopPropagation();
    const updatedNote = { ...note, archived: !note.archived, pinned: false };
    await updateDoc(doc(db, `users/${user.id}/notes`, note.id), { archived: updatedNote.archived, pinned: false });
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const renderPlainText = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const renderNoteCard = (note: Note, isPinned: boolean = false, isArchived: boolean = false, isTopOfTopic: boolean = false) => {
    const topic = topics.find(t => t.id === note.topicId);
    return (
      <div 
        key={note.id}
        className={`${topic?.color || 'bg-gray-800'} rounded-lg shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl relative overflow-hidden ${isArchived ? 'opacity-75' : ''} ${isTopOfTopic ? 'h-32' : 'h-64'} flex flex-col group`}
        onClick={() => handleNoteClick(note)}
      >
        <div className="p-4 flex-grow flex flex-col">
          <h3 className={`font-bold mb-2 text-lg text-gray-900 ${isTopOfTopic ? 'line-clamp-2' : 'truncate'}`}>{note.title}</h3>
          {!isTopOfTopic && (
            <>
              <hr className="border-gray-600 my-2" />
              <div className="text-sm text-gray-800 flex-grow overflow-hidden">
                {renderPlainText(note.content).split(' ').slice(0, 20).join(' ')}
                {renderPlainText(note.content).split(' ').length > 20 ? '...' : ''}
              </div>
            </>
          )}
        </div>
        <hr className="border-gray-600" />
        <div className="p-2 text-xs text-gray-600 flex justify-between items-center">
          <span>{formatDate(note.updatedAt)}</span>
          <span>{topic?.name}</span>
        </div>
        <div className="absolute top-2 right-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button 
            className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
            onClick={(e) => handleEditClick(note, e)}
          >
            <Edit size={16} />
          </button>
          <button 
            className="text-red-500 hover:text-red-700 transition-colors duration-200"
            onClick={(e) => deleteNote(note.id, e)}
          >
            <Trash2 size={16} />
          </button>
          <button 
            className={`${isPinned ? 'text-yellow-500' : 'text-gray-500'} hover:text-yellow-700 transition-colors duration-200`}
            onClick={(e) => togglePinNote(note, e)}
          >
            <PinIcon size={16} />
          </button>
          <button 
            className={`${isArchived ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-700 transition-colors duration-200`}
            onClick={(e) => toggleArchiveNote(note, e)}
          >
            <ArchiveIcon size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900">
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
      ) : viewingNote ? (
        <NoteView
          note={viewingNote}
          onClose={() => setViewingNote(null)}
          onEdit={() => {
            setEditingNote(viewingNote);
            setViewingNote(null);
          }}
          topic={topics.find(t => t.id === viewingNote.topicId)}
          user={user}
        />
      ) : (
        <>
          {sortedPinnedNotes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">Top of Topic</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {sortedPinnedNotes.map(note => renderNoteCard(note, true, false, true))}
              </div>
            </div>
          )}
          <h2 className="text-2xl font-bold mb-4 text-white">Notes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {sortedNotes.map(note => renderNoteCard(note))}
          </div>
          {sortedArchivedNotes.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4 text-white">Archived Notes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {sortedArchivedNotes.map(note => renderNoteCard(note, false, true))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NoteEditor;