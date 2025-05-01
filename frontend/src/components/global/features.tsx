import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { montserrat600, montserrat700 } from "@/lib/font-utils";
import heroPanda1 from "../../../public/assets/hero-panda-1.png";
import heroPanda2 from "../../../public/assets/hero-panda-2.png";
import heroPanda3 from "../../../public/assets/hero-panda-3.png";
import carouselPanda1 from "../../../public/assets/scribble-panda-1.png";
import carouselPanda2 from "../../../public/assets/scribble-panda-2.png";

export function FeatureSection() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const cards = [
    {
      image: heroPanda1,
      title: "Dynamic notes generation",
      description:
        "Transform lengthy lectures into concise, organized study materials in seconds. Our AI-powered notes generator creates structured summaries, key concept breakdowns, and practice questions from your course content.",
    },
    {
      image: heroPanda2,
      title: "Chat with your notes",
      description:
        "Interact with your PDFs in a whole new way! Our PDF chat feature allows you to extract key information, ask questions, and get summaries directly from your PDF files with AI-powered chat support.",
    },
    {
      image: heroPanda3,
      title: "Notes summarizer",
      description:
        "Summarize your lengthy notes into concise and easy-to-digest versions. The Notes Summarizer uses AI to highlight key points, concepts, and sections, making it easier for you to study.",
    },
  ];

  useEffect(() => {
    setMounted(true);

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
    }, 3000);
    setIntervalId(interval);

    return () => clearInterval(interval);
  }, [cards.length]);

  const handleManualSlideChange = (index: number) => {
    setCurrentSlide(index);
    if (intervalId) {
      clearInterval(intervalId); 
      const newInterval = setInterval(() => {
        setCurrentSlide((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
      }, 3000); 
      setIntervalId(newInterval);
    }
  };

  return (
    <div className={`w-full pb-16 bg-[#FAF7F0] ${montserrat600.className}`}>
      <div className="flex flex-col items-center justify-center">
        <h2
          className={`${montserrat700.className} text-5xl text-[#4A4947] mb-12 text-center`}
        >
          Your Ultimate Learning Toolkit
        </h2>
        <div className="relative">
          <div className="absolute left-[-100] top-5 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <Image
              src={carouselPanda1}
              alt="Decorative panda illustration"
              width={275}
              height={150}
            />
          </div>
          <div className="relative w-full max-w-5xl">
            <div className="overflow-hidden relative">
              <div
                className="flex transition-transform duration-500 ease-in-out relative"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {cards.map((card, index) => (
                  <div key={index} className="min-w-full">
                    <div className="border border-[#B17457] rounded-xl flex w-full h-[400px] relative">
                      <div className="flex items-center justify-center w-2/5">
                        <Image
                          src={card.image}
                          alt={`Feature illustration for ${card.title}`}
                          className="h-[300px] w-[300px] rounded-3xl"
                        />
                      </div>
                      <div
                        style={{ marginLeft: "-15px" }}
                        className="text-center flex flex-col items-center justify-center w-3/5"
                      >
                        <div
                          className={`${montserrat600.className} text-[#4A4947] text-[2rem] font-semibold`}
                        >
                          {card.title}
                        </div>
                        <div
                          className={`${montserrat600.className} text-[#B17457] text-[16px] pt-2`}
                        >
                          {card.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-8 space-x-2">
              {cards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleManualSlideChange(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentSlide === index ? "bg-[#B17457] w-6" : "bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="absolute right-[-140] bottom-[-100] transform -translate-x-1/2 -translate-y-1/2 z-10">
            <Image
              src={carouselPanda2}
              alt="Decorative panda illustration"
              width={137}
              height={137}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
