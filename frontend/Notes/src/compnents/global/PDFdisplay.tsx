import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { motion } from "framer-motion";

const PAGE_WIDTH = "100%"; 
const PAGE_HEIGHT = "auto"; 

const PDFLikeMarkdownDisplay = ({
  markdownContent,
  isGenerating,
}: {
  markdownContent: string;
  isGenerating: boolean;
}) => {
  const [pages, setPages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!markdownContent || markdownContent.trim() === "") {
      setPages([]);
      return;
    }

    const splitContent = markdownContent.split(/\n\n+/);
    const newPages: string[] = [];
    let currentContent = "";

    splitContent.forEach((paragraph) => {
      if (currentContent.length + paragraph.length > 1200) {
        newPages.push(currentContent.trim());
        currentContent = paragraph;
      } else {
        currentContent += `\n\n${paragraph}`;
      }
    });

    if (currentContent) newPages.push(currentContent.trim());

    setPages(newPages);
  }, [markdownContent]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [pages]);

  return (
    <div
      ref={containerRef}
      className="pdf-container flex flex-col items-center gap-6 py-8 overflow-y-auto h-full bg-gray-100 rounded-xl w-full px-4"
      style={{ height: "100vh" }}
    >
      {pages.length === 0 && (
        <p className="text-gray-500 text-lg mt-64 italic text-center">
          {isGenerating
            ? "Notes content will appear here as it's generated..."
            : "Generated notes will appear here"}
        </p>
      )}

      {pages.length > 0 && (
        <div className="overflow-y-auto space-y-6 max-w-[8.5in] w-full px-4">
          {pages.map((page, index) => (
            <motion.div
              key={`page-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="pdf-page bg-white shadow-lg rounded-lg overflow-hidden p-10 border border-gray-300 text-lg leading-relaxed font-serif text-black text-justify w-full"
              style={{ maxWidth: "8.5in", minHeight: "auto" }}
            >
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{page}</ReactMarkdown>
              <div className="text-right text-gray-400 text-sm mt-4">
                Page {index + 1} of {pages.length}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PDFLikeMarkdownDisplay;
