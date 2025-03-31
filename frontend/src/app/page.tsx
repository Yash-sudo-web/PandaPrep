"use client";

import Navbar from "@/components/global/navbar";
import Image from "next/image";
import { ContainerScroll } from "@/components/global/container-scroll-animation";
import { Button } from "@/components/ui/button";
import { Funnel_Display } from "next/font/google";
import { InfiniteMovingCards } from "@/components/global/infinite-moving-cards";
import { clients, faqs } from "@/lib/constant";
import { TextGenerateEffect } from "@/components/global/text-effect";
import { Linkedin, Github } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { Box, Lock, Search, Settings, Sparkles } from "lucide-react";
import { Featuregrid } from "@/components/global/feature-grid";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Footer from "@/components/global/footer";
import { Faq } from "@/components/global/faq";

const words = `Stressed about exams? Relax. Drop a topic, and let AI do its magic. `;

const funnel_display = Funnel_Display({
  subsets: ["latin"],
  weight: "400",
});

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
    <main className="overflow-x-hidden bg-white dark:bg-neutral-950">
      <Navbar />
      <section
        className={`h-[155vh] w-screen rounded-md relative flex flex-col items-center antialiased ${
          isDarkMode ? "bg-neutral-950" : "bg-white"
        }`}
      >
        <div
          className={`absolute inset-0 h-full w-full items-center px-5 py-24 ${
            isDarkMode
              ? "bg-[radial-gradient(circle,rgba(19,78,43,1)_0%,rgba(10,10,10,1)_100%)]"
              : "bg-[radial-gradient(circle,rgba(184,230,200,1)_0%,rgba(255,255,255,1)_100%)]"
          }`}
        ></div>

        <div className="relative z-10 flex flex-col w-full max-w-6xl mx-auto px-4 mt-8 md:mt-[-50px]">
          <ContainerScroll
            titleComponent={
              <div className="flex items-center flex-col mt-4 md:mt-[-50px]">
                <Button
                  onClick={() => router.push("/auth")}
                  size={"lg"}
                  className="cursor-pointer p-6 sm:p-8 mb-6 text-xl sm:text-2xl w-3/4 sm:w-fit border-t-2 rounded-full border-green-600 bg-green-200 hover:bg-white dark:hover:bg-neutral-800 group transition-all flex items-center justify-center gap-4 hover:shadow-xl hover:shadow-green-500 duration-500 z-20 relative"
                >
                  <span
                    className={`bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-green-600 text-center ${funnel_display.className}`}
                  >
                    Start For Free Today
                  </span>
                </Button>

                <h1
                  className={`text-4xl sm:text-5xl md:text-[5.2rem] bg-clip-text text-transparent bg-gradient-to-b ${
                    isDarkMode
                      ? "from-neutral-300 to-green-400"
                      : "from-neutral-500 to-green-600"
                  } font-sans font-semibold ${
                    funnel_display.className
                  } text-center`}
                >
                  From Chaos to Clarity
                </h1>
              </div>
            }
          />
        </div>
      </section>

      {/* <InfiniteMovingCards
        className="ml-32 mt-96 pt-20"
        items={clients}
        direction="right"
        speed="slow"
      /> */}
      <div></div>
      <div
        className={`border-none w-full flex justify-center pt-10 px-4 sm:px-8 md:px-16 lg:px-32 ${
          isDarkMode ? "bg-neutral-950 text-white" : "bg-white text-black"
        }`}
      >
        <section className="w-full flex justify-center text-center max-w-screen-xl">
          <TextGenerateEffect
            className={`mb-10 text-center ${
              isDarkMode ? "text-white bg-neutral-950" : "text-black bg-white"
            }`}
            words={words}
          />
        </section>
      </div>

      <div
        className={`w-full flex justify-center pt-5 px-4 sm:px-8 md:px-16 lg:px-32 ${
          isDarkMode ? "bg-neutral-950 text-white" : "bg-white text-black"
        }`}
      >
        <section className="w-full max-w-screen-xl mb-10 ">
          <Featuregrid />
        </section>
      </div>

      <section>
        <Faq />
      </section>

      <Footer />
    </main>
  );
}
