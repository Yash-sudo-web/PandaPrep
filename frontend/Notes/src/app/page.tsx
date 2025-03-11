import Navbar from "@/compnents/global/navbar";
import Image from "next/image";
import { ContainerScroll } from '@/compnents/global/container-scroll-animation'
import { Button } from "@/compnents/ui/button";
import { Funnel_Display } from 'next/font/google';
import { Cover } from "@/compnents/ui/cover";
import { InfiniteMovingCards } from "@/compnents/global/infinite-moving-cards";
import { clients,products } from '@/lib/constant'
import { HeroParallax } from "@/compnents/global/connect-parallax";
import { LampComponent } from "@/compnents/global/lamp";



const funnel_display = Funnel_Display({
  subsets: ['latin'],
  weight: '400',
})

export default function Home() {
  return (
    <main>
      <Navbar />
      <section className="h-screen w-full  bg-neutral-950 rounded-md  !overflow-visible relative flex flex-col items-center  antialiased" >
        <div className="absolute inset-0  h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_35%,#223_100%)]"></div>
        <div className="flex flex-col mt-[-100px] md:mt-[-50px]">
          <div className="flex flex-col mt-[-100px] md:mt-[-50px]">
            <ContainerScroll
              titleComponent={
                <div className="flex items-center flex-col">
                  <Button
                    size={'lg'}
                    className="p-8 mb-8 md:mb-0 text-2xl w-full sm:w-fit border-t-2 rounded-full border-[#4D4D4D] bg-[#1F1F1F] hover:bg-white group transition-all flex items-center justify-center gap-4 hover:shadow-xl hover:shadow-neutral-500 duration-500"
                  >
                    <span
                      className={`bg-clip-text text-transparent bg-gradient-to-r from-neutral-500 to-neutral-600 md:text-center group-hover:bg-gradient-to-r group-hover:from-black group-hover:to-black ${funnel_display.className}`}>
                      Start For Free Today
                    </span>
                  </Button>
                  <h1
                    className={`text-5xl md:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-purple-400 font-bold ${funnel_display.className}`}>
                    From Chaos to Clarity!
                  </h1>
                </div>
              }
            />
          </div>
        </div>
      </section>
      <InfiniteMovingCards
        className="ml-32 mt-96 pt-20 "
        items={clients}
        direction="right"
        speed="slow"
      />
       <section className="mt-10">
        <HeroParallax products={products}></HeroParallax>
      </section>
      <section className="mt-10">
      <LampComponent />
      </section>

``
    </main>
  );
}
