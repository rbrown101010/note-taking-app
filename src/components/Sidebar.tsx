import React, { useState } from 'react';
import { addTopic, updateTopic, deleteTopic, signOutUser } from "../firebase";
import { Topic, Note, User } from '../types';
import { Plus, ChevronDown, ChevronUp, LogOut, User as UserIcon, Calendar } from 'lucide-react';
import TopicList from './TopicList';
import EditTopicModal from './EditTopicModal';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  topics: Topic[];
  notes: Note[];
  selectedTopic: string;
  setSelectedTopic: React.Dispatch<React.SetStateAction<string>>;
  selectedTag: string | null;
  setSelectedTag: React.Dispatch<React.SetStateAction<string | null>>;
  onVoiceRecordClick: () => void;
  onCalendarViewClick: () => void;
  user: User;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  topics,
  notes,
  selectedTopic,
  setSelectedTopic,
  selectedTag,
  setSelectedTag,
  onVoiceRecordClick,
  onCalendarViewClick,
  user,
  onSignOut
}) => {
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set(['tags']));
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const navigate = useNavigate();

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdowns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dropdownName)) {
        newSet.delete(dropdownName);
      } else {
        newSet.add(dropdownName);
      }
      return newSet;
    });
  };

  const handleAddTopic = async () => {
    const newTopic: Omit<Topic, 'id'> = {
      name: 'New Topic',
      description: '',
      color: `bg-${['red', 'blue', 'green', 'yellow', 'purple', 'pink'][Math.floor(Math.random() * 6)]}-200`,
      userId: user.id,
      isDefault: false,
      order: 0
    };
    try {
      await addTopic(newTopic, user.id);
      console.log("New topic added successfully");
    } catch (error) {
      console.error("Error adding new topic:", error);
    }
  };

  const handleEditTopic = (topic: Topic) => {
    if (topic.isDefault) return;
    setEditingTopic(topic);
    setIsEditModalOpen(true);
  };

  const handleSaveTopicEdit = async (newName: string, newDescription: string) => {
    if (editingTopic && (newName !== editingTopic.name || newDescription !== editingTopic.description)) {
      try {
        await updateTopic(editingTopic.id, { name: newName, description: newDescription }, user.id);
        console.log("Topic updated successfully");
      } catch (error) {
        console.error("Error updating topic:", error);
        alert("Failed to update topic. Please try again.");
      }
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    const topicToDelete = topics.find(t => t.id === topicId);
    if (topicToDelete?.isDefault) return;
    if (window.confirm("Are you sure you want to delete this topic?")) {
      try {
        await deleteTopic(topicId, user.id);
        console.log("Topic deleted successfully");
      } catch (error) {
        console.error("Error deleting topic:", error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      onSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  const sidebarButtonClass = "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-gray-700 text-gray-300 hover:bg-gray-600";

  return (
    <div className="w-80 bg-gray-900 p-4 flex flex-col h-screen overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-indigo-300">My Library</h2>
        <button
          onClick={handleSignOut}
          className="text-gray-400 hover:text-white"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        <button 
          onClick={() => setSelectedTopic('all')}
          className={`${sidebarButtonClass} mb-2`}
        >
          All Topics
        </button>

        <TopicList
          topics={topics}
          selectedTopic={selectedTopic}
          onEditTopic={handleEditTopic}
          onDeleteTopic={handleDeleteTopic}
          onSelectTopic={setSelectedTopic}
        />

        <button 
          onClick={handleAddTopic} 
          className={`${sidebarButtonClass} mt-2 mb-2 flex items-center`}
        >
          <Plus size={16} className="mr-2" /> Add Topic
        </button>

        <button 
          onClick={() => navigate('/profile')}
          className={`${sidebarButtonClass} mt-2 mb-2 flex items-center`}
        >
          <UserIcon size={16} className="mr-2" /> Profile
        </button>

        <button 
          onClick={onCalendarViewClick}
          className={`${sidebarButtonClass} mt-2 mb-2 flex items-center`}
        >
          <Calendar size={16} className="mr-2" /> Calendar View
        </button>

        <div className="mt-4">
          <button
            onClick={() => toggleDropdown('tags')}
            className="flex items-center justify-between w-full px-4 py-2 text-left text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75"
          >
            <span>Tags</span>
            {openDropdowns.has('tags') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {openDropdowns.has('tags') && (
            <div className="mt-2 flex flex-wrap max-h-40 overflow-auto">
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`mr-2 mb-2 px-2 py-1 text-sm rounded transition-colors duration-200 ${
                    selectedTag === tag ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                  #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <EditTopicModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveTopicEdit}
          initialName={editingTopic?.name || ''}
          initialDescription={editingTopic?.description || ''}
        />
      </div>
    );
  };

  export default Sidebar;