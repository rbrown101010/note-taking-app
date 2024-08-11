import React, { useState, useEffect } from 'react';

interface EditTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  initialName: string;
}

const EditTopicModal: React.FC<EditTopicModalProps> = ({ isOpen, onClose, onSave, initialName }) => {
  const [newName, setNewName] = useState(initialName);

  useEffect(() => {
    setNewName(initialName);
  }, [initialName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-white">Edit Topic Name</h2>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
          placeholder="Enter new topic name"
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
              onSave(newName);
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