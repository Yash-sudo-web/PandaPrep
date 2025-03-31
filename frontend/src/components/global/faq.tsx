"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/constant";
import { Funnel_Display } from "next/font/google";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: "400" });

export function Faq() {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDarkMode = mounted && resolvedTheme === "dark";

    return (
        <main className={`w-full ${isDarkMode ? "bg-neutral-950" : "bg-white"} py-10`}>
            <div
                className={`w-full text-4xl sm:text-5xl text-center mb-6 sm:mb-10 ${
                    isDarkMode ? "text-green-600" : "text-green-600"
                } ${funnelDisplay.className}`}
            >
                <p>Frequently Asked Questions</p>
            </div>
            <section
                className={`flex flex-col items-center justify-center ${
                    isDarkMode ? "bg-neutral-950" : "bg-white"
                }`}
            >
                <Accordion
                    type="single"
                    collapsible
                    className={`w-full max-w-lg px-4 sm:px-0 ${funnelDisplay.className}`}
                >
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger
                                className={isDarkMode ? "text-white" : "text-black"}
                            >
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent
                                className={isDarkMode ? "text-white" : "text-gray-700"}
                            >
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>
        </main>
    );
}
