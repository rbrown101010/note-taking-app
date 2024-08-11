import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { StopCircle, Loader, X } from 'lucide-react';
import { addVoiceNote } from '../firebase';
import { Topic, Note } from '../types';

const BACKEND_URL = 'https://new-backend-rileybrown24.replit.app';

interface VoiceRecorderProps {
  topics: Topic[];
  onNoteCreated: (note: Note) => void;
  onClose: () => void;
  userId: string;
  autoStart: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ topics, onNoteCreated, onClose, userId, autoStart }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (autoStart) {
      startRecording();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoStart]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        chunksRef.current = [];
        transcribeAndSave(blob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      startWaveAnimation();
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please make sure you have given permission to use the microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const transcribeAndSave = async (blob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const transcription = response.data.transcription;

      let voiceNoteTopic = topics.find(t => t.name === "Voice Notes");
      if (!voiceNoteTopic) {
        throw new Error("Voice Notes topic not found");
      }

      const newNote: Omit<Note, 'id'> = {
        title: `Voice Note ${new Date().toLocaleString()}`,
        content: transcription,
        topicId: voiceNoteTopic.id,
        tags: ["voice"],
        completed: false,
        isVoiceNote: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId
      };

      const savedNote = await addVoiceNote(newNote, userId);

      onNoteCreated(savedNote);
      onClose();
    } catch (error) {
      console.error('Error transcribing and saving note:', error);
      setError('Failed to transcribe and save note. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startWaveAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();

      for (let i = 0; i < width; i++) {
        const y = height / 2 + Math.sin(i * 0.05 + Date.now() * 0.01) * 20;
        ctx.lineTo(i, y);
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
      <div className="relative flex flex-col items-center space-y-4 p-8 bg-blue-600 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-white">Voice Recorder</h2>
        <div className="flex items-center space-x-2">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="bg-white hover:bg-gray-100 text-blue-600 px-4 py-2 rounded-full flex items-center"
            >
              <StopCircle className="mr-2" /> Stop Recording
            </button>
          ) : (
            <button
              onClick={onClose}
              className="bg-white hover:bg-gray-100 text-blue-600 px-4 py-2 rounded-full flex items-center"
              disabled={isTranscribing}
            >
              <X className="mr-2" /> Cancel
            </button>
          )}
        </div>
        {isRecording && (
          <div className="text-lg font-semibold text-white">
            Recording: {formatTime(recordingTime)}
          </div>
        )}
        {isTranscribing && (
          <div className="flex items-center space-x-2 text-white">
            <Loader className="animate-spin" />
            <span>Transcribing...</span>
          </div>
        )}
        {error && (
          <div className="text-red-200 mt-2">{error}</div>
        )}
        <canvas
          ref={canvasRef}
          width={300}
          height={100}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default VoiceRecorder;