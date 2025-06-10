"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Send,
  Loader2,
  X,
  Sparkles,
  MessageCircle,
  Eye,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/global/navbar";
import { toast, Toaster } from "sonner";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import axios from "axios";
import { BASE_URL } from "@/lib/constant";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

export default function PDFChatPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showPdfViewer, setShowPdfViewer] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatCollapsed, setChatCollapsed] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const auth = getAuth();

  const isDarkMode = mounted && resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [uploadedFile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
      } else {
        setUser(user);
        const token = await user.getIdToken();
        setIdToken(token);
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleFileUpload = async (file: File) => {
    if (file.type === "application/pdf") {
      setMessages([]);
      setUploadedFile(file);
      setShowPdfViewer(false);

      try {
        const formData = new FormData();
        const email = user?.email || "";
        formData.append("pdf", file);
        formData.append("userId", email);
        formData.append("purpose", "chatWithPDFs");

        const fileName = file.name;
        const uploadUrl = await axios.post(
          `${BASE_URL}/commons/upload-pdf`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        const pdfUrl = uploadUrl.data.cloudinaryData.secure_url;

        const response = await axios.post(
          `${BASE_URL}/chat/process-pdf`,
          {
            relativeUrl: pdfUrl,
            email: email,
            fileName: fileName,
          },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        const data = await response.data;
        console.log("PDF upload response:", data);

        if (!data.success) {
          throw new Error(data.message || "Failed to process PDF");
        }

        // Set new documentId and clear previous messages
        const newDocumentId = data.data.documentId;
        setDocumentId(newDocumentId);

        toast.success("PDF processed successfully");
      } catch (error) {
        console.error("Error uploading PDF:", error);
        toast.error("Failed to process PDF");
        setUploadedFile(null);
        setDocumentId(null);
        setPdfUrl(null);
        setMessages([]);
      }
    } else {
      toast.error("Please upload a PDF file only");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setShowPdfViewer(false);
    setMessages([]);
    setDocumentId(null);
    setPdfUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    if (!documentId) {
      toast.error("Please upload a PDF first");
      return;
    }
    if (!input.trim()) return;

    // Get the auth token
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      toast.error("Please sign in to chat");
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    };

    const pendingMessage: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      pending: true,
    };

    // Update messages with new messages while preserving history
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, userMessage, pendingMessage];
      return updatedMessages;
    });

    setInput("");
    setIsLoading(true);

    // Clean up any existing EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      // Make direct fetch call to backend for streaming (axios doesn't handle streams well in browser)
      const response = await fetch(`${BASE_URL}/chat/stream-chat-with-pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          query: input,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let fullResponse = "";
      let hasError = false;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setIsLoading(false);
          setMessages((prevMessages) => {
            const finalMessages = prevMessages.map((msg) =>
              msg.pending
                ? { ...msg, content: fullResponse, pending: false }
                : msg
            );
            return finalMessages;
          });
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                hasError = true;
                throw new Error(data.error);
              }

              if (data.done) {
                setIsLoading(false);
                setMessages((prevMessages) => {
                  const finalMessages = prevMessages.map((msg) =>
                    msg.pending
                      ? { ...msg, content: fullResponse, pending: false }
                      : msg
                  );
                  return finalMessages;
                });
                break;
              }

              if (data.chunk && !hasError) {
                fullResponse += data.chunk;
                // Update messages while preserving history
                setMessages((prevMessages) => {
                  const updatedMessages = prevMessages.map((msg) =>
                    msg.pending ? { ...msg, content: fullResponse } : msg
                  );
                  return updatedMessages;
                });
              }
            } catch (parseError) {
              console.error("Error parsing chunk:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in chat:", error);
      setIsLoading(false);
      toast.error("Failed to get response");
      // Remove pending message while preserving history
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter((msg) => !msg.pending);
        return updatedMessages;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen overflow-hidden flex flex-col">
      <Navbar />
      <Toaster richColors position="top-right" closeButton={true} />
      {/* Main Content with proper spacing */}
      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-24">
        <div className="max-w-7xl mx-auto h-full">
          {!uploadedFile ? (
            <>
              {/* Hero Section with improved spacing */}
              <div className="text-center mb-12 px-4">
                <div
                  className={`inline-flex items-center gap-2 ${
                    isDarkMode ? "bg-[#D29C7B]/10" : "bg-[#B17457]/10"
                  } backdrop-blur-sm rounded-full px-6 py-3 mb-6`}
                >
                  <Sparkles
                    className={`h-4 w-4 ${
                      isDarkMode ? "text-[#D29C7B]" : "text-[#B17457]"
                    }`}
                  />
                  <span
                    className={`${
                      isDarkMode ? "text-[#D0CCC4]" : "text-[#4A4947]"
                    } text-sm font-medium`}
                  >
                    AI-Powered PDF Analysis
                  </span>
                </div>
                <h1
                  className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold ${
                    isDarkMode
                      ? "bg-gradient-to-r from-[#FAF7F0] via-[#D0CCC4] to-[#D29C7B] bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-[#4A4947] via-[#B17457] to-[#4A4947] bg-clip-text text-transparent"
                  } mb-6 leading-tight`}
                >
                  Chat with your PDF
                </h1>
                <p
                  className={`text-base sm:text-lg md:text-xl ${
                    isDarkMode ? "text-[#D0CCC4]/70" : "text-[#4A4947]/70"
                  } max-w-3xl mx-auto leading-relaxed`}
                >
                  Upload any PDF document and have intelligent conversations
                  about its content
                </p>
              </div>
              {/* Upload Section with better spacing */}
              <Card
                className={`${
                  isDarkMode
                    ? "bg-[#1E1D1B]/80 border-[#D29C7B]/20"
                    : "bg-white/90 border-[#B17457]/20"
                } backdrop-blur-xl shadow-2xl max-w-4xl mx-auto`}
              >
                <CardContent className="p-6 sm:p-8 md:p-12">
                  <div
                    className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 md:p-16 text-center transition-all duration-300 group cursor-pointer ${
                      isDragOver
                        ? isDarkMode
                          ? "border-[#D29C7B] bg-[#D29C7B]/10 scale-[1.02]"
                          : "border-[#B17457] bg-[#B17457]/10 scale-[1.02]"
                        : isDarkMode
                        ? "border-[#D0CCC4]/20 hover:border-[#D29C7B]/50 hover:bg-[#1E1D1B]/50"
                        : "border-[#4A4947]/20 hover:border-[#B17457]/50 hover:bg-white/50"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div
                      className={`absolute inset-0 ${
                        isDarkMode
                          ? "bg-gradient-to-r from-[#D29C7B]/10 to-[#D29C7B]/5"
                          : "bg-gradient-to-r from-[#B17457]/10 to-[#B17457]/5"
                      } rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    ></div>

                    <div className="relative z-10">
                      <div
                        className={`w-20 h-20 sm:w-24 sm:h-24 ${
                          isDarkMode
                            ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80"
                            : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80"
                        } rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Upload
                          className={`h-10 w-10 sm:h-12 sm:w-12 ${
                            isDarkMode ? "text-[#FAF7F0]" : "text-white"
                          }`}
                        />
                      </div>

                      <h3
                        className={`text-2xl sm:text-3xl font-bold ${
                          isDarkMode ? "text-[#FAF7F0]" : "text-[#4A4947]"
                        } mb-4`}
                      >
                        Drop your PDF here
                      </h3>
                      <p
                        className={`${
                          isDarkMode ? "text-[#D0CCC4]/60" : "text-[#4A4947]/60"
                        } mb-8 text-lg leading-relaxed`}
                      >
                        Or click to browse and select your document
                      </p>
                      <Button
                        size="lg"
                        className={`${
                          isDarkMode
                            ? "bg-[#D29C7B] hover:bg-[#D29C7B]/80 text-[#1E1D1B]"
                            : "bg-[#B17457] hover:bg-[#B17457]/80 text-[#FAF7F0]"
                        } border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-base font-medium cursor-pointer`}
                      >
                        Choose File
                      </Button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Main Application Layout - Mobile responsive grid */
            <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 h-[calc(100vh-10rem)] overflow-hidden">
              {/* Mobile View Controls */}
              <div className="flex items-center justify-between lg:hidden mb-2 px-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPdfViewer(!showPdfViewer)}
                  className={`${
                    isDarkMode
                      ? "text-[#D0CCC4] hover:text-[#FAF7F0]"
                      : "text-[#4A4947] hover:text-[#4A4947]"
                  }`}
                >
                  {showPdfViewer ? (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Show Chat</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Show PDF</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* PDF Section */}
              <div
                className={`${
                  !showPdfViewer ? "hidden lg:block" : "block"
                } h-full overflow-hidden`}
              >
                <div className="flex flex-col h-full gap-2">
                  {/* File Info Card */}
                  <Card className="shrink-0">
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 ${
                              isDarkMode
                                ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80"
                                : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80"
                            } rounded-lg flex items-center justify-center`}
                          >
                            <FileText
                              className={`h-4 w-4 ${
                                isDarkMode ? "text-[#FAF7F0]" : "text-white"
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3
                              className={`font-medium text-sm truncate ${
                                isDarkMode ? "text-[#FAF7F0]" : "text-[#4A4947]"
                              }`}
                            >
                              {uploadedFile.name}
                            </h3>
                            <p
                              className={`text-xs ${
                                isDarkMode
                                  ? "text-[#D0CCC4]/60"
                                  : "text-[#4A4947]/60"
                              }`}
                            >
                              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                              • Ready for analysis
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className={`h-7 w-7 p-0 ${
                            isDarkMode
                              ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              : "text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          }`}
                        >
                          <X className="h-4 w-4 cursor-pointer" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* PDF Viewer */}
                  <Card className="flex-1 overflow-hidden">
                    <CardContent className="p-0 h-full">
                      <div className="h-full">
                        {pdfUrl && (
                          <object
                            data={pdfUrl}
                            type="application/pdf"
                            className="w-full h-full"
                          >
                            <div
                              className={`flex items-center justify-center h-full ${
                                isDarkMode ? "text-[#D0CCC4]" : "text-[#4A4947]"
                              }`}
                            >
                              <div className="text-center p-8">
                                <FileText
                                  className={`h-16 w-16 mx-auto mb-4 ${
                                    isDarkMode
                                      ? "text-[#D29C7B]/50"
                                      : "text-[#B17457]/50"
                                  }`}
                                />
                                <p className="text-lg mb-4">
                                  PDF cannot be displayed in this browser.
                                </p>
                                <Button
                                  onClick={() => window.open(pdfUrl, "_blank")}
                                  className={`${
                                    isDarkMode
                                      ? "bg-[#D29C7B] hover:bg-[#D29C7B]/80 text-[#1E1D1B]"
                                      : "bg-[#B17457] hover:bg-[#B17457]/80 text-[#FAF7F0]"
                                  }`}
                                >
                                  Open PDF in New Tab
                                </Button>
                              </div>
                            </div>
                          </object>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Chat Section */}
              <div
                className={`${
                  showPdfViewer ? "hidden lg:block" : "block"
                } h-full overflow-hidden`}
              >
                <Card className="h-full">
                  <CardContent className="p-3 lg:p-4 h-full flex flex-col">
                    {/* Chat Header */}
                    <div className="shrink-0 flex items-center gap-2 mb-3">
                      <div
                        className={`w-7 h-7 ${
                          isDarkMode
                            ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80"
                            : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80"
                        } rounded-lg flex items-center justify-center`}
                      >
                        <MessageCircle
                          className={`h-4 w-4 ${
                            isDarkMode ? "text-[#FAF7F0]" : "text-white"
                          }`}
                        />
                      </div>
                      <h2
                        className={`text-base font-semibold ${
                          isDarkMode ? "text-[#FAF7F0]" : "text-[#4A4947]"
                        }`}
                      >
                        AI Assistant
                      </h2>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ScrollArea className="h-full">
                        <div className="space-y-3 pr-3">
                          {messages.length === 0 ? (
                            <div className="text-center py-8">
                              <div
                                className={`w-20 h-20 ${
                                  isDarkMode
                                    ? "bg-gradient-to-r from-[#D29C7B]/20 to-[#D29C7B]/10"
                                    : "bg-gradient-to-r from-[#B17457]/20 to-[#B17457]/10"
                                } rounded-3xl flex items-center justify-center mx-auto mb-6`}
                              >
                                <Sparkles
                                  className={`h-10 w-10 ${
                                    isDarkMode
                                      ? "text-[#D29C7B]"
                                      : "text-[#B17457]"
                                  }`}
                                />
                              </div>
                              <h3
                                className={`text-lg font-semibold ${
                                  isDarkMode
                                    ? "text-[#FAF7F0]"
                                    : "text-[#4A4947]"
                                } mb-4`}
                              >
                                Start Analyzing Your PDF
                              </h3>
                              <p
                                className={`${
                                  isDarkMode
                                    ? "text-[#D0CCC4]/60"
                                    : "text-[#4A4947]/60"
                                } mb-6 text-sm leading-relaxed`}
                              >
                                Ask me anything about your document. Here are
                                some suggestions:
                              </p>
                              <div className="flex flex-wrap justify-center gap-2">
                                {[
                                  "Summarize this document",
                                  "What are the key points?",
                                  "Explain the main concepts",
                                ].map((suggestion) => (
                                  <Badge
                                    key={suggestion}
                                    variant="outline"
                                    className={`${
                                      isDarkMode
                                        ? "border-[#D29C7B]/20 text-[#D0CCC4] hover:bg-[#D29C7B]/10"
                                        : "border-[#B17457]/20 text-[#4A4947] hover:bg-[#B17457]/10"
                                    } cursor-pointer transition-colors duration-200 py-2 px-3`}
                                    onClick={() => setInput(suggestion)}
                                  >
                                    {suggestion}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : (
                            messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex gap-4 ${
                                  message.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                {message.role === "assistant" && (
                                  <div
                                    className={`w-10 h-10 ${
                                      isDarkMode
                                        ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80"
                                        : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80"
                                    } rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
                                  >
                                    <Sparkles
                                      className={`h-5 w-5 ${
                                        isDarkMode
                                          ? "text-[#FAF7F0]"
                                          : "text-white"
                                      }`}
                                    />
                                  </div>
                                )}
                                <div
                                  className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg ${
                                    message.role === "user"
                                      ? isDarkMode
                                        ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80 text-[#1E1D1B]"
                                        : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80 text-[#FAF7F0]"
                                      : isDarkMode
                                      ? "bg-[#1E1D1B]/60 backdrop-blur-sm text-[#FAF7F0] border border-[#D29C7B]/20"
                                      : "bg-white/60 backdrop-blur-sm text-[#4A4947] border border-[#B17457]/20"
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap leading-relaxed text-sm">
                                    {message.content}
                                  </p>
                                </div>
                                {message.role === "user" && (
                                  <div
                                    className={`w-10 h-10 ${
                                      isDarkMode
                                        ? "bg-gradient-to-r from-[#D29C7B]/80 to-[#D29C7B]"
                                        : "bg-gradient-to-r from-[#B17457]/80 to-[#B17457]"
                                    } rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
                                  >
                                    <span
                                      className={`${
                                        isDarkMode
                                          ? "text-[#1E1D1B]"
                                          : "text-white"
                                      } text-sm font-semibold`}
                                    >
                                      U
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                          {isLoading && (
                            <div className="flex gap-4 justify-start">
                              <div
                                className={`w-10 h-10 ${
                                  isDarkMode
                                    ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80"
                                    : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80"
                                } rounded-full flex items-center justify-center flex-shrink-0`}
                              >
                                <Sparkles
                                  className={`h-5 w-5 ${
                                    isDarkMode ? "text-[#FAF7F0]" : "text-white"
                                  }`}
                                />
                              </div>
                              <div
                                className={`${
                                  isDarkMode
                                    ? "bg-[#1E1D1B]/60 border-[#D29C7B]/20"
                                    : "bg-white/60 border-[#B17457]/20"
                                } backdrop-blur-sm rounded-2xl px-5 py-4 border`}
                              >
                                <div className="flex items-center gap-3">
                                  <Loader2
                                    className={`h-4 w-4 animate-spin ${
                                      isDarkMode
                                        ? "text-[#D29C7B]"
                                        : "text-[#B17457]"
                                    }`}
                                  />
                                  <span
                                    className={`${
                                      isDarkMode
                                        ? "text-[#D0CCC4]/70"
                                        : "text-[#4A4947]/70"
                                    } text-sm`}
                                  >
                                    Analyzing your document...
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Input Area */}
                    <div className="shrink-0 relative mt-3">
                      <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask me anything about your PDF..."
                        disabled={isLoading}
                        className={`pr-10 h-9 text-sm ${
                          isDarkMode
                            ? "bg-[#1E1D1B]/60 border-[#D29C7B]/20 text-[#FAF7F0] placeholder:text-[#D0CCC4]/50"
                            : "bg-white/60 border-[#B17457]/20 text-[#4A4947] placeholder:text-[#4A4947]/50"
                        } backdrop-blur-sm rounded-lg`}
                        onKeyPress={handleKeyPress}
                      />
                      <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !input.trim()}
                        size="sm"
                        className={`absolute right-1.5 top-1 h-7 w-7 p-0 ${
                          isDarkMode
                            ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80"
                            : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80"
                        } rounded-lg cursor-pointer`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
