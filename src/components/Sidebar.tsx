import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { addDoc, updateDoc, deleteDoc, doc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { Category, Note } from '../types';
import { organizeCategories } from '../utils';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import CategoryList from './CategoryList';

interface SidebarProps {
  categories: Category[];
  notes: Note[];
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  selectedTag: string | null;
  setSelectedTag: React.Dispatch<React.SetStateAction<string | null>>;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  notes,
  selectedCategory,
  setSelectedCategory,
  selectedTag,
  setSelectedTag,
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

  const addNewFolder = async () => {
    const newCategory: Omit<Category, 'id'> = {
      name: 'New Folder',
      color: `bg-${['red', 'blue', 'green', 'yellow', 'purple', 'pink'][Math.floor(Math.random() * 6)]}-200`,
      parentId: null,
    };
    await addDoc(collection(db, "categories"), newCategory);
  };

  const editCategory = async (category: Category) => {
    const newName = prompt("Enter new folder name", category.name);
    if (newName && newName !== category.name) {
      await updateDoc(doc(db, "categories", category.id), { name: newName });
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this folder? All notes in this folder will be moved to 'Uncategorized'.")) {
      await deleteDoc(doc(db, "categories", categoryId));

      const uncategorizedCategory = categories.find(c => c.name === 'Uncategorized');
      if (!uncategorizedCategory) {
        const newCategory: Omit<Category, 'id'> = {
          name: 'Uncategorized',
          color: 'bg-gray-200',
          parentId: null,
        };
        const docRef = await addDoc(collection(db, "categories"), newCategory);
        const uncategorizedId = docRef.id;

        notes.forEach(async (note) => {
          if (note.categoryId === categoryId) {
            await updateDoc(doc(db, "notes", note.id), { categoryId: uncategorizedId });
          }
        });
      } else {
        notes.forEach(async (note) => {
          if (note.categoryId === categoryId) {
            await updateDoc(doc(db, "notes", note.id), { categoryId: uncategorizedCategory.id });
          }
        });
      }
    }
  };

  const moveCategory = async (draggedId: string, targetId: string) => {
    await updateDoc(doc(db, "categories", draggedId), { parentId: targetId });
  };

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-64 bg-gray-900 p-4 border-r border-gray-700 flex flex-col h-full">
        <h2 className="text-xl font-bold mb-4 text-indigo-300">My Library</h2>

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
            onEditCategory={editCategory}
            onDeleteCategory={deleteCategory}
            onAddSubcategory={addNewFolder}
            onSelectCategory={setSelectedCategory}
            onMoveCategory={moveCategory}
          />

          <button 
            onClick={addNewFolder} 
            className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded transition-colors duration-200 flex items-center justify-center"
          >
            <Plus size={16} className="mr-2" /> Add Folder
          </button>
        </div>

        <div className="mt-auto">
          {/* Tags Dropdown */}
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