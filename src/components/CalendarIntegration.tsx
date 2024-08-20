import React, { useState, useEffect } from 'react';
import { User, CalendarEvent } from '../types';
import { addCalendarEvent } from '../firebase';

interface CalendarIntegrationProps {
  user: User;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ user }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    start: new Date(),
    end: new Date(),
  });

  useEffect(() => {
    const checkAuthorization = async () => {
      // Check if the user has authorized the app to access their Google Calendar
      // This is a placeholder and should be replaced with actual OAuth2 check
      setIsAuthorized(true);
    };

    checkAuthorization();
  }, [user]);

  const handleAuthorize = () => {
    // Implement Google Calendar OAuth2 authorization flow
    // This is a placeholder and should be replaced with actual OAuth2 implementation
    console.log('Authorizing Google Calendar access');
    setIsAuthorized(true);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEvent.title && newEvent.start && newEvent.end) {
      try {
        await addCalendarEvent(user.id, newEvent as CalendarEvent);
        console.log('Event added successfully');
        setNewEvent({ title: '', start: new Date(), end: new Date() });
      } catch (error) {
        console.error('Error adding event:', error);
      }
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Google Calendar Integration</h2>
        <p className="mb-4">To use Google Calendar integration, please authorize access to your calendar.</p>
        <button
          onClick={handleAuthorize}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Authorize Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Add Event to Google Calendar</h2>
      <form onSubmit={handleAddEvent} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300">Event Title</label>
          <input
            type="text"
            id="title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="start" className="block text-sm font-medium text-gray-300">Start Date/Time</label>
          <input
            type="datetime-local"
            id="start"
            value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
            onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="end" className="block text-sm font-medium text-gray-300">End Date/Time</label>
          <input
            type="datetime-local"
            id="end"
            value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
            onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Event
        </button>
      </form>
    </div>
  );
};

export default CalendarIntegration;