import React, { useState } from 'react';
import { Topic } from '../types';
import { Edit, Trash, ChevronDown, ChevronUp } from 'lucide-react';

interface TopicItemProps {
  topic: Topic;
  isSelected: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

const TopicItem: React.FC<TopicItemProps> = ({
  topic,
  isSelected,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`mb-2 rounded-lg overflow-hidden ${isSelected ? 'bg-indigo-600' : 'bg-gray-800'}`}>
      <div
        className={`flex items-center py-2 px-3 cursor-pointer ${
          isSelected ? 'text-white' : 'text-gray-300 hover:bg-gray-700'
        }`}
        onClick={onSelect}
      >
        <span className={`w-3 h-3 rounded-full mr-2 ${topic.color}`}></span>
        <span className="flex-grow text-sm">{topic.name}</span>
        <button
          className="text-gray-500 hover:text-gray-300 mr-2"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {!topic.isDefault && (
          <>
            <button
              className="text-gray-500 hover:text-gray-300 mr-2"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit size={16} />
            </button>
            <button
              className="text-red-500 hover:text-red-300"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash size={16} />
            </button>
          </>
        )}
      </div>
      {isExpanded && (
        <div className="px-3 py-2 text-xs text-gray-400 bg-gray-800">
          {topic.description || 'No description'}
        </div>
      )}
    </div>
  );
};

interface TopicListProps {
  topics: Topic[];
  selectedTopic: string;
  onEditTopic: (topic: Topic) => void;
  onDeleteTopic: (topicId: string) => void;
  onSelectTopic: (topicId: string) => void;
}

const TopicList: React.FC<TopicListProps> = ({
  topics,
  selectedTopic,
  onEditTopic,
  onDeleteTopic,
  onSelectTopic,
}) => {
  const sortedTopics = [...topics].sort((a, b) => {
    if (a.isDefault && b.isDefault) return a.order - b.order;
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="mt-2">
      {sortedTopics.map((topic) => (
        <TopicItem
          key={topic.id}
          topic={topic}
          isSelected={selectedTopic === topic.id}
          onEdit={() => onEditTopic(topic)}
          onDelete={() => onDeleteTopic(topic.id)}
          onSelect={() => onSelectTopic(topic.id)}
        />
      ))}
    </div>
  );
};

export default TopicList;