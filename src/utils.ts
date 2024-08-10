import { Category, Note } from './types';

export const sortNotesByDate = (notes: Note[]): Note[] => {
  return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const sortCategoriesAlphabetically = (categories: Category[]): Category[] => {
  return categories.sort((a, b) => a.name.localeCompare(b.name));
};

export const organizeCategories = (categories: Category[]): Category[] => {
  const rootCategories = categories.filter(c => c.parentId === null);
  const childCategories = categories.filter(c => c.parentId !== null);
  const sortedRootCategories = sortCategoriesAlphabetically(rootCategories);
  return sortedRootCategories.reduce((acc: Category[], rootCategory) => {
    acc.push(rootCategory);
    const children = childCategories.filter(c => c.parentId === rootCategory.id);
    acc.push(...sortCategoriesAlphabetically(children));
    return acc;
  }, []);
};