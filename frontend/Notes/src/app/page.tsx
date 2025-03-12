import Navbar from "@/compnents/global/navbar";
import Image from "next/image";
import { ContainerScroll } from '@/compnents/global/container-scroll-animation'
import { Button } from "@/compnents/ui/button";
import { Funnel_Display } from 'next/font/google';
import { InfiniteMovingCards } from "@/compnents/global/infinite-moving-cards";
import { clients,products } from '@/lib/constant'
import { TextGenerateEffect } from "@/compnents/global/text-effect";
import { Linkedin, Github } from "lucide-react";
import { GlowingEffect } from "@/compnents/ui/glowing";

import { Box, Lock, Search, Settings, Sparkles } from "lucide-react";
import { Featuregrid } from "@/compnents/global/feature-grid";

const words = `Stressed about exams? Relax. Drop a topic, and let AI do its magic. `;




const funnel_display = Funnel_Display({
  subsets: ['latin'],
  weight: '400',
})


export default function Home() {
  return (
    <main className="bg-white">
      <Navbar />
      <section className="h-screen w-full bg-white rounded-md !overflow-visible relative flex flex-col items-center antialiased">
        <div className="absolute inset-0 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#FFFFFF_35%,#B8E6C8_100%)]"></div>
        <div className="flex flex-col mt-[-100px] md:mt-[-50px]">
          <div className="flex flex-col mt-[-100px] md:mt-[-50px]">
            <ContainerScroll
              titleComponent={
                <div className="flex items-center flex-col">
                  <Button
                    size={'lg'}
                    className="p-8 mb-8 md:mb-0 text-2xl w-full sm:w-fit border-t-2 rounded-full border-green-600 bg-green-200 hover:bg-white group transition-all flex items-center justify-center gap-4 hover:shadow-xl hover:shadow-green-500 duration-500"
                  >
                    <span
                      className={`bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-green-600 md:text-center group-hover:bg-gradient-to-r group-hover:from-black group-hover:to-black ${funnel_display.className}`}>
                      Start For Free Today
                    </span>
                  </Button>
                  <h1
                    className={`text-5xl mb-3 md:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 to-green-500 font-bold ${funnel_display.className}`}>
                    From Chaos to Clarity
                  </h1>
                </div>
              }
            />
          </div>
        </div>
      </section>
      <InfiniteMovingCards
        className="ml-32 mt-96 pt-20"
        items={clients}
        direction="right"
        speed="slow"
      />

      <section className="w-2/3 ml-60 mb-24">

<Featuregrid />

      </section>

      
      
  <section><TextGenerateEffect className="mb-10  pl-72" words={words}/></section>
      
      
      <div className="max-w-7xl mx-auto px-5 grid grid-cols-1 md:grid-cols-4 gap-56 bg-white">
        
        <div>
          <h2 className={`text-2xl font-bold text-green-700 ${funnel_display.className}`}>PandaPrep</h2>
          <p className={`mt-2 text-sm text-neutral-600 ${funnel_display.className}`}>yaha pe description and logo daalni h</p>
        </div>

        <div>
          <h3 className={`text-2xl font-semibold text-black ${funnel_display.className}`}>Quick Links</h3>
          <ul className={`mt-3 space-y-2 ${funnel_display.className}`}>
            <li><a href="#" className="text-black hover:text-green-700">Home</a></li>
            <li><a href="#" className="text-black hover:text-green-700">Resources</a></li>
            <li><a href="#" className="text-black hover:text-green-700">Documentation</a></li>
          </ul>
        </div> 

        <div>
          <h3 className={`text-2xl font-semibold text-black ${funnel_display.className}`}>Support</h3>
          <ul className={`mt-3 space-y-2 ${funnel_display.className}`}>
            <li><a href="#" className="text-black hover:text-green-700">Help Center</a></li>
            <li><a href="#" className="text-black hover:text-green-700">Contact Us</a></li>
          </ul>
        </div>

        <div>
          <h3 className={`text-2xl font-semibold text-black ${funnel_display.className}`}>Follow Us</h3>
          <div className={`mt-3 flex space-x-6 ${funnel_display.className}`}>
            <a 
              href="#" 
              className="group transition duration-300 hover:scale-110"
            >
              <Linkedin 
                size={40} 
                className={`text-gray-600 transition-all duration-300 group-hover:text-green-700 ${funnel_display.className}`}
              />
            </a>
            <a 
              href="#" 
              className="group transition duration-300 hover:scale-110"
            >
              <Github 
                size={40} 
                className={`text-gray-600 transition-all duration-300 group-hover:text-green-700 ${funnel_display.className}`}
              />
            </a>
          </div>
        </div>
      </div>

      <div className={`mt-8 text-center text-black text-sm border-t border-gray-300 pt-4 ${funnel_display.className}`}>
        <p>© {new Date().getFullYear()} PandaPrep. All rights reserved.</p>
      </div>
</main>



  );
}
