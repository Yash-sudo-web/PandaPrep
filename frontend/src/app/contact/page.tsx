'use client';

import Navbar from "@/components/global/navbar";
import { cn } from "@/lib/utils";
import { Funnel_Display } from "next/font/google";
import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "@/lib/constant";
import { useTheme } from "next-themes";

const funnel_display = Funnel_Display({
    subsets: ["latin"],
    weight: "400",
});

type SubjectOption = {
    value: string;
    label: string;
};

export default function Contact() {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const isDarkMode = mounted && resolvedTheme === "dark";

    useEffect(() => {
        setMounted(true);
    }, []);

    const subjectOptions: SubjectOption[] = [
        { value: "general", label: "General Inquiry" },
        { value: "support", label: "Support" },
        { value: "feedback", label: "Feedback" },
        { value: "other", label: "Other" }
    ];

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        subject: subjectOptions[0].value,
        message: ""
    });
    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");

    const handleInputChange = (field: string, value: string) => {
        setForm({
            ...form,
            [field]: value
        });
    };

    const validateEmail = (value: string) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        handleInputChange("email", value);
        setEmailError(emailPattern.test(value) ? "" : "Invalid email format");
    };

    const validatePhone = (value: string) => {
        const phonePattern = /^\d{10,15}$/;
        handleInputChange("phoneNumber", value);
        setPhoneError(phonePattern.test(value) ? "" : "Invalid phone number");
    };

    const handleSubjectChange = (value: string) => {
        handleInputChange("subject", value);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${BASE_URL}/contact`, form);
            // Handle successful submission
            alert("Message sent successfully!");
            // Reset form
            setForm({
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                subject: subjectOptions[0].value,
                message: ""
            });
        } catch (error) {

            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again.");
        }
    };

    const inputFields = [
        {
            type: 'email',
            placeholder: 'Email',
            value: form.email,
            onChange: validateEmail,
            error: emailError,
            field: 'email'
        },
        {
            type: 'tel',
            placeholder: 'Phone Number',
            value: form.phoneNumber,
            onChange: validatePhone,
            error: phoneError,
            inputPlaceholder: '+1 (02) 3456 789',
            field: 'phoneNumber'
        }
    ];

    if (!mounted) return null;

    return (
        <main
            className={cn(
                isDarkMode
                    ? "bg-gradient-to-r from-neutral-950 to-green-950 text-white"
                    : "bg-[#FAF7F0] text-gray-900",
                "min-h-screen flex flex-col items-center",
                funnel_display.className
            )}
        >
            <Navbar />

            <section className="w-full max-w-5xl px-4 flex flex-col items-center mt-16 md:mt-28 mb-20">
                <h1 className={`text-3xl md:text-4xl font-bold mb-2 text-center ${isDarkMode ? 'text-green-400' : 'text-[#4A4947]'}`}>
                    Contact Us
                </h1>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 md:mb-10 text-center px-4`}>
                    Any question or remarks? Just write us a message!
                </p>

                <div className={`flex flex-col md:flex-row w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden relative`}>
                <span className="hidden md:block absolute top-10 bottom-10 left-2/5 w-px bg-[#4A4947] "></span>

                    <div className={`${isDarkMode ? 'bg-green-900' : 'bg-white'} text-[#4A4947] p-6 md:p-8 w-full md:w-2/5 relative order-2 md:order-1`}>
                        <h2 className="text-xl md:text-2xl font-semibold mb-1">Contact Information</h2>
                        <p className="mb-6 md:mb-8">Say something to start a live chat!</p>

                        <div className="space-y-6 mt-6 md:mt-10">
                            <div className="space-y-4 md:space-y-6">
                                <div className="flex items-center">
                                    <div className="mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                            <rect x="2" y="9" width="4" height="12"></rect>
                                            <circle cx="4" cy="4" r="2"></circle>
                                        </svg>
                                    </div>
                                    <a href="https://www.linkedin.com/in/soumilsuri/" target="_blank" rel="noopener noreferrer" className="hover:underline text-sm md:text-base">
                                        Soumil Suri
                                    </a>
                                </div>

                                <div className="flex items-center">
                                    <div className="mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                            <rect x="2" y="9" width="4" height="12"></rect>
                                            <circle cx="4" cy="4" r="2"></circle>
                                        </svg>
                                    </div>
                                    <a href="https://www.linkedin.com/in/lakshay-sharma-242907259/" target="_blank" rel="noopener noreferrer" className="hover:underline text-sm md:text-base">
                                        Lakshay Sharma
                                    </a>
                                </div>

                                <div className="flex items-center">
                                    <div className="mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                            <rect x="2" y="9" width="4" height="12"></rect>
                                            <circle cx="4" cy="4" r="2"></circle>
                                        </svg>
                                    </div>
                                    <a href="https://www.linkedin.com/in/yash-mathur-3a2aa21b7/" target="_blank" rel="noopener noreferrer" className="hover:underline text-sm md:text-base">
                                        Yash Mathur
                                    </a>
                                </div>

                                {/* <div className="flex items-center">
                                    <div className="mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                            <rect x="2" y="9" width="4" height="12"></rect>
                                            <circle cx="4" cy="4" r="2"></circle>
                                        </svg>
                                    </div>
                                    <a href="https://www.linkedin.com/in/sankalp-mathur-985a171b0/" target="_blank" rel="noopener noreferrer" className="hover:underline text-sm md:text-base">
                                        Sankalp Mathur
                                    </a>
                                </div> */}
                            </div>

                            <div className="flex items-center">
                                <div className="mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                </div>
                                <span className="text-sm md:text-base break-words">tshifthappens@gmail.com</span>
                            </div>

                            <div className="flex items-center">
                                <div className="mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm md:text-base">Delhi</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className={`p-6 md:p-8 w-full md:w-3/5 order-1 md:order-2 ${isDarkMode ? 'bg-neutral-950 text-white' : 'bg-white text-gray-900'}`}>
                        <form className="space-y-4 md:space-y-6" onSubmit={handleSendMessage}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6"> 
                                <div>
                                    <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>First Name</label>
                                    <input
                                        type="text"
                                        className={`w-full border rounded-xl py-2 px-3 focus:outline-none ${isDarkMode ? 'border-gray-600 bg-gray-100 text-gray-900' : 'border-[#4A4947] bg-white text-[#4A4947]'}`}
                                        value={form.firstName}
                                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Last Name</label>
                                    <input
                                        type="text"
                                        className={`w-full border rounded-xl py-2 px-3 focus:outline-none ${isDarkMode ? 'border-gray-600 bg-gray-100 text-gray-900' : 'border-[#4A4947] bg-white text-[#4A4947]'}`}
                                        value={form.lastName}
                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                {inputFields.map((field, index) => (
                                    <div key={index}>
                                        <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{field.placeholder}</label>
                                        <input
                                            type={field.type}
                                            className={`w-full border rounded-xl py-2 px-3 focus:outline-none ${isDarkMode ? 'border-gray-600 bg-gray-100 text-gray-900' : 'border-[#4A4947] bg-white text-[#4A4947]'}`}
                                            value={field.value}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            placeholder={field.inputPlaceholder || ''}
                                        />
                                        {field.error && <p className="text-red-500 text-sm">{field.error}</p>}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>Select Subject?</label>
                                <div className="flex flex-wrap gap-3">
                                    {subjectOptions.map((option, index) => (
                                        <div key={index} className="flex items-center">
                                            <input
                                                type="radio"
                                                id={`subject-${option.value}`}
                                                name="subject"
                                                className="h-4 w-4 mr-2"
                                                checked={form.subject === option.value}
                                                onChange={() => handleSubjectChange(option.value)}
                                            />
                                            <label htmlFor={`subject-${option.value}`} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {option.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Message</label>
                                <textarea
                                    className={`w-full mt-1 border rounded-xl py-2 px-3 focus:outline-none ${isDarkMode ? 'border-gray-600 bg-gray-100 text-gray-900' : 'border-[#4A4947] bg-white text-[#4A4947]'}`}
                                    rows={4}
                                    placeholder="Write your message..."
                                    value={form.message}
                                    onChange={(e) => handleInputChange("message", e.target.value)}
                                ></textarea>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className={`cursor-pointer border-2 ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-white border-[#B17457] text-[#B17457] hover:bg-[#B17457] hover:text-[#FAF7F0]'} px-6 py-2 md:px-8 md:py-3 rounded-md transition-colors`}
                                    disabled={emailError !== "" || phoneError !== "" || !form.email || !form.phoneNumber}
                                >
                                    Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}