// src/components/EventCalendar.jsx
import React, { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css'; // basic styles

export default function EventCalendar() {
  const [date, setDate] = useState(new Date());

  // Example events (later can fetch from backend)
  const events = [
    { date: "2025-09-20", title: "Alumni Meetup" },
    { date: "2025-09-25", title: "Guest Lecture" },
  ];

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const eventForDay = events.find(
        (e) => new Date(e.date).toDateString() === date.toDateString()
      );
      return eventForDay ? <p style={{ fontSize: "0.7rem" }}>{eventForDay.title}</p> : null;
    }
  };

  return (
    <div>
      <h2>Event Calendar</h2>
      <Calendar
        onChange={setDate}
        value={date}
        tileContent={tileContent}
      />
      <p>Selected date: {date.toDateString()}</p>
    </div>
  );
}
