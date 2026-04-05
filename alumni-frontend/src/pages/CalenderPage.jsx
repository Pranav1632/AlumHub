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
  const sortedAllEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const aTime = new Date(a.date || 0).getTime();
        const bTime = new Date(b.date || 0).getTime();
        return bTime - aTime;
      }),
    [events]
  );

  const filteredAllEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedAllEvents;
    return sortedAllEvents.filter((e) => {
      const title = e.title?.toLowerCase() || "";
      const description = e.description?.toLowerCase() || "";
      const venue = e.venue?.toLowerCase() || "";
      return title.includes(q) || description.includes(q) || venue.includes(q);
    });
  }, [search, sortedAllEvents]);

  const formatEventDateTime = (event) => {
    if (!event?.date) return "Date TBA";
    const datePart = new Date(event.date).toLocaleDateString();
    const timePart = event.time ? ` | ${event.time}` : "";
    return `${datePart}${timePart}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">College Events Calendar</h1>

        <div className="w-full bg-white rounded-2xl p-6 mb-6 border shadow-sm">
          <div className="mx-auto max-w-5xl">
            <Calendar
              onChange={setDate}
              value={date}
              className="w-full border-0"
              tileClassName={({ view }) => (view === "month" ? "h-20 p-1 text-sm" : "")}
              tileContent={({ date: d, view }) => {
                if (view !== "month") return null;
                const dayEvents = eventsByDay.get(d.toDateString()) || [];
                return dayEvents.length ? <div className="w-2.5 h-2.5 bg-blue-600 rounded-full mx-auto mt-1" /> : null;
              }}
            />
            <p className="text-sm text-slate-600 mt-3">
              Selected Date: <span className="font-medium">{date.toDateString()}</span> ({selectedEvents.length} events)
            </p>
          </div>
        </div>

        <div className="w-full bg-white rounded-2xl border p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">All Events (Latest First)</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, venue, description"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          />
          {filteredAllEvents.length === 0 ? (
            <p className="text-slate-500">
              {sortedAllEvents.length === 0 ? "No events available right now." : "No events matched your search."}
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredAllEvents.map((e) => (
                <li key={e._id} className="p-3 rounded border bg-slate-50">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-slate-600">{e.description || "No description"}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatEventDateTime(e)} | {e.venue || "Venue TBA"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
