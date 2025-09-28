// src/pages/CalendarPage.jsx
import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());

  const events = [
    { date: "2025-09-20", title: "🎉 Alumni Meetup" },
    { date: "2025-09-25", title: "🎤 Guest Lecture" },
    { date: "2025-10-05", title: "🏆 Hackathon" },
  ];

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const eventForDay = events.find(
        (e) => new Date(e.date).toDateString() === date.toDateString()
      );
      return eventForDay ? (
        <div className="w-2 h-2 bg-indigo-500 rounded-full mx-auto mt-1" title={eventForDay.title}></div>
      ) : null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-indigo-100 p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-indigo-900 mb-2">📅 AlumHub Event Calendar</h1>
      <p className="text-indigo-700 mb-8 text-center max-w-2xl">
        Explore upcoming alumni events, meetups, and opportunities.
      </p>

      <div className="calendar-container w-full max-w-5xl shadow-lg rounded-xl overflow-hidden bg-white p-6 mb-8">
        <Calendar
          onChange={setDate}
          value={date}
          tileContent={tileContent}
          className="react-calendar w-full h-[600px] text-indigo-900 border-0 text-lg"
        />
      </div>

      <div className="event-list w-full max-w-5xl bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-indigo-800 mb-4">
          Events on {date.toDateString()}
        </h2>
        {events.filter(
          (e) => new Date(e.date).toDateString() === date.toDateString()
        ).length === 0 ? (
          <p className="text-gray-500">No events on this day.</p>
        ) : (
          <ul className="space-y-2">
            {events
              .filter(
                (e) => new Date(e.date).toDateString() === date.toDateString()
              )
              .map((e, i) => (
                <li
                  key={i}
                  className="p-3 rounded-lg bg-indigo-100 text-indigo-900 font-medium flex items-center justify-between shadow-sm"
                >
                  {e.title}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
