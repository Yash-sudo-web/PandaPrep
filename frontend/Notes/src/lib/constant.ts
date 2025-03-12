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
  