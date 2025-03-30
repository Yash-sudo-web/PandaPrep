"use client";

import Navbar from "@/components/global/navbar";
import { cn, getCookie } from "@/lib/utils";
import { Funnel_Display } from "next/font/google";
import { Eye, Moon, Search, Sun, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/lib/constant";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/global/mode-selector";

const funnel_display = Funnel_Display({
  subsets: ["latin"],
  weight: "400",
});

const History = () => {

  let authToken = "";
  useEffect(() => {
    const token = getCookie("jwt-auth");
    if (!token) {
      window.location.href = "/auth";
    } else {
      authToken = token;
    }
  }, []);


  const [notes, setNotes] = useState<{ id: number; subject_name: string; createdAt: string; secure_url: string }[]>([]);

  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allSelected, setAllSelected] = useState(false);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDarkMode = mounted && resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);


  const toggleSelection = (id: number) => {
    setSelectedNotes((prev) =>
      prev.includes(id) ? prev.filter((noteId) => noteId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(notes.map((note) => note.id));
    }
    setAllSelected(!allSelected);
  };

  const handleGetAllNotes = async () => {
    try {
      const email = getCookie("email");
      const response = await axios.post(
        `${BASE_URL}/userHistory/notes`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setNotes(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteNote = async (ids: number[]) => {
    try {
      const email = getCookie("email");
      await axios.post(
        `${BASE_URL}/userHistory/notes/delete`,
        {
          email,
          requestId: ids,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setSelectedNotes([]);
      handleGetAllNotes();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleGetAllNotes();
  }, []);

  useEffect(() => {
    setAllSelected(selectedNotes.length === notes.length && notes.length > 0);
  }, [selectedNotes, notes]);

  const filteredNotes = notes.filter((note) =>
    note.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  if (!mounted) return <div className="min-h-screen"></div>;

  return (
    <main
      className={cn(
        "min-h-screen flex flex-col items-center transition-colors duration-300",
        isDarkMode
          ? "bg-gradient-to-r from-neutral-950 to-green-950 text-white"
          : "bg-[radial-gradient(circle_at_center,_#d1fae5,_white)] text-gray-800",
        funnel_display.className
      )}
    >
      <Navbar />

      <section className="w-full max-w-3xl px-4 sm:px-6 flex flex-col items-center pt-16 sm:pt-20 md:pt-24">
        {/* Header Section - Changed from fixed to sticky */}
        <div className="sticky top-16 sm:top-16 md:top-16 w-full z-10 pt-6 pb-4 bg-inherit">
          <div className="flex items-center justify-center w-full">
            <h1 className={cn(
              "text-2xl sm:text-3xl md:text-5xl text-center",
              isDarkMode ? "text-green-600" : "text-green-600"
            )}>
              History
            </h1>
          </div>
          <div className="relative mt-4 w-full">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className={cn("h-5 w-5", isDarkMode ? "text-gray-300" : "text-gray-600")} />
            </div>
            <input
              type="text"
              placeholder="Search your notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2",
                isDarkMode
                  ? "border-white bg-neutral-800 bg-opacity-60 text-white placeholder:text-gray-300 focus:ring-blue-400"
                  : "border-gray-800 bg-white bg-opacity-80 text-gray-800 placeholder:text-gray-500 focus:ring-blue-500"
              )}
            />
          </div>
        </div>

        <div className="w-full ">
          <div className={cn(
            "text-sm mb-4 flex items-center gap-2 w-full",
            isDarkMode ? "text-gray-300" : "text-gray-600"
          )}>
            {selectedNotes.length > 0 ? (
              <>
                <p>{selectedNotes.length} selected</p>
                <button
                  onClick={() => handleDeleteNote(selectedNotes)}
                  className="text-red-500 cursor-pointer hover:text-red-400 transition-colors"
                  aria-label="Delete selected notes"
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




          <div className="flex items-center justify-end mb-4 gap-2">

            <input
              type="checkbox"
              id="select-all-checkbox"
              className={cn(
                "h-5 w-5 focus:ring-2 cursor-pointer",
                isDarkMode ? "text-green-400 focus:ring-green-400" : "text-green-600 focus:ring-green-500"
              )}
              checked={allSelected}
              onChange={toggleSelectAll}
            />


            <label
              htmlFor="select-all-checkbox"
              className={cn(
                "cursor-pointer",
                isDarkMode ? "text-gray-300" : "text-gray-800"
              )}
            >

              {!allSelected ? `Select All` : `Deselect All`}
            </label>
          </div>

          <div className="space-y-4 w-full max-h-[calc(100vh-280px)] overflow-y-auto px-1 pb-8">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg shadow-md transition-colors",
                    isDarkMode
                      ? "border-gray-700 bg-neutral-900 hover:bg-gray-700"
                      : "border-gray-300 bg-white hover:bg-gray-50"
                  )}
                >
                  <div className="mb-2 sm:mb-0">
                    <h2 className={cn(
                      "text-base sm:text-lg font-semibold",
                      isDarkMode ? "text-white" : "text-gray-800"
                    )}>
                      {note.subject_name}
                    </h2>
                    <p className={cn(
                      "text-xs sm:text-sm mt-1",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-4 items-center self-end sm:self-auto">
                    <button
                      className="p-1 rounded-full hover:bg-opacity-20 transition-colors"
                      onClick={() => window.open(note.secure_url, "_blank")}
                      aria-label="View note"
                    >
                      <Eye
                        className="cursor-pointer"
                        color={isDarkMode ? "#9ca3af" : "#676E7B"}
                      />
                    </button>
                    <input
                      type="checkbox"
                      className={cn(
                        "h-5 w-5 focus:ring-2 cursor-pointer",
                        isDarkMode ? "text-green-400 focus:ring-green-400" : "text-green-600 focus:ring-green-500"
                      )}
                      checked={selectedNotes.includes(note.id)}
                      onChange={() => toggleSelection(note.id)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className={cn(
                "text-center py-8",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                No notes found matching your search.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default History;