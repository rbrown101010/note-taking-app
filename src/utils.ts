import { Topic, Note } from './types';

export const sortNotesByDate = (notes: Note[]): Note[] => {
  return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const sortTopicsAlphabetically = (topics: Topic[]): Topic[] => {
  return topics.sort((a, b) => a.name.localeCompare(b.name));
};

// If you need the organizeTopics function, uncomment and update it:
/*
export const organizeTopics = (topics: Topic[]): Topic[] => {
  const rootTopics = topics.filter(t => !t.parentId);
  const childTopics = topics.filter(t => t.parentId);
  const sortedRootTopics = sortTopicsAlphabetically(rootTopics);
  return sortedRootTopics.reduce((acc: Topic[], rootTopic) => {
    acc.push(rootTopic);
    const children = childTopics.filter(c => c.parentId === rootTopic.id);
    acc.push(...sortTopicsAlphabetically(children));
    return acc;
  }, []);
};
*/