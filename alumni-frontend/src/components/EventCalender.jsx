// src/components/EventCalendar.jsx
import React, { useState } from "react";
import Calendar from "react-calendar";


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
