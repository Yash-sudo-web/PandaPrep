export const clients = [...new Array(10)].map((client, index) => ({
  href: `/${index + 1}.png`,
}))

export const BASE_URL = "http://localhost:8000/api";

export const faqs = [
  {
    question: "How much does Pandaprep cost to use?",
    answer: "Pandaprep is free to use with premium features available via subscription.",
  },
  {
    question: "How does Pandaprep work?",
    answer: "Pandaprep uses AI to generate, organize, and manage your notes efficiently.",
  },
  {
    question: "Can I access Pandaprep via API?",
    answer: "API integration will be available soon.",
  },
  {
    question: "How is my data being stored and managed?",
    answer: "Your data is securely stored with encryption and can be managed from your account settings.",
  },
  {
    question: "Is using Pandaprep considered cheating?",
    answer: "No, Pandaprep is a productivity tool designed to enhance learning and efficiency.",
  },
];


export const PLANS = [
  {
    title: "Starter",
    price: "₹800",
    cost: 800,
    credits: 100,
    features: [
      "Credits - 100",
      "Access to all features",
      "₹8/credit",
    ],
    limitations: [
      
    ],
  },
  {
    title: "Growth",
    price: "₹2000",
    cost: 2000,
    credits: 500,
    features: [
      "Credits - 500",
      "Access to all features",
      "₹4/credit",
    ],
    limitations: [
      
    ],
  },
  {
    title: "Scale",
    price: "₹3500",
    cost: 3500,
    credits: 1000,
    features: [
      "Credits - 1000",
      "Access to all features",
      "₹3.5/credit",
    ],
    limitations: [],
  },
];
