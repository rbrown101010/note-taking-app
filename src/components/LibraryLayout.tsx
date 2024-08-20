import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "./Sidebar";
import NoteEditor from "./NoteEditor";
import VoiceRecorder from './VoiceRecorder';
import CalendarView from './CalendarView';
import { Topic, Note, User } from '../types';
import { Mic, Plus } from 'lucide-react';

interface LibraryLayoutProps {
  user: User;
  onSignOut: () => void;
}

const LibraryLayout: React.FC<LibraryLayoutProps> = ({ user, onSignOut }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [isCalendarViewOpen, setIsCalendarViewOpen] = useState(false);

  useEffect(() => {
    console.log("LibraryLayout component mounted");
    const topicsQuery = query(collection(db, `users/${user.id}/topics`));
    const notesQuery = query(collection(db, `users/${user.id}/notes`));
    const pinnedNotesQuery = query(collection(db, `users/${user.id}/notes`), where("pinned", "==", true));

    const unsubscribeTopics = onSnapshot(topicsQuery, (snapshot) => {
      const topicsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data()
      } as Topic));
      setTopics(topicsData);
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

    const unsubscribePinnedNotes = onSnapshot(pinnedNotesQuery, (snapshot) => {
      const pinnedNotesData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Note));
      setPinnedNotes(pinnedNotesData);
    });

    return () => {
      unsubscribeTopics();
      unsubscribeNotes();
      unsubscribePinnedNotes();
    };
  }, [user.id]);

  const handleVoiceRecordClick = () => {
    setIsVoiceRecorderOpen(true);
  };

  const handleCalendarViewClick = () => {
    setIsCalendarViewOpen(!isCalendarViewOpen);
  };

  const handleNoteCreated = (newNote: Note) => {
    setNotes(prevNotes => {
      const existingNoteIndex = prevNotes.findIndex(note => note.id === newNote.id);
      if (existingNoteIndex !== -1) {
        const updatedNotes = [...prevNotes];
        updatedNotes[existingNoteIndex] = newNote;
        return updatedNotes;
      } else {
        return [...prevNotes, newNote];
      }
    });
    setIsVoiceRecorderOpen(false);
  };

  const handleNewNoteClick = async () => {
    let topicId: string;
    if (selectedTopic === 'all') {
      const defaultTopic = topics.find(topic => topic.name === "No Topic");
      topicId = defaultTopic ? defaultTopic.id : '';
    } else {
      topicId = selectedTopic;
    }

    const newNote: Omit<Note, 'id'> = {
      title: 'New Note',
      content: '',
      topicId: topicId,
      tags: [],
      completed: false,
      pinned: false,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id
    };

    try {
      const docRef = await addDoc(collection(db, `users/${user.id}/notes`), newNote);
      const createdNote: Note = { id: docRef.id, ...newNote };
      setEditingNote(createdNote);
    } catch (error) {
      console.error("Error adding new note:", error);
    }
  };

  const selectedTopicData = topics.find(topic => topic.id === selectedTopic) || 
                            { name: "All Topics", description: "View all your notes across topics.", color: "bg-gray-600" };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      <Sidebar
        topics={topics}
        notes={notes}
        selectedTopic={selectedTopic}
        setSelectedTopic={setSelectedTopic}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        onVoiceRecordClick={handleVoiceRecordClick}
        onCalendarViewClick={handleCalendarViewClick}
        user={user}
        onSignOut={onSignOut}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-gray-800 p-6 shadow-md">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">{selectedTopicData.name}</h2>
            <p className="text-lg text-gray-300 mb-4">{selectedTopicData.description}</p>
            <div className={`h-1 ${selectedTopicData.color} w-full mb-4`}></div>
            <div className="flex space-x-4">
              <button 
                onClick={handleNewNoteClick}
                className="bg-white text-blue-600 px-4 py-2 rounded-full transition-colors duration-200 shadow-md text-sm flex items-center"
              >
                <Plus size={16} className="mr-2" /> New Note
              </button>
              <button 
                onClick={handleVoiceRecordClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center transition-colors duration-200 shadow-md text-sm"
              >
                <Mic size={16} className="mr-2" /> Record
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-900">
          {isVoiceRecorderOpen && (
            <VoiceRecorder 
              topics={topics} 
              onNoteCreated={handleNoteCreated} 
              onClose={() => setIsVoiceRecorderOpen(false)}
              userId={user.id}
              autoStart={true}
            />
          )}
          {isCalendarViewOpen ? (
            <CalendarView user={user} notes={notes} />
          ) : (
            <div className="max-w-7xl mx-auto px-6 py-8">
              <NoteEditor
                notes={notes.filter(note => selectedTopic === 'all' || note.topicId === selectedTopic)
                           .filter(note => !selectedTag || note.tags.includes(selectedTag))}
                pinnedNotes={pinnedNotes.filter(note => selectedTopic === 'all' || note.topicId === selectedTopic)
                                       .filter(note => !selectedTag || note.tags.includes(selectedTag))}
                topics={topics}
                editingNote={editingNote}
                setEditingNote={setEditingNote}
                selectedTopic={selectedTopic}
                user={user}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryLayout;