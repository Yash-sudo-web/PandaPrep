"use client";

import Navbar from "@/components/global/navbar";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { useRouter } from "next/navigation";
import { montserrat600, montserrat700, montserrat800 } from "@/lib/font-utils";
import { ArrowUpRight } from "lucide-react";
import heroBulb from "../../public/assets/hero-bulb.png";
import Image from "next/image";

export default function Home() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const router = useRouter();
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDarkMode = mounted && resolvedTheme === "dark";
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="overflow-x-hidden bg-[#FAF7F0]">
      <Navbar />
      <div className="flex flex-col items-center justify-center pt-36">
        <p
          className={`${montserrat800.className} text-[3.125rem] text-[#4A4947]`}
        >
          From Chaos to Clarity
        </p>
        <p
          className={`${montserrat600.className} text-[1.25rem] text-[#B17457] text-center`}
        >
          Stop stressing over messy notes — Our AI helps you focus, learn
          faster, <br/> and retain more with every study session.
        </p>
        <Image src={heroBulb} alt="hero-bulb" className="h-[7rem] w-[45rem]" />

        <div className="flex flex-col items-center justify-center mt-10">
          <button
            onClick={() => router.push("/auth")}
            className={`bg-[#B17457] text-white font-bold text-[1.25rem] rounded-[15px] w-[215px] h-[55px] shrink-0 transition duration-300 ease-in-out hover:bg-[#4A4947] ${montserrat700.className} flex items-center justify-center gap-1 cursor-pointer`}
          >
            <p>Get Started</p>
            <ArrowUpRight strokeWidth={3}/>
          </button>
        </div>
      </div>
    </main>
  );
}
