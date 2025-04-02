"use client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

import Navbar from "@/components/global/navbar";
import {
  CardContainer,
  CardBody,
  CardItem,
} from "@/components/ui/pricing-card";
import { CheckIcon, XIcon } from "lucide-react";
import { Funnel_Display } from "next/font/google";
import { cn, getCookie } from "@/lib/utils";
import { BASE_URL, PLANS } from "@/lib/constant";
import Footer from "@/components/global/footer";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import axios from "axios";

const funnel_display = Funnel_Display({
  subsets: ["latin"],
  weight: "400",
});

export default function Pricing() {
  const [authToken, setAuthToken] = useState<string>("");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = getCookie("jwt-auth");
    if (!token) {
      window.location.href = "/auth";
    } else {
      setAuthToken(token);
    }
  }, []);

  useEffect(() => {
    if (authToken) {
      handleGetUser();
    }
  }, [authToken]);

  const isDarkMode = mounted && resolvedTheme === "dark";

  const handleGetUser = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/user/get`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setUserId(res.data._id);
    } catch (error: any) {
      console.error("Internal Server Error:", error);
    }
  };

  const handlePayment = async (plan: any) => {
    if (!authToken || !userId) {
      console.error("Auth token or user ID not available");
      return;
    }

    try {
      const { data } = await axios.post(
        `${BASE_URL}/payment/create-order`,
        {
          userId: userId,
          amount: plan.cost,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const { order } = data;
      if (!order) throw new Error("Order creation failed");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount * 100,
        currency: "INR",
        name: "PandaPrep",
        description: `${plan.title} Plan - ${plan.credits} Credits`,
        order_id: order.id,
        method: {
          netbanking: true,
          card: true,
          wallet: true,
          upi: true,
          paylater: true,
          emi: true,
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay using UPI",
                instruments: [
                  {
                    method: "upi",
                  },
                ],
              },
              cards: {
                name: "Pay using Card",
                instruments: [
                  {
                    method: "card",
                  },
                ],
              },
              wallets: {
                name: "Pay using Wallets",
                instruments: [
                  {
                    method: "wallet",
                  },
                ],
              },
            },
            sequence: ["upi", "cards", "wallets"],
            preferences: {
              show_default_blocks: true,
            },
          },
          recommended: {
            method: ["upi", "card"],
            description: "Recommended payment options"
          }
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await axios.post(
              `${BASE_URL}/payment/verify-order`,
              {
                userId: userId,
                order_id: order.id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );
      
            if (verifyRes.data.success) {
              alert("Payment Successful! Credits Updated.");
            } else {
              alert("Payment verification failed.");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
          }
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: { color: "#2E7D32" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  if (!mounted) return <div className="min-h-screen"></div>;

  return (
    <main
      className={cn(
        "min-h-screen flex flex-col items-center transition-colors duration-300",
        isDarkMode
          ? "bg-gradient-to-r from-neutral-950 to-green-950 text-white"
          : "bg-[radial-gradient(circle_at_center,_#d1fae5,_white)] text-gray-800",
        funnel_display.className
      )}
    >
      <Navbar />

      <div className="w-full max-w-6xl px-4 flex flex-col items-center">
        <h1
          className={cn(
            "text-2xl sm:text-3xl md:text-4xl font-bold text-center mt-24 sm:mt-28 md:mt-36 mb-6 sm:mb-8",
            isDarkMode ? "text-green-500" : "text-green-700"
          )}
        >
          Get Premium Subscription at a lower price!
        </h1>

        <section className="w-full py-4 px-4 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full justify-items-center">
            {PLANS.map((plan, index) => (
              <CardContainer
                key={index}
                className="w-full max-w-xs md:max-w-none rounded-2xl p-[4px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 overflow-hidden"
              >
                <span
                  className={cn(
                    "absolute inset-[-1000%] animate-[spin_2s_linear_infinite]",
                    isDarkMode
                      ? "bg-[conic-gradient(from_90deg_at_50%_50%,#16814e_0%,#2be4a5_50%,#16814e_100%)]"
                      : "bg-[conic-gradient(from_90deg_at_50%_50%,#C8F7C5_0%,#2E7D32_50%,#C8F7C5_100%)]"
                  )}
                />
                <div
                  className={cn(
                    "relative w-full h-full rounded-2xl p-6",
                    isDarkMode ? "bg-neutral-900" : "bg-white"
                  )}
                >
                  <CardBody className="relative group/card w-full h-auto rounded-xl">
                    <CardItem
                      translateZ="50"
                      className={cn(
                        "text-xl font-bold",
                        isDarkMode ? "text-green-500" : "text-green-700"
                      )}
                    >
                      {plan.title}
                      <h2
                        className={cn(
                          "text-4xl sm:text-5xl",
                          isDarkMode ? "text-green-400" : "text-neutral-800"
                        )}
                      >
                        {plan.price}
                      </h2>
                    </CardItem>
                    <CardItem
                      translateZ="60"
                      className={cn(
                        "text-sm mt-2",
                        isDarkMode ? "text-gray-300" : "text-neutral-800"
                      )}
                    >
                      Get a glimpse of what our software is capable of. Just a
                      heads-up, you will never leave us after this!
                      <ul className="my-4 flex flex-col gap-2">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckIcon
                              className={cn(
                                "flex-shrink-0",
                                isDarkMode ? "text-green-400" : "text-green-600"
                              )}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {plan.limitations.length > 0 && (
                        <ul className="my-4 flex flex-col gap-2">
                          {plan.limitations.map((limitation, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <XIcon
                                className={cn(
                                  "flex-shrink-0",
                                  isDarkMode ? "text-red-400" : "text-red-500"
                                )}
                              />
                              <span>{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardItem>
                    <div className="flex justify-center items-center mt-6">
                      <CardItem
                        translateZ={20}
                        as="button"
                        onClick={() => handlePayment(plan)}
                        className={cn(
                          "w-full px-6 py-3 rounded-xl text-sm font-bold transition-colors",
                          isDarkMode
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-green-100 hover:bg-green-200 text-neutral-800"
                        )}
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
      </div>

      <section
        className={cn(
          "w-full mt-auto",
          isDarkMode ? "bg-neutral-900" : "bg-white"
        )}
      >
        <Footer />
      </section>
    </main>
  );
}
