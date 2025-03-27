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
import { useTheme } from 'next-themes'

import { Box, Lock, Search, Settings, Sparkles } from "lucide-react";
import { Featuregrid } from "@/components/global/feature-grid";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Footer from "@/components/global/footer";

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

  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="bg-white">
      <Navbar />
      <section
        className={`top-0 left-0 right-0 h-screen w-full !overflow-visible relative flex flex-col items-center antialiased transition-colors duration-300 ${mounted
            ? resolvedTheme === 'dark'
              ? 'bg-neutral-800 text-white'
              : 'bg-white text-black'
            : 'bg-transparent'
          }`}
      >
        <div
          className={`absolute inset-0 h-full w-full items-center px-5 py-24 transition-all duration-300 ${mounted
              ? resolvedTheme === 'dark'
                ? '[background:radial-gradient(125%_125%_at_50%_10%,#222222_35%,#14532D_100%)]'
                : '[background:radial-gradient(125%_125%_at_50%_10%,#FFFFFF_35%,#B8E6C8_100%)]'
              : ''
            }`}
        ></div>

        <div className="flex flex-col mt-[-100px] md:mt-[-50px] w-full max-w-7xl px-6 md:px-16 lg:px-24">
          <div className="flex flex-col mt-[-100px] md:mt-[-50px] w-full">
            <ContainerScroll
              titleComponent={
                <div className="flex flex-col items-center justify-center text-center mt-10 w-full max-w-[90%] md:max-w-[80%] lg:max-w-[1200px]">
                  <Button
                    onClick={() => router.push('/auth')}
                    size={'lg'}
                    className="p-8 mb-8 md:mb-0 text-2xl w-full sm:w-fit border-t-2 rounded-full border-green-600 bg-green-200 hover:bg-white dark:bg-green-800 dark:hover:bg-white group transition-all flex items-center justify-center gap-4 hover:shadow-xl hover:shadow-green-500 duration-500"
                  >
                    <span
                      className={`bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-green-600 dark:from-green-400 dark:to-green-300 md:text-center group-hover:bg-gradient-to-r group-hover:from-black group-hover:to-black dark:group-hover:from-white dark:group-hover:to-white ${funnel_display.className}`}
                    >
                      Start For Free Today
                    </span>
                  </Button>

                  <h1
                    className={`text-4xl md:text-7xl lg:text-7xl leading-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 to-green-500 dark:from-neutral-200 dark:to-green-400 font-bold ${funnel_display.className}`}
                  >
                    From Chaos to Clarity
                  </h1>
                </div>


              }
            />
          </div>
        </div>
      </section>


      {/* <InfiniteMovingCards
        className="ml-32 mt-96 pt-20"
        items={clients}
        direction="right"
        speed="slow"
      /> */}
      
      <div className="ml-32 mt-56 pt-20"></div>
      <section>
        <TextGenerateEffect className="mb-10 ml-3 pl-72" words={words} />
      </section>
      <section className="w-2/3 ml-64 mb-24">
        <Featuregrid />
      </section>

      <section className="relative bg-white min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-radial from-green-200 to-transparent">
          <h2
            className={`text-4xl text-green-600 font-bold text-center mt-5  ${funnel_display.className}`}
          >
            FAQs
          </h2>
        </div>
        <div className="relative z-0 max-w-2xl  ">
          <div className="text-black space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg">
                <button
                  onClick={() => toggleFAQ(index)}
                  className={`w-full flex justify-between items-center p-4 text-left font-medium transition-all ${funnel_display.className}`}
                >
                  {faq.question}
                  <ChevronDown
                    className={`transition-transform ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-max-height duration-300 ${
                    openIndex === index ? "max-h-40" : "max-h-0"
                  }`}
                >
                  <div
                    className={`p-4 border-t bg-gray-50 ${funnel_display.className}`}
                  >
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer/>
    </main>
  );
}
