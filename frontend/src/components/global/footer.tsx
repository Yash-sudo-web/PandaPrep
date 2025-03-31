"use client";

import { Facebook, Twitter, Send, Instagram } from "lucide-react";
import { Funnel_Display } from "next/font/google";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const funnel_display = Funnel_Display({
  subsets: ["latin"],
  weight: "400",
});

const Footer = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer
      className={cn(
        "w-full px-6 py-8 backdrop-blur-lg border-t transition-colors duration-300",
        isDarkMode
          ? "bg-neutral-950 border-neutral-800 text-white"
          : "bg-white border-neutral-800 text-black",
        funnel_display.className
      )}
    >

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="mb-4 md:mb-0">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {/* <div className="w-3 h-8 bg-pink-500 rounded-sm"></div>
                  <div className="w-3 h-8 bg-yellow-500 rounded-sm"></div>
                  <div className="w-3 h-8 bg-blue-400 rounded-sm"></div> */}
                </div>
              </div>
            </Link>
          </div>


          <nav className="flex flex-wrap ml-2.5 justify-center text-green-700 text-lg gap-6 mb-4 md:mb-0">
            <Link href="/" className="hover:text-green-600 transition-colors">
              About
            </Link>
            {/* <Link href="/features" className="hover:text-green-400 transition-colors">
              Features
            </Link> */}
            <Link href="/pricing" className="hover:text-green-600 transition-colors">
              Pricing
            </Link>
            
            <Link href="/team" className="hover:text-green-600 transition-colors">
              Team
            </Link>
          </nav>


          <div className="flex items-center space-x-4">
            <div className="relative">
              {/* <input
                type="text"
                placeholder="search..."
                className="px-4 py-1 pr-8 rounded-full bg-neutral-800 border border-neutral-700 text-sm"
              /> */}
              {/* <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button> */}
            </div>
            <div className="flex space-x-3">
              {/* <Link href="#" className="hover:text-green-400 transition-colors">
                <Facebook size={20} />
              </Link> */}
              {/* <Link href="#" className="hover:text-green-400 transition-colors">
                <Twitter size={20} />
              </Link> */}
              {/* <Link href="#" className="hover:text-green-600 transition-colors">
                <Send size={20} />
              </Link> */}
              {/* <Link href="#" className="hover:text-green-400 transition-colors">
                <Instagram size={20} />
              </Link> */}
            </div>
          </div>
        </div>
      </div>


      <hr className="border-neutral-800 my-4 -mx-6" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-neutral-400">
          <Link href="/privacy-policy" className="hover:text-green-600 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms-of-use" className="hover:text-green-600 transition-colors">
            Terms of Use
          </Link>
          <Link href="/contact" className="hover:text-green-600 transition-colors">
            Contact Us
          </Link>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;