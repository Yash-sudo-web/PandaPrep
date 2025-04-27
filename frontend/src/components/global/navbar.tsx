"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, ChevronDown, ChevronUp } from "lucide-react";
import { Funnel_Display } from "next/font/google";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion"; // <<< NEW
import app from "@/firebase/firebaseconfig";
import { deleteCookie } from "@/lib/utils";
import { montserrat500, montserrat700 } from "@/lib/font-utils";

const funnel_display = Funnel_Display({
  subsets: ["latin"],
  weight: "400",
});

const Navbar = () => {
  const auth = getAuth(app);
  const router = useRouter();

  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [servicesDropdown, setServicesDropdown] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

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
    <div className="bg-[#D8D2C2] py-[0.5rem] px-6 my-6 mx-10 rounded-[1.5rem] border border-[#C9C3B3] flex justify-between items-center relative">
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

          {servicesDropdown && (
            <div className="absolute top-[3rem] right-1 bg-white border border-[#C9C3B3] rounded-xl shadow-lg py-2 w-52 z-50">
              <Link
                href="/generate"
                className="block px-4 py-2 text-[#4A4947] hover:bg-[#f0eee9] text-[1.25rem]"
              >
                Notes Generator
              </Link>
              <Link
                href="/summarizer"
                className="block px-4 py-2 text-[#4A4947] hover:bg-[#f0eee9] text-[1.25rem]"
              >
                Notes Summarizer
              </Link>
              <Link
                href="/chat-pdf"
                className="block px-4 py-2 text-[#4A4947] hover:bg-[#f0eee9] text-[1.25rem]"
              >
                Chat with PDFs
              </Link>
            </div>
          )}
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
              className="flex items-center justify-center w-10 h-9 rounded-[0.625rem] border-2 border-[#4A4947] relative overflow-hidden cursor-pointer"
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
                  <span className="font-medium text-[#4A4947] hidden md:inline text-[1.2rem]">
                    {user.displayName}
                  </span>
                  {dropdownOpen ? (
                    <ChevronUp size={16} color="#4A4947" />
                  ) : (
                    <ChevronDown size={16} color="#4A4947" />
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#C9C3B3] rounded-lg shadow-lg p-2 z-50">
                    <Link
                      href="/profile"
                      className="block w-full text-left px-4 py-2 text-[#4A4947] hover:bg-[#f0eee9] rounded-lg text-[1.1rem]"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-[1.1rem] cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
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
