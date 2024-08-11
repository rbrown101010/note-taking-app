import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { addCategory, updateCategory, deleteCategory, signOutUser } from "../firebase";
import { Category, Note, User } from '../types';
import { organizeCategories } from '../utils';
import { Plus, ChevronDown, ChevronUp, Mic, LogOut } from 'lucide-react';
import CategoryList from './CategoryList';

interface SidebarProps {
  categories: Category[];
  notes: Note[];
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  selectedTag: string | null;
  setSelectedTag: React.Dispatch<React.SetStateAction<string | null>>;
  onVoiceRecordClick: () => void;
  user: User;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  notes,
  selectedCategory,
  setSelectedCategory,
  selectedTag,
  setSelectedTag,
  onVoiceRecordClick,
  user,
  onSignOut
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [organizedCategories, setOrganizedCategories] = useState<Category[]>([]);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set(['tags']));

  useEffect(() => {
    setOrganizedCategories(organizeCategories(categories));
  }, [categories]);

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

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddFolder = async () => {
    const newCategory: Omit<Category, 'id'> = {
      name: 'New Folder',
      color: `bg-${['red', 'blue', 'green', 'yellow', 'purple', 'pink'][Math.floor(Math.random() * 6)]}-200`,
      parentId: null,
      userId: user.id
    };
    try {
      await addCategory(newCategory, user.id);
      console.log("New category added successfully");
    } catch (error) {
      console.error("Error adding new category:", error);
    }
  };

  const handleEditCategory = async (category: Category) => {
    const newName = prompt("Enter new folder name", category.name);
    if (newName && newName !== category.name) {
      try {
        await updateCategory(category.id, { ...category, name: newName }, user.id);
        console.log("Category updated successfully");
      } catch (error) {
        console.error("Error updating category:", error);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this folder?")) {
      try {
        await deleteCategory(categoryId, user.id);
        console.log("Category deleted successfully");
      } catch (error) {
        console.error("Error deleting category:", error);
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-64 bg-gray-900 p-4 border-r border-gray-700 flex flex-col h-full">
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

        <div className="flex-grow overflow-auto mb-4">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`w-full mb-4 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
              selectedCategory === 'all' 
                ? 'bg-indigo-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Categories
          </button>

          <CategoryList
            categories={organizedCategories}
            expandedCategories={expandedCategories}
            selectedCategory={selectedCategory}
            onToggleExpand={toggleCategoryExpansion}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddSubcategory={handleAddFolder}
            onSelectCategory={setSelectedCategory}
            onMoveCategory={() => {}}
          />

          <button 
            onClick={handleAddFolder} 
            className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded transition-colors duration-200 flex items-center justify-center"
          >
            <Plus size={16} className="mr-2" /> Add Folder
          </button>

          <button
            onClick={onVoiceRecordClick}
            className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors duration-200 flex items-center justify-center"
          >
            <Mic size={16} className="mr-2" /> Record Voice Note
          </button>
        </div>

        <div className="mt-auto">
          <div>
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
      </div>
    </DndProvider>
  );
};

export default Sidebar;