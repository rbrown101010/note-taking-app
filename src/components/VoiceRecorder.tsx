import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Mic, StopCircle, Loader } from 'lucide-react';
import { addDoc, collection } from "firebase/firestore";
import { db } from '../firebase';
import { Category, Note } from '../types';

const BACKEND_URL = 'https://new-backend-rileybrown24.replit.app';

interface VoiceRecorderProps {
  categories: Category[];
  onNoteCreated: (note: Note) => void;
  onClose: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ categories, onNoteCreated, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        chunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please make sure you have given permission to use the microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAndSave = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      console.log('Sending audio for transcription...');
      const response = await axios.post(`${BACKEND_URL}/api/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const transcription = response.data.transcription;
      console.log('Transcription received:', transcription);

      // Find the "Voice Notes" category or create it if it doesn't exist
      let voiceNoteCategory = categories.find(c => c.name === "Voice Notes");
      if (!voiceNoteCategory) {
        const newCategoryRef = await addDoc(collection(db, "categories"), {
          name: "Voice Notes",
          color: "bg-purple-200",
        });
        voiceNoteCategory = { id: newCategoryRef.id, name: "Voice Notes", color: "bg-purple-200" };
      }

      // Create the new note
      const newNote: Omit<Note, 'id'> = {
        title: `Voice Note ${new Date().toLocaleString()}`,
        content: transcription,
        categoryId: voiceNoteCategory.id,
        tags: ["voice"],
        completed: false,
        isVoiceNote: true,
      };

      // Save the transcribed note
      const docRef = await addDoc(collection(db, "notes"), newNote);
      const savedNote = { id: docRef.id, ...newNote } as Note;

      // Notify parent component about the new note
      onNoteCreated(savedNote);

      // Clear the audio blob
      setAudioBlob(null);
      onClose();
    } catch (error) {
      console.error('Error transcribing and saving note:', error);
      alert('Failed to transcribe and save note. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-2">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center"
            disabled={isTranscribing}
          >
            <Mic className="mr-2" /> Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full flex items-center"
          >
            <StopCircle className="mr-2" /> Stop Recording
          </button>
        )}
        {audioBlob && !isTranscribing && (
          <button
            onClick={transcribeAndSave}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full"
          >
            Save Voice Note
          </button>
        )}
        <button
          onClick={onClose}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-full"
          disabled={isTranscribing}
        >
          Cancel
        </button>
      </div>
      {isTranscribing && (
        <div className="flex items-center space-x-2 text-blue-600">
          <Loader className="animate-spin" />
          <span>Transcribing...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;