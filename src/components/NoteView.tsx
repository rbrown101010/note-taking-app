import React, { useState, useEffect, useRef } from 'react';
import { Note, Topic, User } from '../types';
import { X, Edit, Image, Film, X as XIcon, Calendar, Check, Maximize } from 'lucide-react';
import { uploadMedia, updateNoteMedia, deleteMedia, updateNote, addCalendarEvent } from '../firebase';
import { Timestamp } from 'firebase/firestore';
import moment from 'moment-timezone';

interface NoteViewProps {
  note: Note;
  onClose: () => void;
  onEdit: () => void;
  topic: Topic | undefined;
  user: User;
}

const NoteView: React.FC<NoteViewProps> = ({ note, onClose, onEdit, topic, user }) => {
  const [media, setMedia] = useState<string[]>(note.media || []);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState<string>('');
  const [isDateAdded, setIsDateAdded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (note.eventDate) {
      try {
        let date: moment.Moment;
        if (note.eventDate instanceof Timestamp) {
          date = moment(note.eventDate.toDate());
        } else if (note.eventDate instanceof Date) {
          date = moment(note.eventDate);
        } else {
          date = moment(note.eventDate);
        }

        if (date.isValid()) {
          const centralTime = date.tz('America/Chicago');
          setEventDate(centralTime.format('YYYY-MM-DD'));
          setIsDateAdded(true);
        } else {
          console.error('Invalid date stored in note:', note.eventDate);
          setError('Invalid date stored in note. Please select a new date.');
        }
      } catch (error) {
        console.error('Error parsing stored date:', error);
        setError('Error parsing stored date. Please select a new date.');
      }
    }
  }, [note.eventDate]);

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setIsUploading(true);
      setError(null);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          console.log("Starting media upload for file:", file.name);

          if (!user || !user.id) {
            throw new Error("User ID is undefined");
          }
          if (!note || !note.id) {
            throw new Error("Note ID is undefined");
          }

          console.log("Calling uploadMedia function with params:", user.id, note.id, file);
          const mediaUrl = await uploadMedia(user.id, note.id, file);
          console.log("Media uploaded successfully, URL:", mediaUrl);

          const updatedMedia = [...media, mediaUrl];
          setMedia(updatedMedia);

          console.log("Updating note media...");
          await updateNoteMedia(user.id, note.id, updatedMedia);
          console.log("Note media updated successfully");

          console.log("Updating note...");
          await updateNote(note.id, { media: updatedMedia }, user.id);
          console.log("Note updated successfully");

        } catch (error) {
          console.error("Detailed error in handleMediaUpload:", error);
          if (error instanceof Error) {
            setError(`Error uploading media: ${error.message}`);
          } else {
            setError('An unknown error occurred during upload');
          }
        }
      }
      setIsUploading(false);
    }
  };

  const handleMediaDelete = async (mediaUrl: string) => {
    try {
      if (!user || !user.id) {
        throw new Error("User ID is undefined");
      }
      if (!note || !note.id) {
        throw new Error("Note ID is undefined");
      }

      const fileName = mediaUrl.split('/').pop()?.split('?')[0];

      if (fileName) {
        await deleteMedia(user.id, note.id, fileName);
        const updatedMedia = media.filter(item => item !== mediaUrl);
        setMedia(updatedMedia);
        await updateNoteMedia(user.id, note.id, updatedMedia);
        await updateNote(note.id, { media: updatedMedia }, user.id);
      }
    } catch (error) {
      console.error("Error deleting media:", error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred during deletion');
    }
  };

  const isVideo = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  const handleAddToCalendar = async () => {
    if (!eventDate) {
      setError("Please select a date for the event");
      return;
    }

    try {
      const centralDate = moment.tz(eventDate, 'America/Chicago').startOf('day');

      if (!centralDate.isValid()) {
        throw new Error("Invalid date selected");
      }

      const timestamp = Timestamp.fromDate(centralDate.toDate());
      await updateNote(note.id, { eventDate: timestamp }, user.id);
      await addCalendarEvent(user.id, {
        id: note.id,
        title: note.title,
        start: centralDate.toDate(),
        end: centralDate.toDate(),
        noteId: note.id,
      });
      setIsDateAdded(true);
      setError(null);
      console.log("Note added to calendar successfully");
    } catch (error) {
      console.error("Error adding note to calendar:", error);
      setError("Failed to add note to calendar. Please try again.");
    }
  };

  const handleFullscreenMedia = (mediaUrl: string) => {
    setSelectedMedia(mediaUrl);
  };

  return (
    <div className={`fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4`}>
      <div className={`${topic?.color || 'bg-gray-800'} rounded-lg shadow-2xl w-3/4 h-3/4 flex flex-col overflow-hidden`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900">{note.title}</h2>
          <div className="flex items-center">
            <button onClick={onEdit} className="mr-2 text-blue-600 hover:text-blue-800">
              <Edit size={20} />
            </button>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="text-gray-800" dangerouslySetInnerHTML={{ __html: note.content }} />
        </div>
        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">
              <div>Topic: {topic?.name || 'No Topic'}</div>
              <div>Updated: {note.updatedAt instanceof Date ? note.updatedAt.toLocaleString() : 'Unknown'}</div>
              <div>Tags: {note.tags.map(tag => `#${tag}`).join(', ') || 'No tags'}</div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={eventDate}
                onChange={(e) => {
                  setEventDate(e.target.value);
                  setIsDateAdded(false);
                }}
                className="bg-gray-700 text-white px-3 py-2 rounded"
              />
              <button
                onClick={handleAddToCalendar}
                className={`${
                  isDateAdded ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
                } text-white px-3 py-2 rounded flex items-center`}
                disabled={isDateAdded}
              >
                {isDateAdded ? <Check size={16} /> : <Calendar size={16} />}
              </button>
            </div>
          </div>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {isUploading && <div className="text-blue-500 mb-2">Uploading media...</div>}
          <div className="flex space-x-2">
            <label className="cursor-pointer bg-gray-500 hover:bg-gray-600 text-black border border-black px-3 py-2 rounded flex items-center">
              <Image size={16} />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMediaUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            <label className="cursor-pointer bg-gray-500 hover:bg-gray-600 text-black border border-black px-3 py-2 rounded flex items-center">
              <Film size={16} />
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleMediaUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
          <div className="flex flex-wrap mt-2">
            {media.map((item, index) => (
              <div key={index} className="relative m-1">
                {isVideo(item) ? (
                  <div className="relative">
                    <video
                      src={item}
                      className="w-24 h-24 object-cover rounded cursor-pointer"
                      onClick={() => handleFullscreenMedia(item)}
                    />
                    <button
                      onClick={() => handleFullscreenMedia(item)}
                      className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white rounded p-1"
                    >
                      <Maximize size={12} />
                    </button>
                  </div>
                ) : (
                  <img
                    src={item}
                    alt={`Note media ${index + 1}`}
                    className="w-24 h-24 object-cover rounded cursor-pointer"
                    onClick={() => handleFullscreenMedia(item)}
                  />
                )}
                <button
                  onClick={() => handleMediaDelete(item)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  <XIcon size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedMedia(null)}
        >
          {isVideo(selectedMedia) ? (
            <video
              ref={videoRef}
              src={selectedMedia}
              controls
              className="max-w-full max-h-full object-contain"
              autoPlay
            />
          ) : (
            <img
              src={selectedMedia}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default NoteView;