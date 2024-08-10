import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Edit, Trash, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Category } from '../types';

interface CategoryItemProps {
  category: Category;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubcategory: () => void;
  onSelect: () => void;
  onMove: (draggedId: string, targetId: string) => void;
  isSelected: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  depth,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddSubcategory,
  onSelect,
  onMove,
  isSelected,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'CATEGORY',
    item: { id: category.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'CATEGORY',
    drop: (item: { id: string }) => {
      if (item.id !== category.id) {
        onMove(item.id, category.id);
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-center py-1 px-2 ${
        isDragging ? 'opacity-50' : ''
      } ${isSelected ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
      style={{ marginLeft: `${depth * 16}px` }}
    >
      <button onClick={onToggleExpand} className="mr-1">
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      <span className={`w-3 h-3 rounded-full mr-2 ${category.color}`}></span>
      <span
        className={`cursor-pointer flex-grow ${
          isSelected ? 'text-white' : 'text-gray-300'
        }`}
        onClick={onSelect}
      >
        {category.name}
      </span>
      <button
        className="text-sm text-gray-500 hover:text-gray-300 mr-2"
        onClick={onEdit}
      >
        <Edit size={16} />
      </button>
      <button
        className="text-sm text-red-500 hover:text-red-300 mr-2"
        onClick={onDelete}
      >
        <Trash size={16} />
      </button>
      <button
        className="text-sm text-green-500 hover:text-green-300"
        onClick={onAddSubcategory}
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default CategoryItem;