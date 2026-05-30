// src/components/EventCalendar.jsx
import React, { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css'; // basic styles

export default function EventCalendar() {
  const [date, setDate] = useState(new Date());



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
        tileContent={tiledContent}
      />
      <p>Selected date: {date.toDateString()}</p>
    </div>
  );
}
