import React, { useState, useEffect } from 'react';

interface EditTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string, newDescription: string) => void;
  initialName: string;
  initialDescription: string;
}

const EditTopicModal: React.FC<EditTopicModalProps> = ({ isOpen, onClose, onSave, initialName, initialDescription }) => {
  const [newName, setNewName] = useState(initialName);
  const [newDescription, setNewDescription] = useState(initialDescription);

  useEffect(() => {
    setNewName(initialName);
    setNewDescription(initialDescription);
  }, [initialName, initialDescription]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4 text-white">Edit Topic</h2>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
          placeholder="Enter topic name"
        />
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded h-24 resize-none"
          placeholder="Enter topic description"
        />
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="mr-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(newName, newDescription);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTopicModal;