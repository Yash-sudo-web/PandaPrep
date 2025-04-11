'use client'

import Navbar from "@/components/global/navbar";
import { Funnel_Display } from "next/font/google";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import Footer from "@/components/global/footer";

const funnel_display = Funnel_Display({
    subsets: ["latin"],
    weight: "400",
});

const PrivacyPolicy = () => {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDarkMode = mounted && resolvedTheme === "dark";

    return (
        <>
            <Navbar />

            <main
                className={cn(
                    "px-4 py-10 sm:px-10 lg:px-32 transition-colors duration-300 h-screen",
                    funnel_display.className,
                    isDarkMode ? "bg-black text-white" : "bg-white text-black"
                )}
            >
                <section className="max-w-7xl mx-auto mb-20">
                    <h1 className="text-center mt-16 mb-10 text-4xl  text-green-600">
                        Privacy Policy
                    </h1>


                    <div className="space-y-10 text-base sm:text-lg leading-relaxed">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-2">1. Introduction</h2>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, urna eu tincidunt
                                consectetur, nisi nisl aliquam nunc, eget tempus nulla nisl at turpis.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-2">2. Data Collection</h2>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet.
                                Proin gravida dolor sit amet lacus accumsan et viverra justo commodo.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-2">3. Usage of Information</h2>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vehicula cursus vestibulum.
                                Aenean efficitur sit amet massa fringilla egestas.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-2">4. User Rights</h2>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero.
                                Sed cursus ante dapibus diam.
                            </p>
                        </div>

                    </div>
                </section>

                <Footer />

            </main>
        </>
    );
};

export default PrivacyPolicy;
