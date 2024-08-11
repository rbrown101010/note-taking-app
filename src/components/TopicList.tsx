import React from 'react';
import { Topic } from '../types';
import { Edit, Trash } from 'lucide-react';

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
  return (
    <div
      className={`flex items-center py-1 px-2 ${
        isSelected ? 'bg-indigo-600' : 'hover:bg-gray-700'
      }`}
    >
      <span className={`w-3 h-3 rounded-full mr-2 ${topic.color}`}></span>
      <span
        className={`cursor-pointer flex-grow ${
          isSelected ? 'text-white' : 'text-gray-300'
        }`}
        onClick={onSelect}
      >
        {topic.name}
      </span>
      {!topic.isDefault && (
        <>
          <button
            className="text-sm text-gray-500 hover:text-gray-300 mr-2"
            onClick={onEdit}
          >
            <Edit size={16} />
          </button>
          <button
            className="text-sm text-red-500 hover:text-red-300"
            onClick={onDelete}
          >
            <Trash size={16} />
          </button>
        </>
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
    if (a.isDefault) return 1;
    if (b.isDefault) return -1;
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