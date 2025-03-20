"use client";

import Navbar from "@/compnents/global/navbar";
import { CardContainer, CardBody, CardItem } from "@/compnents/ui/pricing-card";
import { CheckIcon, XIcon } from "lucide-react";
import { Funnel_Display } from "next/font/google";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/constant";
import Footer from "@/compnents/global/footer";

const funnel_display = Funnel_Display({
    subsets: ["latin"],
    weight: "400",
});

export default function Pricing() {
    return (
        <main
            className={cn(
                "bg-[radial-gradient(circle_at_center,_#d1fae5,_white)] min-h-screen flex flex-col items-center",
                funnel_display.className
            )}
        >
            <Navbar />
            <div className="text-4xl font-bold text-green-700 mt-32 mb-8">
                Get Premium Subscription at a lower price!
            </div>
            <section className="flex justify-center items-center flex-grow py-1 px-4 mb-8">
                <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl justify-center items-center">
                    {PLANS.map((plan, index) => (
                        <CardContainer
                            key={index}
                            className="relative flex-1 min-w-[300px] max-w-[350px] rounded-2xl p-[4px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 overflow-hidden"
                        >
                            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#C8F7C5_0%,#2E7D32_50%,#C8F7C5_100%)]" />
                            <div className="relative w-full h-full rounded-2xl bg-white  p-6">
                                <CardBody className="relative group/card w-full h-auto rounded-xl">
                                    <CardItem translateZ="50" className="text-xl font-bold text-green-700">
                                        {plan.title}
                                        <h2 className="text-6xl text-neutral-800 dark:text-green-600">{plan.price}</h2>
                                    </CardItem>
                                    <CardItem translateZ="60" className="text-neutral-800 text-sm max-w-sm mt-2">
                                        Get a glimpse of what our software is capable of. Just a heads-up, you’ll never leave us after this!
                                        <ul className="my-4 flex flex-col gap-2">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2 text-neutral-800">
                                                    <CheckIcon /> {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        {plan.limitations.length > 0 && (
                                            <ul className="my-4 flex flex-col gap-2 text-red-500">
                                                {plan.limitations.map((limitation, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-neutral-800 dark:text-red-500">
                                                        <XIcon /> {limitation}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </CardItem>
                                    <div className="flex justify-between items-center mt-8">
                                        <CardItem
                                            translateZ={20}
                                            as="button"
                                            onClick={() => console.log('Card clicked!')}
                                            className="px-4 py-2 rounded-xl bg-green-100  text-neutral-800 text-xs font-bold"
                                        >
                                            Get Started Now
                                        </CardItem>
                                    </div>
                                </CardBody>
                            </div>
                        </CardContainer>
                    ))}
                </div>
            </section>
            <section className="w-screen bg-white " >
                <div className="mt-8">
                    <Footer />
                </div>

            </section>
        </main>
    );
}
