"use client";

import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image'; 
import { montserrat600, montserrat700, montserrat800 } from "@/lib/font-utils";

gsap.registerPlugin(ScrollTrigger);


export function FeatureSection() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const firstSectionRef = useRef<HTMLDivElement>(null);
  const secondSectionRef = useRef<HTMLDivElement>(null);
  const thirdSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    if (firstSectionRef.current) {
      gsap.fromTo(
        firstSectionRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: firstSectionRef.current,
            start: "top 80%", 
            end: "bottom 60%",
            toggleActions: "play reverse play reverse", 
            scrub: true,
          },
        }
      );
    }

    if (secondSectionRef.current) {
      gsap.fromTo(
        secondSectionRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: secondSectionRef.current,
            start: "top 80%",
            end: "bottom 60%",
            toggleActions: "play reverse play reverse",
            scrub: true,
          },
        }
      );
    }

    if (thirdSectionRef.current) {
      gsap.fromTo(
        thirdSectionRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: thirdSectionRef.current,
            start: "top 80%",
            end: "bottom 60%",
            toggleActions: "play reverse play reverse",
            scrub: true,
          },
        }
      );
    }
  }, []);

  return (
    <div className={`w-full py-16 bg-[#FAF7F0] ${montserrat600.className}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-5xl md:text-4xl font-bold text-[#4A4947] mb-12 text-center">
          The all-in-one AI education platform for student success
        </h2>

        <div  ref={firstSectionRef}>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-full md:w-1/2">
              <Image
                src="/notesgenerate.jpg"
                alt="Smart Notes Generator"
                width={800} 
                height={480} 
                layout="responsive"
                className="object-cover"
              />
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="text-4xl md:text-5xl font-semibold text-[#4A4947] mb-4">
                Smart Notes Generator
              </h3>
              <p className="text-[#4A4947]/80 md:text-xl mb-6">
                Transform lengthy lectures into concise, organized study materials in seconds. Our AI-powered notes generator creates structured summaries, key concept breakdowns, and practice questions from your course content.
              </p>
              <button
                onClick={() => router.push('/generate')}
                className="inline-flex items-center text-xl text-[#B17457] font-medium hover:underline"
              >
                Generate Notes
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>


        <div  ref={secondSectionRef}>
          <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
            <div className="w-full md:w-1/2">
              <Image
                src="/chatwithpdf.jpg"
                alt="Chat with PDF"
                width={800} 
                height={480} 
                layout="responsive" 
                className="object-cover"
              />
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="text-4xl md:text-5xl font-semibold text-[#4A4947] mb-4">
                Chat with PDF
              </h3>
              <p className="text-[#4A4947]/80 md:text-xl mb-6">
                Interact with your PDFs in a whole new way! Our PDF chat feature allows you to extract key information, ask questions, and get summaries directly from your PDF files with AI-powered chat support.
              </p>
              <button
                onClick={() => router.push('/chatwithpdf')}
                className="inline-flex items-center text-xl text-[#B17457] font-medium hover:underline"
              >
                Start Chatting
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div  ref={thirdSectionRef}>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-full md:w-1/2">
              <Image
                src="/notessummarizer.jpg"
                alt="Notes Summarizer"
                width={600} 
                height={300} 
                layout="responsive" 
                className="object-cover"
              />
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="text-4xl md:text-5xl font-semibold text-[#4A4947] mb-4">
                Notes Summarizer
              </h3>
              <p className="text-[#4A4947]/80 md:text-xl mb-6">
                Summarize your lengthy notes into concise and easy-to-digest versions. The Notes Summarizer uses AI to highlight key points, concepts, and sections, making it easier for you to study.
              </p>
              <button
                onClick={() => router.push('/summarize')}
                className="inline-flex items-center text-xl text-[#B17457] font-medium hover:underline"
              >
                Summarize Notes
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
