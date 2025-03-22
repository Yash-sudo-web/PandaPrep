'use client';

import Navbar from "@/compnents/global/navbar";
import { cn } from "@/lib/utils";
import { Funnel_Display } from "next/font/google";
import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/lib/constant";

const funnel_display = Funnel_Display({
    subsets: ["latin"],
    weight: "400",
});

type SubjectOption = {
    value: string;
    label: string;
};

export default function Contact() {
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
            const res = await axios.post(`${BASE_URL}/contact`, form );
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
            // Handle error
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

    return (
        <main
            className={cn(
                "bg-[radial-gradient(circle_at_center,_#d1fae5,_white)] min-h-screen flex flex-col items-center",
                funnel_display.className
            )}
        >
            <Navbar />

            <section className="w-full max-w-5xl px-4 flex flex-col items-center mt-28 mb-20">
                <h1 className="text-4xl font-bold mb-2 text-center text-green-700">Contact Us</h1>
                <p className="text-gray-600 mb-10 text-center">Any question or remarks? Just write us a message!</p>

                <div className="flex w-full bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-green-800 text-white p-8 w-2/5 relative">
                        <h2 className="text-2xl font-semibold mb-1">Contact Information</h2>
                        <p className="text-gray-300 mb-8">Say something to start a live chat!</p>

                        <div className="space-y-6 mt-10">
                            <div className="space-y-6 mt-10">
                                <div className="flex items-center">
                                    <div className="mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                            <rect x="2" y="9" width="4" height="12"></rect>
                                            <circle cx="4" cy="4" r="2"></circle>
                                        </svg>
                                    </div>
                                    <a href="https://www.linkedin.com/in/soumilsuri/" target="_blank" rel="noopener noreferrer" className="hover:underline">
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
                                    <a href="https://www.linkedin.com/in/lakshay-sharma-242907259/" target="_blank" rel="noopener noreferrer" className="hover:underline">
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
                                    <a href="https://www.linkedin.com/in/yash-mathur-3a2aa21b7/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        Yash Mathur 
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <div className="mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                </div>
                                <span>tshifthappens@gmail.com</span>
                            </div>

                            <div className="flex items-center">
                                <div className="mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                </div>
                                <div>
                                    <p>Delhi</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 w-3/5">
                        <form className="space-y-6" onSubmit={handleSendMessage}>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        className="w-full border-b border-gray-300 py-2 px-3 focus:outline-none focus:border-black bg-neutral-800 rounded-xl"
                                        value={form.firstName}
                                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        className="w-full border-b border-gray-300 py-2 px-3 focus:outline-none focus:border-black bg-neutral-800 rounded-xl"
                                        value={form.lastName}
                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                {inputFields.map((field, index) => (
                                    <div key={index}>
                                        <label className="block text-sm text-gray-600 mb-1">{field.placeholder}</label>
                                        <input
                                            type={field.type}
                                            className="w-full border-b border-gray-300 py-2 px-3 focus:outline-none focus:border-black bg-neutral-800 rounded-xl"
                                            value={field.value}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            placeholder={field.inputPlaceholder || ''}
                                        />
                                        {field.error && <p className="text-red-500 text-sm">{field.error}</p>}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-3">Select Subject?</label>
                                <div className="flex space-x-4 text-gray-600">
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
                                            <label htmlFor={`subject-${option.value}`} className="text-sm">{option.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Message</label>
                                <textarea
                                    className="w-full border-b border-gray-300 py-2 px-3 focus:outline-none focus:border-black bg-neutral-800 rounded-xl"
                                    rows={4}
                                    placeholder="Write your message..."
                                    value={form.message}
                                    onChange={(e) => handleInputChange("message", e.target.value)}
                                ></textarea>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-neutral-800 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors"
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