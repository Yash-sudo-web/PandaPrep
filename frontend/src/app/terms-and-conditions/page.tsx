"use client";

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

const TermsAndConditions = () => {
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
          "px-4 py-10 sm:px-10 lg:px-32 transition-colors duration-300 h-full",
          funnel_display.className,
          isDarkMode ? "bg-black text-white" : "bg-white text-black"
        )}
      >
        <section className="max-w-7xl mx-auto mb-20">
          <h1 className="text-center mt-16 mb-10 text-4xl text-green-600">
            Terms & Conditions
          </h1>

          <p className="text-sm text-center text-gray-500 mb-10">
            Last updated on Apr 14 2025
          </p>

          <div className="space-y-10 text-base sm:text-lg leading-relaxed">
            <p>
              For the purpose of these Terms and Conditions, the term
              &quot;we&quot;, &quot;us&quot;, &quot;our&quot; refers to
              PandaPrep. The terms &quot;you&quot;, “your”, &quot;user&quot;,
              “visitor” refer to any natural or legal person visiting our
              website and/or purchasing from us.
            </p>

            <ul className="list-disc list-inside space-y-3">
              <li>
                The content of the pages on this website is subject to change
                without notice.
              </li>
              <li>
                We do not provide any warranty or guarantee regarding the
                accuracy, timeliness, performance, completeness, or suitability
                of the information and materials on this website.
              </li>
              <li>
                Your use of any information or materials on this website is
                entirely at your own risk. It is your responsibility to ensure
                that any products, services, or information meet your specific
                requirements.
              </li>
              <li>
                This website contains material owned by or licensed to us,
                including design, layout, appearance, and graphics. Reproduction
                is prohibited except in accordance with copyright law.
              </li>
              <li>
                All trademarks reproduced on this website that are not our
                property are acknowledged accordingly.
              </li>
              <li>
                Unauthorized use of this website may give rise to a claim for
                damages and/or be a criminal offense.
              </li>
              <li>
                We may include links to external websites for your convenience.
                These do not signify our endorsement of the linked websites.
              </li>
              <li>
                You may not create a link to our website without PandaPrep&#39;s
                prior written consent.
              </li>
              <li>
                Any disputes related to the use of this website or purchases
                made through it are subject to the laws of India.
              </li>
              <li>
                We are not liable for any loss or damage arising from the
                decline of a transaction authorization due to the cardholder
                exceeding preset limits with the acquiring bank.
              </li>
            </ul>

            <h2 className="text-2xl font-bold mt-16 mb-4 text-green-600">
              Cancellation and Refund Policy
            </h2>

            <p className="text-sm text-gray-500 mb-6">
              Last updated on Apr 14 2025
            </p>

            <ul className="list-disc list-inside space-y-3">
              <li>
                Cancellations are only considered if the request is made on the
                same day the order is placed. If the order has already been
                communicated to the vendor or dispatched, cancellation may not
                be possible.
              </li>

              <li>
                If the product received does not match the description or your
                expectations, contact our customer service on the same day of
                receipt for evaluation.
              </li>

              <li>
                Refunds approved by PandaPrep will be processed within the time
                frame of 3-4 working days. The refund will be credited to the
                original payment method used for the purchase.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </>
  );
};

export default TermsAndConditions;
