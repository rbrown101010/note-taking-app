import React, { useState, useEffect } from 'react';
import { Note, Topic, User } from '../types';
import { X, Edit, Image, Film, X as XIcon } from 'lucide-react';
import { uploadMedia, updateNoteMedia, deleteMedia, updateNote } from '../firebase';

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

  useEffect(() => {
    console.log("NoteView rendered with user:", user);
    console.log("NoteView rendered with note:", note);
  }, [user, note]);

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          if (!user || !user.id) {
            throw new Error("User ID is undefined");
          }
          if (!note || !note.id) {
            throw new Error("Note ID is undefined");
          }
          const mediaUrl = await uploadMedia(user.id, note.id, file);
          const updatedMedia = [...media, mediaUrl];
          setMedia(updatedMedia);
          await updateNoteMedia(user.id, note.id, updatedMedia);
          await updateNote(note.id, { media: updatedMedia }, user.id);
        } catch (error) {
          console.error("Error uploading media:", error);
          setError(`Failed to upload media: ${error.message}`);
        }
      }
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

      // Extract the file name from the URL
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
      setError(`Failed to delete media: ${error.message}`);
    }
  };

  const isVideo = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  // ... (rest of the component remains unchanged)

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
              <div>Updated: {note.updatedAt.toLocaleString()}</div>
              <div>Tags: {note.tags.map(tag => `#${tag}`).join(', ') || 'No tags'}</div>
            </div>
            <div className="flex">
              <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2">
                <Image size={16} className="inline mr-2" />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMediaUpload}
                  className="hidden"
                />
              </label>
              <label className="cursor-pointer bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                <Film size={16} className="inline mr-2" />
                Upload Video
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleMediaUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex flex-wrap mt-2">
            {media.map((item, index) => (
              <div key={index} className="relative m-1">
                {isVideo(item) ? (
                  <video
                    src={item}
                    className="w-24 h-24 object-cover rounded cursor-pointer"
                    onClick={() => setSelectedMedia(item)}
                  />
                ) : (
                  <img
                    src={item}
                    alt={`Note media ${index + 1}`}
                    className="w-24 h-24 object-cover rounded cursor-pointer"
                    onClick={() => setSelectedMedia(item)}
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
              src={selectedMedia}
              controls
              className="max-w-full max-h-full object-contain"
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
