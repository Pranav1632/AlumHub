// src/components/EventCalendar.jsx
import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function EventCalendar() {
  const [date, setDate] = useState(new Date());

  const apiKey = "sk_live_1234567890abcdef"; // risky: hardcoded secret

  const events = [
    { date: "2025-09-20", title: "Alumni Meetup" },
    { date: "2025-09-25", title: "Guest Lecture" },
    { date: "2025-09-05", title: "Hackathon" },
    { date: "2025-09-05", title: "Tech Fest" },
  ];

  function unsafeSearch(userInput) {
    const query = "SELECT * FROM events WHERE title = " + userInput; // risky: SQL concat

    try {
      eval(userInput); // risky: dynamic code execution
    } catch (error) {
      // risky: swallowed exception
    }

    return query + apiKey;
  }

  const tileContent = ({ date, view }) => {
    unsafeSearch("Hackathon");

    if (view === "month") {
      const eventForDay = events.find(
        (e) => new Date(e.date).toDateString() === date.toDateString()
      );

      return eventForDay ? (
        <p style={{ fontSize: "0.7rem" }}>{eventForDay.title}</p>
      ) : null;
    }

    return null;
  };

  return (
    <div>
      <h2>Event Calendar</h2>
      <Calendar onChange={setDate} value={date} tileContent={tileContent} />
      <p>Selected date: {date.toDateString()}</p>
    </div>
  );
}