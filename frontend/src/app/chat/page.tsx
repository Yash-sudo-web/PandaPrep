"use client"

import React, { useState, useRef, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Send, Loader2, X, Sparkles, MessageCircle, Eye, Zap } from "lucide-react"
import Navbar from "@/components/global/navbar"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
}

export default function PDFChatPage() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [showPdfViewer, setShowPdfViewer] = useState<boolean>(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDarkMode = mounted && resolvedTheme === "dark"

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileUpload = (file: File) => {
    if (file.type === "application/pdf") {
      setUploadedFile(file)
      setShowPdfViewer(false)
      setMessages([])
    } else {
      alert("Please upload a PDF file only.")
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const removeFile = () => {
    setUploadedFile(null)
    setShowPdfViewer(false)
    setMessages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (!uploadedFile) {
      alert("Please upload a PDF first.")
      return
    }
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Demo Response"
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  if (!mounted) {
    return null
  }

  return (

    <div className={`min-h-screen ${isDarkMode
        ? "bg-[#1E1D1B]"
        : "bg-[#FAF7F0]"
      }`}>
      <Navbar />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 ${isDarkMode ? "bg-[#D29C7B]/10" : "bg-[#B17457]/10"
            } backdrop-blur-sm rounded-full px-4 py-2 mb-6`}>
            <Sparkles className={`h-4 w-4 ${isDarkMode ? "text-[#D29C7B]" : "text-[#B17457]"
              }`} />
            <span className={`${isDarkMode ? "text-[#D0CCC4]" : "text-[#4A4947]"
              } text-sm font-medium`}>AI-Powered PDF Analysis</span>
          </div>
          <h1 className={`text-5xl mt-11 md:text-6xl font-bold ${isDarkMode
              ? "bg-gradient-to-r from-[#FAF7F0] via-[#D0CCC4] to-[#D29C7B] bg-clip-text text-transparent"
              : "bg-gradient-to-r from-[#4A4947] via-[#B17457] to-[#4A4947] bg-clip-text text-transparent"
            } mb-4`}>
            Chat with your PDF
          </h1>
          <p className={`text-xl ${isDarkMode ? "text-[#D0CCC4]/70" : "text-[#4A4947]/70"
            } max-w-2xl mx-auto`}>
            Upload any PDF document and have intelligent conversations about its content
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {!uploadedFile ? (
            <Card className={`${isDarkMode
                ? "bg-[#1E1D1B]/80 border-[#D29C7B]/20"
                : "bg-white/90 border-[#B17457]/20"
              } backdrop-blur-xl shadow-2xl`}>
              <CardContent className="p-8">
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 group cursor-pointer ${isDragOver
                      ? isDarkMode
                        ? "border-[#D29C7B] bg-[#D29C7B]/10 scale-105"
                        : "border-[#B17457] bg-[#B17457]/10 scale-105"
                      : isDarkMode
                        ? "border-[#D0CCC4]/20 hover:border-[#D29C7B]/50 hover:bg-[#1E1D1B]/50"
                        : "border-[#4A4947]/20 hover:border-[#B17457]/50 hover:bg-white/50"
                    }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={`absolute inset-0 ${isDarkMode
                      ? "bg-gradient-to-r from-[#D29C7B]/10 to-[#D29C7B]/5"
                      : "bg-gradient-to-r from-[#B17457]/10 to-[#B17457]/5"
                    } rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                  <div className="relative z-10">
                    <div className={`w-20 h-20 ${isDarkMode
                        ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80"
                        : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80"
                      } rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Upload className={`h-10 w-10 ${isDarkMode ? "text-[#FAF7F0]" : "text-white"
                        }`} />
                    </div>

                    <h3 className={`text-2xl font-bold ${isDarkMode ? "text-[#FAF7F0]" : "text-[#4A4947]"
                      } mb-3`}>Drop your PDF here</h3>
                    <p className={`${isDarkMode ? "text-[#D0CCC4]/60" : "text-[#4A4947]/60"
                      } mb-6 text-lg`}>Or click to browse and select your document</p>
                    <Button
                      size="lg"
                      className={`${isDarkMode
                          ? "bg-[#D29C7B] hover:bg-[#D29C7B]/80 text-[#1E1D1B]"
                          : "bg-[#B17457] hover:bg-[#B17457]/80 text-[#FAF7F0]"
                        } border-0 shadow-lg hover:shadow-xl transition-all duration-300`}
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
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Chat Section */
            <div className="space-y-6">
              {/* File Info */}
              <Card className={`${isDarkMode
                  ? "bg-[#1E1D1B]/80 border-[#D29C7B]/20"
                  : "bg-white/90 border-[#B17457]/20"
                } backdrop-blur-xl`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${isDarkMode
                          ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80"
                          : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80"
                        } rounded-lg flex items-center justify-center`}>
                        <FileText className={`h-5 w-5 ${isDarkMode ? "text-[#FAF7F0]" : "text-white"
                          }`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${isDarkMode ? "text-[#FAF7F0]" : "text-[#4A4947]"
                          }`}>{uploadedFile.name}</h3>
                        <p className={`text-sm ${isDarkMode ? "text-[#D0CCC4]/60" : "text-[#4A4947]/60"
                          }`}>
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPdfViewer(!showPdfViewer)}
                        className={`${isDarkMode
                            ? "text-[#D0CCC4]/70 hover:text-[#FAF7F0] hover:bg-[#D29C7B]/10"
                            : "text-[#4A4947]/70 hover:text-[#4A4947] hover:bg-[#B17457]/10"
                          }`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {showPdfViewer ? "Hide" : "View"} PDF
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className={`${isDarkMode
                            ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            : "text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          }`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PDF Viewer */}
              {showPdfViewer && (
                <Card className={`${isDarkMode
                    ? "bg-[#1E1D1B]/80 border-[#D29C7B]/20"
                    : "bg-white/90 border-[#B17457]/20"
                  } backdrop-blur-xl overflow-hidden`}>
                  <CardContent className="p-0">
                    <div className="h-96">
                      <iframe src={URL.createObjectURL(uploadedFile)} className="w-full h-full" title="PDF Viewer" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chat Interface */}
              <Card className={`${isDarkMode
                  ? "bg-[#1E1D1B]/80 border-[#D29C7B]/20"
                  : "bg-white/90 border-[#B17457]/20"
                } backdrop-blur-xl shadow-2xl`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-8 h-8 ${isDarkMode
                        ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80"
                        : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80"
                      } rounded-lg flex items-center justify-center`}>
                      <MessageCircle className={`h-4 w-4 ${isDarkMode ? "text-[#FAF7F0]" : "text-white"
                        }`} />
                    </div>
                    <h2 className={`text-xl font-semibold ${isDarkMode ? "text-[#FAF7F0]" : "text-[#4A4947]"
                      }`}>Chat with Notes</h2>
                  </div>

                  <ScrollArea className="h-96 mb-6 pr-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-12">
                          <div className={`w-16 h-16 ${isDarkMode
                              ? "bg-gradient-to-r from-[#D29C7B]/20 to-[#D29C7B]/10"
                              : "bg-gradient-to-r from-[#B17457]/20 to-[#B17457]/10"
                            } rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                            <Sparkles className={`h-8 w-8 ${isDarkMode ? "text-[#D29C7B]" : "text-[#B17457]"
                              }`} />
                          </div>
                          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-[#FAF7F0]" : "text-[#4A4947]"
                            } mb-2`}>Analyze your Notes</h3>

                          <div className="flex flex-wrap justify-center gap-2">
                            <Badge variant="outline" className={`${isDarkMode
                                ? "border-[#D29C7B]/20 text-[#D0CCC4]"
                                : "border-[#B17457]/20 text-[#4A4947]"
                              }`}>
                              "Summarize this document"
                            </Badge>
                            <Badge variant="outline" className={`${isDarkMode
                                ? "border-[#D29C7B]/20 text-[#D0CCC4]"
                                : "border-[#B17457]/20 text-[#4A4947]"
                              }`}>
                              "What are the key points?"
                            </Badge>
                            <Badge variant="outline" className={`${isDarkMode
                                ? "border-[#D29C7B]/20 text-[#D0CCC4]"
                                : "border-[#B17457]/20 text-[#4A4947]"
                              }`}>
                              "Explain the main concepts"
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {message.role === "assistant" && (
                              <div className={`w-8 h-8 ${isDarkMode
                                  ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80"
                                  : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80"
                                } rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                                <Sparkles className={`h-4 w-4 ${isDarkMode ? "text-[#FAF7F0]" : "text-white"
                                  }`} />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg ${message.role === "user"
                                  ? isDarkMode
                                    ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80 text-[#1E1D1B] ml-12"
                                    : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80 text-[#FAF7F0] ml-12"
                                  : isDarkMode
                                    ? "bg-[#1E1D1B]/60 backdrop-blur-sm text-[#FAF7F0] border border-[#D29C7B]/20"
                                    : "bg-white/60 backdrop-blur-sm text-[#4A4947] border border-[#B17457]/20"
                                }`}
                            >
                              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            </div>
                            {message.role === "user" && (
                              <div className={`w-8 h-8 ${isDarkMode
                                  ? "bg-gradient-to-r from-[#D29C7B]/80 to-[#D29C7B]"
                                  : "bg-gradient-to-r from-[#B17457]/80 to-[#B17457]"
                                } rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                                <span className={`${isDarkMode ? "text-[#1E1D1B]" : "text-white"
                                  } text-sm font-semibold`}>U</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <div className={`w-8 h-8 ${isDarkMode
                              ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80"
                              : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80"
                            } rounded-full flex items-center justify-center flex-shrink-0`}>
                            <Sparkles className={`h-4 w-4 ${isDarkMode ? "text-[#FAF7F0]" : "text-white"
                              }`} />
                          </div>
                          <div className={`${isDarkMode
                              ? "bg-[#1E1D1B]/60 border-[#D29C7B]/20"
                              : "bg-white/60 border-[#B17457]/20"
                            } backdrop-blur-sm rounded-2xl px-4 py-3 border`}>
                            <div className="flex items-center gap-2">
                              <Loader2 className={`h-4 w-4 animate-spin ${isDarkMode ? "text-[#D29C7B]" : "text-[#B17457]"
                                }`} />
                              <span className={`${isDarkMode ? "text-[#D0CCC4]/70" : "text-[#4A4947]/70"
                                }`}>Analyzing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="relative">
                    <div className="relative">
                      <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask me anything about your PDF..."
                        disabled={isLoading}
                        className={`pr-12 h-12 ${isDarkMode
                            ? "bg-[#1E1D1B]/60 border-[#D29C7B]/20 text-[#FAF7F0] placeholder:text-[#D0CCC4]/50 focus:border-[#D29C7B] focus:ring-[#D29C7B]/20"
                            : "bg-white/60 border-[#B17457]/20 text-[#4A4947] placeholder:text-[#4A4947]/50 focus:border-[#B17457] focus:ring-[#B17457]/20"
                          } backdrop-blur-sm rounded-xl`}
                        onKeyPress={handleKeyPress}
                      />
                      <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !input.trim()}
                        size="sm"
                        className={`absolute right-2 top-2 h-8 w-8 p-0 ${isDarkMode
                            ? "bg-gradient-to-r from-[#D29C7B] to-[#D29C7B]/80 hover:from-[#D29C7B]/80 hover:to-[#D29C7B]/60"
                            : "bg-gradient-to-r from-[#B17457] to-[#B17457]/80 hover:from-[#B17457]/80 hover:to-[#B17457]/60"
                          } rounded-lg`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}