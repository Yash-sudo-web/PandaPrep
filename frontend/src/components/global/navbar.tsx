"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, ChevronDown, ChevronUp } from "lucide-react";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import app from "@/firebase/firebaseconfig";
import { deleteCookie } from "@/lib/utils";
import { useRef } from "react";
import { montserrat500, montserrat700 } from "@/lib/font-utils";


const Navbar = () => {
  const auth = getAuth(app);
  const router = useRouter();

  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownRef, setDropdownRef] = useState<HTMLElement | null>(null);
  const [servicesDropdown, setServicesDropdown] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef && dropdownRef.contains(event.target as Node)) {
        return;
      }
      setServicesDropdown(false);
      setDropdownOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      deleteCookie("jwt-auth");
      deleteCookie("email");
      router.push("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-[#D8D2C2] py-[0.5rem] px-6 my-6 mx-10 rounded-[1.5rem] border border-[#C9C3B3] flex justify-between items-center fixed top-0 left-0 right-0 z-50">
      <div
        onClick={() => router.push("/")}
        className={`${montserrat700.className} text-[#4A4947] text-[2rem] cursor-pointer`}
      >
        PandaPrepAI
      </div>

      <div className="flex gap-12 items-center relative mr-6">
        <div className="relative">
          <button
            onClick={() => setServicesDropdown(!servicesDropdown)}
            className={`${montserrat500.className} text-[#4A4947] text-[1.5rem] flex items-center gap-2 cursor-pointer`}
          >
            <span>Services</span>
            {servicesDropdown ? (
              <ChevronUp size={24} strokeWidth={2} />
            ) : (
              <ChevronDown size={24} strokeWidth={2} />
            )}
          </button>

          <AnimatePresence>
            {servicesDropdown && (
              <motion.div
                ref={setDropdownRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-[3rem] right-0 bg-white/70 backdrop-blur-md border border-[#C9C3B3] rounded-2xl shadow-2xl py-3 w-60 z-50 flex flex-col overflow-hidden"
              >
                <Link
                  href="/generate"
                  className="px-5 py-3 text-[#4A4947] hover:bg-[#f0eee9] text-[1.25rem] transition-all duration-200 hover:pl-6"
                >
                  Notes Generator
                </Link>
                <div className="border-t border-[#C9C3B3] mx-4" />
                <Link
                  href="/summarizer"
                  className="px-5 py-3 text-[#4A4947] hover:bg-[#f0eee9] text-[1.25rem] transition-all duration-200 hover:pl-6"
                >
                  Notes Summarizer
                </Link>
                <div className="border-t border-[#C9C3B3] mx-4" />
                <Link
                  href="/chat-pdf"
                  className="px-5 py-3 text-[#4A4947] hover:bg-[#f0eee9] text-[1.25rem] transition-all duration-200 hover:pl-6"
                >
                  Chat with PDFs
                </Link>
              </motion.div>
            )}
          </AnimatePresence>


        </div>

        <div
          onClick={() => router.push("/pricing")}
          className={`${montserrat500.className} text-[#4A4947] text-[1.5rem] cursor-pointer`}
        >
          Pricing
        </div>

        <div
          className={`${montserrat500.className} text-[#4A4947] text-[1.5rem] cursor-pointer`}
        >
          About
        </div>

        <div className="flex items-center gap-6">
          {mounted && (
            <button
              onClick={() => (isDark ? setTheme("light") : setTheme("dark"))}
              className="flex items-center justify-center w-10 h-10 rounded-[0.625rem] border-2 border-[#4A4947] relative overflow-hidden cursor-pointer"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? "moon" : "sun"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute"
                >
                  {isDark ? (
                    <Moon size={20} color="#4A4947" strokeWidth={3} />
                  ) : (
                    <Sun size={20} color="#4A4947" strokeWidth={3} />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          )}
          <div className="flex items-center gap-6">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <Image
                    src={user.photoURL || "/default-avatar.png"}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  {dropdownOpen ? (
                    <ChevronUp size={16} color="#4A4947" />
                  ) : (
                    <ChevronDown size={16} color="#4A4947" />
                  )}
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      ref={setDropdownRef}
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[3.5rem] right-0 bg-white/70 backdrop-blur-md border border-[#C9C3B3] rounded-2xl shadow-2xl py-3 w-60 z-50 flex flex-col overflow-hidden"
                    >
                      <Link
                        href="/profile"
                        className="px-5 py-3 text-[#4A4947] hover:bg-[#f0eee9] text-[1.25rem] transition-all duration-200 hover:pl-6"
                      >
                        Profile
                      </Link>
                      <div className="border-t border-[#C9C3B3] mx-4" />
                      <button
                        onClick={handleSignOut}
                        className="text-left w-full px-5 py-3 text-red-600 hover:bg-red-50 text-[1.25rem] cursor-pointer transition-all duration-200 hover:pl-6"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="text-[#4A4947] border border-[#4A4947] rounded-xl px-4 py-2 text-[1.1rem]"
              >
                Login / Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
