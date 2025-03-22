"use client";

import { BookOpen, Filter, FileText, MessageCircle, Bot } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing";
import { Funnel_Display } from 'next/font/google';

const funnel_display = Funnel_Display({
  subsets: ['latin'],
  weight: '400',
});

export function Featuregrid() {
  return (
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={<FileText className="h-4 w-4 text-white" />}
        title="Ace Exams in 5 Minutes"
        description="Get concise, high-quality notes that help you master any subject quickly."
      />

      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={<BookOpen className="h-4 w-4 text-white" />}
        title="All Your Notes, One Place"
        description="Keep all your notes well-organized and accessible in one central hub."
      />

      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={<Filter className="h-4 w-4 text-white" />}
        title="Capture Notes, Your Way"
        description="Summarize swiftly, dive deep, or go interactive with Q&A. Supercharge your notes with stunning visuals, images, and diagrams—turn ideas into unforgettable insights!"
      />

      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        icon={<MessageCircle className="h-4 w-4 text-white" />}
        title="Chat with Your PDFs"
        description="Interact with your study materials using AI to get instant insights."
      />

      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
        icon={<Bot className="h-4 w-4 text-white" />}
        title="AI-Powered Learning, Just Like a Personal Tutor"
        description="Experience AI as your personal tutor—explaining concepts, breaking down topics, and guiding you just like a real teacher."
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div
        className="relative h-full rounded-2.5xl border border-green-500 p-2 md:rounded-3xl md:p-3 bg-gradient-to-b from-white to-green-200 shadow-lg"
        style={{ fontFamily: funnel_display.style.fontFamily }}
      >
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-0.75 p-6 text-black shadow-md dark:shadow-lg">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-black/20 bg-neutral-800 p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl font-semibold text-black md:text-2xl">
                {title}
              </h3>
              <p className="text-sm md:text-base text-black/80">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};