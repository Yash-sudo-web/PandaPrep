"use client";

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; 
import { montserrat600, montserrat700 } from "@/lib/font-utils";
import heroPanda1 from "../../../public/assets/hero-panda-1.png";
import heroPanda2 from "../../../public/assets/hero-panda-2.png";
import heroPanda3 from "../../../public/assets/hero-panda-3.png";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function FeatureSection() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Cards content
  const cards = [
    {
      image: heroPanda1,
      title: "Dynamic notes generation",
      description: "Transform lengthy lectures into concise, organized study materials in seconds. Our AI-powered notes generator creates structured summaries, key concept breakdowns, and practice questions from your course content."
    },
    {
      image: heroPanda2,
      title: "Chat with your notes",
      description: "Interact with your PDFs in a whole new way! Our PDF chat feature allows you to extract key information, ask questions, and get summaries directly from your PDF files with AI-powered chat support."
    },
    {
      image: heroPanda3,
      title: "Notes summarizer",
      description: "Summarize your lengthy notes into concise and easy-to-digest versions. The Notes Summarizer uses AI to highlight key points, concepts, and sections, making it easier for you to study."
    }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  return (
    <div className={`w-full pb-16 bg-[#FAF7F0] ${montserrat600.className}`}>
      <div className="container mx-auto px-4 flex flex-col items-center justify-center">
        <h2 className={`${montserrat700.className} text-5xl text-[#4A4947] mb-12 text-center`}>
          Your Ultimate Learning Toolkit
        </h2>

        <div className="relative w-full max-w-4xl">
          <button 
            onClick={goToPrevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 shadow-lg rounded-full p-3 hover:bg-gray-50 transition-all z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} className="text-[#B17457]" />
          </button>

          <div className="overflow-hidden relative">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {cards.map((card, index) => (
                <div key={index} className="min-w-full" style={{ flex: '0 0 100%' }}>
                  <div className="border border-[#B17457] p-12 rounded-xl flex w-full shadow-md mx-auto">
                    <div className="w-2/5 flex items-center justify-center">
                      <Image 
                        src={card.image} 
                        alt={`Feature illustration for ${card.title}`} 
                        className="h-64 w-64 object-contain" 
                      />
                    </div>
                    <div className="w-3/5 text-center flex flex-col items-center justify-center pl-8">
                      <div className={`${montserrat600.className} text-[#4A4947] text-2xl font-semibold`}>
                        {card.title}
                      </div>
                      <div className={`${montserrat600.className} text-[#B17457] text-sm pt-2`}>
                        {card.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={goToNextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 shadow-lg rounded-full p-3 hover:bg-gray-50 transition-all z-10"
            aria-label="Next slide"
          >
            <ChevronRight size={24} className="text-[#B17457]" />
          </button>

          <div className="flex justify-center mt-8 space-x-2">
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentSlide === index ? 'bg-[#B17457] w-6' : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}