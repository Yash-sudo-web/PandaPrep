"use client";

import Navbar from "@/components/global/navbar";
import { cn, getCookie } from "@/lib/utils";
import { Funnel_Display } from "next/font/google";
import { Eye, Search, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/lib/constant";

const funnel_display = Funnel_Display({
  subsets: ["latin"],
  weight: "400",
});

const History = () => {
  const [notes, setNotes] = useState([
    { id: 1, subject_name: "Note 1", createdAt: "", secure_url: "" },
  ]);
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);

  const toggleSelection = (id: number) => {
    setSelectedNotes((prev: number[]) =>
      prev.includes(id) ? prev.filter((noteId) => noteId !== id) : [...prev, id]
    );
  };

  const handleGetAllNotes = async () => {
    try {
      const email = getCookie("email");
      const response = await axios.post(`${BASE_URL}/userHistory/notes`, {
        email,
      });
      console.log(response.data.data);
      setNotes(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteNote = async (ids: number[]) => {
    try {
      const email = getCookie("email");
      await axios.post(`${BASE_URL}/userHistory/notes/delete`, {
        email,
        requestId: ids,
      });
      setSelectedNotes([]); // Clear selection after deletion
      handleGetAllNotes(); // Refresh notes list
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleGetAllNotes();
  }, []);

  return (
    <main
      className={cn(
        "bg-[radial-gradient(circle_at_center,_#d1fae5,_white)] min-h-screen flex flex-col items-center",
        funnel_display.className
      )}
    >
      <Navbar />

      <section className="w-full max-w-3xl px-4 flex flex-col items-center">
        <div className="fixed top-32 left-0 w-full  z-10 py-4 flex flex-col items-center">
          <h1 className="text-4xl font-semibold text-center  text-green-600">
            History
          </h1>

          <div className="relative mt-4 w-full max-w-3xl px-4">
            <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white" />
            </div>
            <input
              type="text"
              placeholder="Search your notes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-neutral-900 bg-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-white"
            />
          </div>
        </div>

        <div className="pt-32 w-full">
          <div className="text-gray-600 text-sm mb-4 flex items-center mt-32 gap-2 w-full">
            {selectedNotes.length > 0 ? (
              <>
                <p>{selectedNotes.length} selected</p>
                <button
                  onClick={() => handleDeleteNote(selectedNotes)}
                  className="text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            ) : (
              <p>
                You have {notes.length} generated{" "}
                {notes.length === 1 ? "note" : "notes"} in PandaPrep.
              </p>
            )}
          </div>

          <div className="space-y-4 w-full max-h-[70vh] overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-white shadow-md"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {note.subject_name}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <Eye
                    className="cursor-pointer"
                    onClick={(e) => {
                      if (!(e.target as Element).closest("input")) {
                        window.open(note.secure_url, "_blank");
                      }
                    }}
                    color="#676E7B"
                  />
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-green-600 focus:ring-green-500 cursor-pointer"
                    checked={selectedNotes.includes(note.id)}
                    onChange={() => toggleSelection(note.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default History;
