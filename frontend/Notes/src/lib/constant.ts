export const clients = [...new Array(10)].map((client, index) => ({
    href: `/${index + 1}.png`,
}))



export const products = [
    {
      area: "row-span-2 col-span-2",
      icon: "📝", 
      title: "Ace Exams in 5 Minutes",
      description: "Get concise, high-quality notes that help you master any subject quickly.",
    },
    {
      area: "col-span-1",
      icon: "🔍",
      title: "Smart Filters",
      description: "Easily find and organize your notes with AI-powered filtering.",
    },
    {
      area: "col-span-1",
      icon: "📚",
      title: "All Your Notes, One Place",
      description: "Keep all your notes well-organized and accessible in one central hub.",
    },
    {
      area: "row-span-2",
      icon: "💬",
      title: "Chat with Your PDFs",
      description: "Interact with your study materials using AI to get instant insights.",
    },
    {
      area: "col-span-2",
      icon: "🤖",
      title: "Your AI Study Buddy",
      description: "Get AI-generated insights, suggestions, and explanations while studying.",
    },
    {
      area: "col-span-1",
      icon: "🌍",
      title: "Multilingual Note Generation",
      description: "Generate notes in multiple languages for global accessibility.",
    },
    {
      area: "col-span-1",
      icon: "🌙",
      title: "Dark Mode for Late-Night Studying",
      description: "Reduce eye strain with a sleek dark mode for night study sessions.",
    },
  ];

  export const faqs = [
    {
      question: "How much does Pandaprep cost to use?",
      answer: "Pandaprep is free to use with premium features available for a subscription.",
    },
    {
      question: "How do I integrate my own knowledge bases?",
      answer: "You can integrate your knowledge bases via API or file uploads.",
    },
    {
      question: "Is collaboration and space sharing supported?",
      answer: "Yes, Pandaprep allows real-time collaboration and shared workspaces.",
    },
    {
      question: "How does Pandaprep work?",
      answer: "Pandaprep uses AI to generate, organize, and manage your notes efficiently.",
    },
    {
      question: "Can I access Pandaprep via API?",
      answer: "Yes, Pandaprep provides an API for integration with other applications.",
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
  