import { Linkedin, Github } from "lucide-react";
import { Funnel_Display } from "next/font/google";
import { cn } from "@/lib/utils";

const funnel_display = Funnel_Display({
  subsets: ["latin"],
  weight: "400",
});

const Footer = () => {
  return (
    <div className={cn("max-w-8xl mx-auto ml-40 px-5 grid grid-cols-1 md:grid-cols-4 gap-12 bg-white", funnel_display.className)}>
      <div>
        <h2 className="text-2xl font-bold text-green-700">PandaPrep</h2>
        <p className="mt-2 text-sm text-neutral-600">yaha pe description and logo daalni h</p>
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-black">Quick Links</h3>
        <ul className="mt-3 space-y-2">
          <li>
            <a href="/" className="text-black hover:text-green-700">
              Home
            </a>
          </li>
          <li>
            <a href="/pricing" className="text-black hover:text-green-700">
              Pricing
            </a>
          </li>
          <li>
            <a href="#" className="text-black hover:text-green-700">
              Documentation
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-black">Support</h3>
        <ul className="mt-3 space-y-2">
          <li>
            <a href="/contact" className="text-black hover:text-green-700">
              Contact Us
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-black">Follow Us</h3>
        <div className="mt-3 flex space-x-6">
          <a href="#" className="group transition duration-300 hover:scale-110">
            <Linkedin
              size={40}
              className="text-gray-600 transition-all duration-300 group-hover:text-green-700"
            />
          </a>
          <a href="#" className="group transition duration-300 hover:scale-110">
            <Github
              size={40}
              className="text-gray-600 transition-all duration-300 group-hover:text-green-700"
            />
          </a>
        </div>
      </div>
    <div className="w-screen">
      <div className="w-3/4 flex justify-center border-t border-gray-300 py-4">
        <p className="text-center text-black text-sm">© {new Date().getFullYear()} PandaPrep. All rights reserved.</p>
      </div>
      </div>
    </div>
  );
};

export default Footer;