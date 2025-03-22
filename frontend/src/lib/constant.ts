export const clients = [...new Array(10)].map((client, index) => ({
  href: `/${index + 1}.png`,
}))

export const BASE_URL = process.env.PROD_BASE_URL || "http://localhost:8000";

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
    price: "$11.99",
    credits: 100,
    features: [
      "Credits - 100",
      "Access to all features",
      
    ],
    limitations: [
      
    ],
  },
  {
    title: "Growth",
    price: "$24.99",
    credits: 500,
    features: [
      "Credits - 500",
      "Access to all features",
      
    ],
    limitations: [
      
    ],
  },
  {
    title: "Scale",
    price: "$44.99",
    credits: 1000,
    features: [
      "Credits - 1000",
      "Access to all features",
      
    ],
    limitations: [],
  },
];
