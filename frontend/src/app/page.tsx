"use client";

import Navbar from "@/components/global/navbar";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { FeatureSection } from "@/components/global/features";
import { useRouter } from "next/navigation";
import { montserrat600, montserrat700, montserrat800,indieFlower } from "@/lib/font-utils";
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
      <Navbar/>
      <div className="flex flex-col items-center justify-center h-screen">
        <p
          className={`${indieFlower.className} text-[3.125rem]  text-[#4A4947]`}
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
            className={`bg-[#FAF7F0] border-2 border-[#B17457] text-[#B17457] font-bold text-[1.25rem] rounded-[15px] w-[215px] h-[55px] shrink-0 transition duration-300 ease-in-out hover:bg-[#B17457] hover:border-[#B17457] hover:text-[#FAF7F0] ${montserrat700.className} flex items-center justify-center gap-1 cursor-pointer`}
          >
            <p>Get Started</p>
            <ArrowUpRight strokeWidth={3}/>
          </button>
        </div>
      </div>

      <div
        className={`mt-20 flex justify-center pt-10 px-4 sm:px-8 md:px-16 lg:px-32 ${
          isDarkMode ? "bg-neutral-950 text-white" : "bg-[#FAF7F0] text-[#4A4947]"
        }`}
      >
        <section className="w-full ">
          <FeatureSection />
        </section>
      </div>
    </main>
  );
}
