// CalendarView.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './CalendarView.module.css';
import { Note, User, CalendarEvent } from '../types';
import { getCalendarEvents } from '../firebase';

moment.locale('en-GB');
const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  user: User;
  notes: Note[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ user, notes }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day' | 'verticalWeek'>('verticalWeek');

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        const calendarEvents = await getCalendarEvents(user.id);
        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      }
    };

    fetchCalendarEvents();
  }, [user.id]);

  const noteEvents = notes
    .filter(note => note.eventDate)
    .map(note => ({
      id: note.id,
      title: note.title,
      start: new Date(note.eventDate!),
      end: new Date(note.eventDate!),
      noteId: note.id,
    }));

  const allEvents = [...events, ...noteEvents];

  const VerticalWeekView = ({ date }: { date: Date }) => {
    const startOfWeek = moment(date).startOf('week');
    const days = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days'));

    return (
      <div className={styles.verticalWeekView}>
        {days.map((day, index) => (
          <div key={index} className={styles.dayColumn}>
            <h3 className={styles.dayHeader}>{day.format('ddd, MMM D')}</h3>
            <div className={styles.dayEvents}>
              {allEvents
                .filter(event => moment(event.start).isSame(day, 'day'))
                .map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className={`${styles.event} ${event.noteId ? styles.noteEvent : styles.calendarEvent}`}
                    onClick={() => console.log('Selected event:', event)}
                  >
                    {event.title}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.viewButtons}>
        <button
          className={`${styles.viewButton} ${view === 'verticalWeek' ? styles.activeView : ''}`}
          onClick={() => setView('verticalWeek')}
        >
          Vertical Week
        </button>
        <button
          className={`${styles.viewButton} ${view === 'month' ? styles.activeView : ''}`}
          onClick={() => setView('month')}
        >
          Month
        </button>
        <button
          className={`${styles.viewButton} ${view === 'week' ? styles.activeView : ''}`}
          onClick={() => setView('week')}
        >
          Week
        </button>
        <button
          className={`${styles.viewButton} ${view === 'day' ? styles.activeView : ''}`}
          onClick={() => setView('day')}
        >
          Day
        </button>
      </div>
      {view === 'verticalWeek' ? (
        <VerticalWeekView date={new Date()} />
      ) : (
        <Calendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 150px)' }}
          views={['month', 'week', 'day']}
          view={view}
          onView={(newView) => setView(newView as 'month' | 'week' | 'day')}
          tooltipAccessor={event => event.title}
          onSelectEvent={(event) => {
            console.log('Selected event:', event);
          }}
          eventPropGetter={(event) => ({
            className: event.noteId ? styles.noteEvent : styles.calendarEvent,
          })}
        />
      )}
    </div>
  );
};

export default CalendarView;