import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import { db } from './firebase';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  completed?: boolean;
  tags: string[];
  [key: string]: any;
}

const LibraryLayout: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryNameEdit, setCategoryNameEdit] = useState<string>('');
  const [localEditingNote, setLocalEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    const categoriesQuery = query(collection(db, "categories"));
    const notesQuery = query(collection(db, "notes"));

    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(categoriesData);
    });

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      setNotes(notesData);
    });

    return () => {
      unsubscribeCategories();
      unsubscribeNotes();
    };
  }, []);

  const filteredNotes = notes
    .filter(note => selectedCategory === 'all' || note.categoryId === selectedCategory)
    .filter(note => !selectedTag || note.tags.includes(selectedTag));

  const upcomingNotes = notes.filter(note => {
    const dateMatch = note.content.match(/\[(\d{2}\/\d{2})\]/);
    return dateMatch !== null;
  });

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  const handleNoteClick = (note: Note) => {
    setEditingNote(note);
    setLocalEditingNote(note);
  };

  const handleLocalNoteChange = (field: keyof Note, value: string | boolean) => {
    if (localEditingNote) {
      const updatedNote = { ...localEditingNote, [field]: value };
      if (field === 'content') {
        updatedNote.tags = (value as string).match(/#(\w+)/g)?.map(tag => tag.slice(1)) || [];
      }
      setLocalEditingNote(updatedNote);
    }
  };

  const saveNote = async () => {
    if (localEditingNote) {
      const { id, ...noteWithoutId } = localEditingNote;
      await updateDoc(doc(db, "notes", id), noteWithoutId);
      setEditingNote(null);
      setLocalEditingNote(null);
    }
  };

  const toggleNoteCompletion = async (id: string) => {
    const noteToUpdate = notes.find(note => note.id === id);
    if (noteToUpdate) {
      await updateDoc(doc(db, "notes", id), { completed: !noteToUpdate.completed } as Partial<Note>);
    }
  };

  const closeEditMode = () => {
    setEditingNote(null);
    setLocalEditingNote(null);
  };

  const createNewNote = async (categoryId: string = '') => {
    const newNote: Omit<Note, 'id'> = {
      title: 'New Note',
      content: '',
      categoryId: categoryId || categories[0]?.id || '',
      tags: [],
      completed: false,
    };
    await addDoc(collection(db, "notes"), newNote);
  };

  const handleCategoryNameChange = (id: string, newName: string) => {
    setCategoryNameEdit(newName);
  };

  const saveCategoryName = async (id: string) => {
    await updateDoc(doc(db, "categories", id), { name: categoryNameEdit } as Partial<Category>);
    setEditingCategory(null);
  };

  const startEditingCategory = (category: Category) => {
    setEditingCategory(category.id);
    setCategoryNameEdit(category.name);
  };

  const addNewCategory = async () => {
    const newCategory: Omit<Category, 'id'> = {
      name: 'New Category',
      color: `bg-${['red', 'blue', 'green', 'yellow', 'purple', 'pink'][Math.floor(Math.random() * 6)]}-200`,
    };
    await addDoc(collection(db, "categories"), newCategory);
  };

  const handleAllCategoriesClick = () => {
    setSelectedCategory('all');
  };

  const deleteCategory = async (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this category? All notes in this category will be moved to 'Uncategorized'.")) {
      await deleteDoc(doc(db, "categories", categoryId));

      const uncategorizedCategory = categories.find(c => c.name === 'Uncategorized');
      if (!uncategorizedCategory) {
        const newCategory: Omit<Category, 'id'> = {
          name: 'Uncategorized',
          color: 'bg-gray-200',
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

  const deleteNote = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteDoc(doc(db, "notes", noteId));
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 font-sans">
      {/* Left section - Categories, Upcoming Notes, and Tags */}
      <div className="w-64 bg-gray-900 p-4 border-r border-gray-700 flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-indigo-300">My Library</h2>

        {/* All Categories button */}
        <button 
          onClick={handleAllCategoriesClick}
          className={`mb-4 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            selectedCategory === 'all' 
              ? 'bg-indigo-500 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All Categories
        </button>

        <ul className="flex-grow overflow-auto">
          {categories.map(category => (
            <li key={category.id} className="mb-2">
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${category.color}`}></span>
                {editingCategory === category.id ? (
                  <input
                    value={categoryNameEdit}
                    onChange={(e) => handleCategoryNameChange(category.id, e.target.value)}
                    onBlur={() => saveCategoryName(category.id)}
                    onKeyDown={(e) => e.key === 'Enter' && saveCategoryName(category.id)}
                    autoFocus
                    className="border rounded px-1 bg-gray-800 text-white"
                  />
                ) : (
                  <>
                    <span
                      className={`cursor-pointer flex-grow ${
                        selectedCategory === category.id ? 'font-bold text-indigo-300' : 'text-gray-300 hover:text-white'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </span>
                    {category.id !== 'all' && category.name !== 'Uncategorized' && (
                      <>
                        <button 
                          className="text-sm text-gray-500 hover:text-gray-300 mr-2"
                          onClick={() => startEditingCategory(category)}
                        >
                          Edit
                        </button>
                        <button 
                          className="text-sm text-gray-500 hover:text-gray-300 mr-2"
                          onClick={() => createNewNote(category.id)}
                        >
                          📝
                        </button>
                        <button 
                          className="text-sm text-red-500 hover:text-red-300"
                          onClick={() => deleteCategory(category.id)}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
        <button onClick={addNewCategory} className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded transition-colors duration-200">
          Add Category
        </button>

        {/* Upcoming Notes */}
        <div className="mt-4">
          <h3 className="font-bold mb-2 text-pink-300">Upcoming Due Dates</h3>
          <ul className="text-sm">
            {upcomingNotes.map(note => {
              const dateMatch = note.content.match(/\[(\d{2}\/\d{2})\]/);
              return (
                <li key={note.id} className="mb-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={note.completed}
                    onChange={() => toggleNoteCompletion(note.id)}
                    className="mr-2"
                  />
                  <span className="font-semibold mr-2 text-yellow-200">{dateMatch ? dateMatch[1] : ''}</span>
                  <span className={note.completed ? 'line-through text-gray-500' : 'text-gray-300'}>{note.title}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <h3 className="font-bold mb-2 text-yellow-300">Tags</h3>
          <div className="flex flex-wrap">
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
        </div>
      </div>

      {/* Right section - Notes */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold text-indigo-300">Notes</h2>
          <button onClick={() => createNewNote()} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded transition-colors duration-200">
            New Note
          </button>
        </div>
        {localEditingNote ? (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <input
                value={localEditingNote.title}
                onChange={(e) => handleLocalNoteChange('title', e.target.value)}
                className="text-2xl font-bold w-1/2 border rounded px-2 bg-gray-800 text-white"
              />
              <div className="flex items-center">
                <select
                  value={localEditingNote.categoryId}
                  onChange={(e) => handleLocalNoteChange('categoryId', e.target.value)}
                  className="mr-4 border rounded px-2 py-1 bg-gray-800 text-white"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button onClick={saveNote} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded mr-2 transition-colors duration-200">
                  Save
                </button>
                <button onClick={closeEditMode} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors duration-200">
                  Cancel
                </button>
              </div>
            </div>
            <textarea
              value={localEditingNote.content}
              onChange={(e) => handleLocalNoteChange('content', e.target.value)}
              className="flex-1 resize-none text-lg p-4 border rounded bg-gray-800 text-white"
              placeholder="Start typing your note here... Use [DD/MM] for dates and #tag for tags."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => {
              const category = categories.find(c => c.id === note.categoryId);
              return (
                <div 
                  key={note.id} 
                  className={`${category?.color || 'bg-gray-200'} p-4 rounded-lg shadow-md cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg relative`}
                  onClick={() => handleNoteClick(note)}
                >
                  <h3 className="font-bold mb-2 text-gray-800">{note.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{note.content}</p>
                  <div className="mt-2 text-xs text-gray-500">{category?.name}</div>
                  <button 
                    className="absolute bottom-2 right-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                    onClick={(e) => deleteNote(note.id, e)}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryLayout;