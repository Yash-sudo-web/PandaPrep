"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/global/navbar";
import { cn, getCookie } from "@/lib/utils";
import { Eye, Info, Search, Trash2 } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/lib/constant";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/global/mode-selector";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { montserrat500, montserrat600 } from "@/lib/font-utils";



const History = () => {
  const router = useRouter();
  const auth = getAuth();

  const [user, setUser] = useState<any>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [notes, setNotes] = useState<
    {
      id: number;
      subject_name: string;
      createdAt: string;
      secure_url: string;
    }[]
  >([]);
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allSelected, setAllSelected] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDarkMode = mounted && resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
      } else {
        setUser(user);
        const token = await user.getIdToken();
        setIdToken(token);
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

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
      const email = user?.email || getCookie("email");
      if (!idToken || !email) return;
      const response = await axios.post(
        `${BASE_URL}/userHistory/notes`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
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
      if (!idToken || !email) return;
      await axios.post(
        `${BASE_URL}/userHistory/notes/delete`,
        {
          email,
          requestId: ids,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
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
    if (idToken) {
      handleGetAllNotes();
    }
  }, [idToken]);

  useEffect(() => {
    setAllSelected(selectedNotes.length === notes.length && notes.length > 0);
  }, [selectedNotes, notes]);

  const filteredNotes = notes.filter((note) =>
    note.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted) return <div className="min-h-screen" />;
  return (
    <main
      className={cn(
        "min-h-screen flex flex-col items-center overflow-x-hidden",
        isDarkMode
          ? "bg-neutral-950 text-white"
          : "bg-[#FAF7F0] text-[#4A4947]"
      )}
    >
      <Navbar />

      <section className="w-full max-w-3xl px-4 sm:px-6 flex flex-col items-center pt-16 sm:pt-20 md:pt-24">
        <div className="w-full z-10 pt-6 pb-4 bg-inherit">
          <div className="flex items-center justify-center w-full">
            <h1
              className={cn(
                "text-2xl sm:text-3xl md:text-5xl text-center",
                montserrat600.className,
                isDarkMode ? "text-[#B17457]" : "text-[#4A4947]"
              )}
            >
              History
            </h1>
          </div>
          <div className="relative mt-4 w-full">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search
                className={cn(
                  "h-5 w-5",
                  isDarkMode ? "text-gray-300" : "text-[#4A4947]"
                )}
              />
            </div>
            <input
              type="text"
              placeholder="Search your notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2",
                montserrat500.className,
                isDarkMode
                  ? "border-white bg-neutral-800 bg-opacity-60 text-white placeholder:text-gray-300 focus:ring-[#B17457]"
                  : "border-[#B17457] bg-white bg-opacity-80 text-[#4A4947] placeholder:text-gray-500 focus:ring-[#B17457]"
              )}
            />
          </div>
        </div>

        <div className="w-full">
          <div
            className={cn(
              "text-sm mb-4 flex items-center gap-2 w-full",
              isDarkMode ? "text-gray-300" : "text-[#4A4947]"
            )}
          >
            {selectedNotes.length > 0 ? (
              <>
                <p className={montserrat500.className}>{selectedNotes.length} selected</p>
                <button
                  onClick={() => handleDeleteNote(selectedNotes)}
                  className="text-red-500 cursor-pointer hover:text-red-400 transition-colors"
                  aria-label="Delete selected notes"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className={cn("flex items-center gap-1", montserrat500.className)}>
                <p>
                  You have {notes.length} generated{" "}
                  {notes.length === 1 ? "note" : "notes"} in PandaPrep.
                </p>
                <div className="relative inline-block group">
                  <Info
                    className={cn("h-4 w-4 cursor-help", isDarkMode ? "text-gray-300" : "text-[#4A4947]")}
                    aria-label="Information about note retention"
                  />
                  <div className={cn(
                    "absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 w-56 rounded shadow-lg text-xs",
                    montserrat500.className,
                    isDarkMode ? "bg-gray-800 text-gray-200 border border-gray-700" : "bg-white text-[#4A4947] border border-[#B17457]"
                  )}>
                   Notes older than 30 days will be deleted automatically.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end mb-4 gap-2">
            <input
              type="checkbox"
              id="select-all-checkbox"
              className={cn(
                "h-5 w-5 focus:ring-2 cursor-pointer",
                isDarkMode
                  ? "text-[#B17457] focus:ring-[#B17457]"
                  : "text-[#B17457] focus:ring-[#B17457]"
              )}
              checked={allSelected}
              onChange={toggleSelectAll}
            />

            <label
              htmlFor="select-all-checkbox"
              className={cn(
                "cursor-pointer",
                montserrat500.className,
                isDarkMode ? "text-gray-300" : "text-[#4A4947]"
              )}
            >
              {!allSelected ? `Select All` : `Deselect All`}
            </label>
          </div>

          <div className="space-y-4 w-full overflow-y-auto px-1 pb-8" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg shadow-md transition-colors",
                    isDarkMode
                      ? "border-gray-700 bg-neutral-900 hover:bg-gray-800"
                      : "border-[#B17457] bg-white hover:bg-gray-50"
                  )}
                >
                  <div className="mb-2 sm:mb-0">
                    <h2
                      className={cn(
                        "text-base sm:text-lg font-semibold",
                        montserrat600.className,
                        isDarkMode ? "text-white" : "text-[#4A4947]"
                      )}
                    >
                      {note.subject_name}
                    </h2>
                    <p
                      className={cn(
                        "text-xs sm:text-sm mt-1",
                        montserrat500.className,
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      )}
                    >
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
                        isDarkMode
                          ? "text-[#B17457] focus:ring-[#B17457]"
                          : "text-[#B17457] focus:ring-[#B17457]"
                      )}
                      checked={selectedNotes.includes(note.id)}
                      onChange={() => toggleSelection(note.id)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div
                className={cn(
                  "text-center py-8",
                  montserrat500.className,
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}
              >
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