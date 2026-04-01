import React, { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "../utils/axiosInstance";

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data?.events || []);
      } catch {
        setEvents([]);
      }
    };
    load();
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    events.forEach((e) => {
      const key = new Date(e.date).toDateString();
      const curr = map.get(key) || [];
      curr.push(e);
      map.set(key, curr);
    });
    return map;
  }, [events]);

  const selectedEvents = useMemo(
    () => eventsByDay.get(date.toDateString()) || [],
    [eventsByDay, date]
  );
  const filteredSelectedEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return selectedEvents;
    return selectedEvents.filter((e) => {
      const title = e.title?.toLowerCase() || "";
      const description = e.description?.toLowerCase() || "";
      const venue = e.venue?.toLowerCase() || "";
      return title.includes(q) || description.includes(q) || venue.includes(q);
    });
  }, [selectedEvents, search]);

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">College Events</h1>

      <div className="w-full max-w-5xl bg-white rounded-xl p-5 mb-6 border">
        <Calendar
          onChange={setDate}
          value={date}
          tileContent={({ date: d, view }) => {
            if (view !== "month") return null;
            const dayEvents = eventsByDay.get(d.toDateString()) || [];
            return dayEvents.length ? <div className="w-2 h-2 bg-blue-600 rounded-full mx-auto mt-1" /> : null;
          }}
        />
      </div>

      <div className="w-full max-w-5xl bg-white rounded-xl border p-5">
        <h2 className="text-xl font-semibold mb-3">Events on {date.toDateString()}</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events by title, venue, description"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
        />
        {filteredSelectedEvents.length === 0 ? (
          <p className="text-slate-500">
            {selectedEvents.length === 0 ? "No events on this date." : "No events matched your search."}
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredSelectedEvents.map((e) => (
              <li key={e._id} className="p-3 rounded border bg-slate-50">
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-slate-600">{e.description || "No description"}</p>
                <p className="text-xs text-slate-500 mt-1">{e.venue || "Venue TBA"} {e.time ? `| ${e.time}` : ""}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
