"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import app from "@/firebase/firebaseconfig";
import { Funnel_Display } from "next/font/google";
import Navbar from "@/components/global/navbar";
import { PlaceholdersAndVanishInput } from "@/components/ui/input-text";
import { cn } from "@/lib/utils";
import MultiTabSwitch from "@/components/ui/option-switch";
import axios from "axios";
import { BASE_URL } from "@/lib/constant";
import PDFLikeMarkdownDisplay from "@/components/global/PDFdisplay";
import { getCookie } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  montserrat400,
  montserrat500,
  montserrat600,
  montserrat700,
  montserrat800,
} from "@/lib/font-utils";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookText,
  ChartLine,
  CheckCircle,
  FileText,
  Lightbulb,
  Settings,
  Sparkles,
  AlertCircle,
  Download,
  Redo,
  Loader2,
} from "lucide-react";

import AnimatedInput from "@/components/global/input";
import { Switch } from "@/components/ui/switch";

const funnel_display = Funnel_Display({
  subsets: ["latin"],
  weight: "400",
});

const NotesGenerate = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const auth = getAuth(app);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");
  const [requestId, setRequestId] = useState("");
  const [generationComplete, setGenerationComplete] = useState(false);
  const [downloadId, setDownloadId] = useState("");
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(true);
  const [userCredits, setUserCredits] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const [stepsCompleted, setStepsCompleted] = useState<{
    [key: number]: boolean;
  }>({
    0: false,
    1: false,
    2: false,
  });
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

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

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const togglePreview = () => {
    setShowPreview((prev) => !prev);
  };

  const isDarkMode = mounted && resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);

  useEffect(() => {
    if (idToken) {
      handleGetUser();
    }
  }, [idToken]);

  const [formData, setFormData] = useState({
    email: user?.email,
    syllabus: "",
    subject_name: "",
    user_instructions: "",
    note_type: "concise",
    include_examples: "yes",
    include_images: "no",
  });

  useEffect(() => {
    validateSteps();
  }, [formData]);

  const validateSteps = () => {
    const step1Valid = !!formData.subject_name.trim();

    const step2Valid =
      !!formData.syllabus.trim() && formData.syllabus.length >= 10;

    const step3Valid = true;

    setStepsCompleted({
      0: step1Valid,
      1: step2Valid,
      2: step3Valid,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const connectWebSocket = (reqId: string) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsUrl = `${BASE_URL.replace("http", "ws")}/ws?requestId=${reqId}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
        } else if (data.type === "stage_update") {
          setCurrentStage(data.stage);

          if (data.stage === "generation_complete") {
            setGenerationComplete(true);
            setIsGenerating(false);
            setShowGenerateButton(true);
            setHasAttemptedGeneration(true);
            if (data.data && data.data.downloadId) {
              setDownloadId(data.data.downloadId);
            }
          }
        } else if (data.type === "content_update") {
          setMarkdownContent(data.content);
        } else if (data.type === "error") {
          setError(data.message);
          setIsGenerating(false);
          setShowGenerateButton(true);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
        setError("Failed to process server response");
        setIsGenerating(false);
        setShowGenerateButton(true);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      if (isGenerating) {
        setError("Connection closed unexpectedly. Please try again.");
        setIsGenerating(false);
        setShowGenerateButton(true);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError(
        "WebSocket connection error. Please check your internet connection."
      );
      setIsGenerating(false);
      setShowGenerateButton(true);
    };

    socketRef.current = socket;
  };

  const handleGetUser = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/user/get`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      setUserCredits(res.data.subscription.credits);
    } catch (error: any) {
      console.error("Error fetching user data:", error);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: boolean } = {};

    if (!formData.subject_name.trim()) {
      errors.subject_name = true;
    }

    if (!formData.syllabus.trim() || formData.syllabus.length < 10) {
      errors.syllabus = true;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        setError("Please fill in all required fields correctly.");
        return;
      }
      setCurrentStep(3);
      setIsGenerating(true);
      setShowGenerateButton(false);
      setError("");
      setMarkdownContent("");
      setCurrentStage("initializing");
      setGenerationComplete(false);
      setDownloadId("");

      const response = await axios.post(
        `${BASE_URL}/pipeline/generate-notes`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.data.success) {
        if (response.data && response.data.requestId) {
          setRequestId(response.data.requestId);
          connectWebSocket(response.data.requestId);
        }
      }
    } catch (error) {
      console.error("Error generating notes:", error);
      if (error) {
        if (axios.isAxiosError(error) && error.response) {
          setError(error.response.data.error || "Server error occurred");
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } else {
        setError(
          "Error generating notes. Please check your connection and try again."
        );
      }
      setIsGenerating(false);
      setShowGenerateButton(true);
    }
  };

  const downloadGeneratedNotes = () => {
    if (downloadId) {
      try {
        // Create a temporary link element
        const link = document.createElement("a");
        link.href = downloadId; // Directly use the URL

        // Set target to _blank to open in a new tab
        link.target = "_blank";

        // Extract filename from URL or use a default
        const urlParts = downloadId.split("/");
        const defaultFilename = `${
          formData?.subject_name || "generated"
        }_notes.pdf`;
        const filename = urlParts[urlParts.length - 1] || defaultFilename;

        link.download = filename;

        // Append to the document, trigger click, and remove the link
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error downloading notes:", error);
        // Fix the TypeScript error with proper type checking
        if (error instanceof Error) {
          setError(`Failed to download notes: ${error.message}`);
        } else {
          setError("Failed to download notes. Please try again.");
        }
      }
    } else {
      setError("No download URL available. Please generate notes first.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth");
      } else {
        setUser(user);
      }
    });

    return () => {
      unsubscribe();
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [auth, router]);

  const renderGenerationStatus = () => {
    if (!isGenerating && !generationComplete) return null;

    let statusMessage = "";
    let statusColor = isDarkMode
      ? "border-green-900"
      : "bg-green-50 border-green-200";
    let statusTextColor = isDarkMode ? "text-white" : "text-green-700";

    if (error) {
      statusColor = isDarkMode ? "border-red-900" : "bg-red-50 border-red-200";
      statusTextColor = isDarkMode ? "text-white" : "text-red-700";
      statusMessage = error;
    } else {
      switch (currentStage) {
        case "initializing":
          statusMessage = "Initializing generation process...";
          break;
        case "generation_started":
          statusMessage = "Starting note generation...";
          break;
        case "analyzing_syllabus":
          statusMessage = "Analyzing syllabus content...";
          break;
        case "syllabus_analyzed":
          statusMessage = "Syllabus analysis complete!";
          break;
        case "generating_image_suggestions":
          statusMessage = "Generating image suggestions...";
          break;
        case "downloading_images":
          statusMessage = "Finding and downloading images...";
          break;
        case "integrating_images":
          statusMessage = "Integrating images into notes...";
          break;
        case "generating_pdf":
          statusMessage = "Creating PDF document...";
          break;
        case "pdf_generation_complete":
          statusMessage = "PDF generation complete!";
          break;
        case "generation_complete":
          statusMessage = "Notes successfully generated!";
          break;
        default:
          statusMessage = `Processing: ${currentStage.replace(/_/g, " ")}`;
      }
    }

    return (
      <div
        className={` p-3 ${statusColor} border rounded-md flex items-center`}
      >
        {isGenerating && <Loader2 className="animate-spin" size={20} />}
        <p className={statusTextColor}>{statusMessage}</p>
      </div>
    );
  };

  const steps = ["Subject", "Content", "Format", "Result"];
  const stepIcons = [
    <BookText key="book-text-icon" size={20} />,
    <FileText key="file-text-icon" size={20} />,
    <Settings key="settings-icon" size={20} />,
    <BookOpen key="book-open-icon" size={20} />,
  ];

  const placeholders = [
    "Enter subject...",
    "E.g., Database Systems",
    "E.g., Data Structures",
    "E.g., Computer Networks",
  ];

  const [currentStep, setCurrentStep] = useState(0);

  const progressPercent = (currentStep / (steps.length - 1)) * 100;

  const handleStepClick = (index: number) => {
    if (index === 3 && !hasAttemptedGeneration) {
      return;
    }
    setCurrentStep(index);
  };

  const step1Component = () => {
    return (
      <div className="px-4 pt-1">
        <div className="pb-5">
          <div className={`${montserrat500.className} text-4xl flex gap-2`}>
            <BookText size={40} className={`text-[#B17457] mb-2`} />
            <p>Enter Your Subject</p>
          </div>

          <p className={`${montserrat400.className} text-lg`}>
            Let&apos;s start by defining what you want to learn about
          </p>
        </div>
        <div className="w-full space-y-2">
          <p
            className={`${montserrat500.className} text-2xl ${
              validationErrors.subject_name ? "text-red-500" : ""
            }`}
          >
            Subject Name{" "}
            {validationErrors.subject_name && (
              <span className="text-red-500">*</span>
            )}
          </p>
          <div className="relative">
            <AnimatedInput
              textarea={false}
              formDataValue={formData.subject_name}
              handleInputChange={handleInputChange}
              fieldKey="subject_name"
              placeholders={placeholders}
              className={validationErrors.subject_name ? "border-red-500" : ""}
            />
            {validationErrors.subject_name && (
              <p className="text-red-500 text-sm mt-1">
                Subject name is required
              </p>
            )}
          </div>
        </div>

        <div className="w-full py-5 flex flex-col gap-1">
          <p className={`${montserrat500.className} py-2 text-2xl`}>
            Education Level
          </p>
          <MultiTabSwitch
            tabs={[
              { label: "Beginner", value: "beginner" },
              { label: "Intermediate", value: "intermediate" },
              { label: "Advanced", value: "advanced" },
            ]}
            lgSize
            handleChange={handleInputChange}
            field="note_type"
            userCredits={userCredits}
          />
        </div>
        <div className="mt-4 bg-[#F3EFE5] p-3 rounded-xl border-4 border-[#B17457]">
          <div className="text-[#4A4947] flex gap-2 items-center">
            <Lightbulb />
            <p className={`${montserrat500.className} text-2xl`}>Tip</p>
          </div>
          <p className={`${montserrat400.className}`}>
            Be specific with your subject to get more targeted notes. For
            example, “Introduction to Neural Networks” is better than just
            “Machine Learning”.
          </p>
        </div>
      </div>
    );
  };

  const step2Component = () => {
    return (
      <div className="px-4 pt-1">
        <div className="pb-5">
          <div className={`${montserrat500.className} text-4xl flex gap-2`}>
            <FileText size={40} className={`text-[#B17457] mb-2`} />
            <p>Content Details</p>
          </div>

          <p className={`${montserrat400.className} text-lg`}>
            Provide more information about what you want to learn
          </p>
        </div>
        <div className="w-full space-y-2">
          <p
            className={`${montserrat500.className} pt-4 text-2xl ${
              validationErrors.syllabus ? "text-red-500" : ""
            }`}
          >
            Syllabus or Topic Outline{" "}
            {validationErrors.syllabus && (
              <span className="text-red-500">*</span>
            )}
          </p>
          <div className="relative">
            <AnimatedInput
              textarea={true}
              formDataValue={formData.syllabus}
              handleInputChange={handleInputChange}
              fieldKey="syllabus"
              placeholders={[
                "Enter your syllabus...",
                "E.g., Basic concepts: database & database users, characteristics of the database systems, concepts and architecture, data models, schemas & instances, DBMS architecture & data independence........",
                "E.g., The basic human aspirations and their fulfillment through Right understanding and Resolution, Right understanding and Resolution as the activities of the Self, Self being central to Human Existence.......",
              ]}
              className={validationErrors.syllabus ? "border-red-500" : ""}
            />
            {validationErrors.syllabus && (
              <p className="text-red-500 text-sm mt-1">
                Syllabus is required and should be at least 10 characters
              </p>
            )}
            <p className={`${montserrat400.className} text-sm text-[#4A4947]`}>
              List the main topics you want to be covered in your notes
            </p>
          </div>

          <div className="w-full space-y-2 ">
            <p className={`${montserrat500.className} pt-5 text-2xl`}>
              {" "}
              User Instructions (Optional)
            </p>
            <div className="relative">
              <AnimatedInput
                textarea={true}
                formDataValue={formData.user_instructions}
                handleInputChange={handleInputChange}
                fieldKey="user_instructions"
                placeholders={[
                  "Enter your instructions...",
                  "E.g., Elaborate more on ER diagrams",
                  "E.g., Go in depth on the topic of Normalization",
                ]}
              />
              <p
                className={`${montserrat400.className} text-sm text-[#4A4947]`}
              >
                Any specific requirements or focus areas for your notes
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const step3Component = () => {
    return (
      <div className="px-4 pt-1">
        <div className="pb-5">
          <div className={`${montserrat500.className} text-4xl flex gap-2`}>
            <Settings size={40} className="text-[#B17457] mb-2" />
            <p>Format Options</p>
          </div>
          <p className={`${montserrat400.className} text-lg`}>
            Customize how your notes will be presented
          </p>
        </div>

        <div className={`${montserrat500.className} text-2xl pt-3 pb-5`}>
          Note Format
        </div>

        <div className="w-full space-y-2 pb-8">
          <div className="bg-[#D9D9D9] rounded-xl p-1.5 flex justify-between items-center">
            {["concise", "qa", "detailed"].map((type) => {
              const isDisabled = type === "detailed" && userCredits <= 0;
              const isSelected = formData.note_type === type;

              return (
                <button
                  key={type}
                  onClick={() => {
                    if (isDisabled) return;
                    setFormData((prev) => ({ ...prev, note_type: type }));
                  }}
                  className={`w-1/3 text-lg font-medium py-2 rounded-lg ${
                    montserrat400.className
                  } ${isSelected ? "bg-white shadow" : "text-gray-700"} ${
                    isDisabled
                      ? "opacity-70 cursor-not-allowed group relative"
                      : "cursor-pointer"
                  }`}
                >
                  {type === "concise"
                    ? "Concise"
                    : type === "qa"
                    ? "Q&A"
                    : "Detailed"}

                  {isDisabled && (
                    <>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            width="18"
                            height="11"
                            x="3"
                            y="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white p-2 rounded text-sm w-40 opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:block pointer-events-none">
                        You have 0 credits left!
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div
            className={`${montserrat500.className} flex justify-between text-md text-center text-gray-600 px-1 pt-5`}
          >
            <div className="w-1/3">
              <p>Brief bullet points</p>
              <p>Key concepts only</p>
            </div>
            <div className="w-1/3">
              <p>Question & Answer</p>
              <p>Test Your Knowledge</p>
            </div>
            <div className="w-1/3 relative group">
              <p>Comprehensive</p>
              <p>In-depth explanations</p>
            </div>
          </div>
        </div>
        <div className="bg-[#D9D9D966] rounded-xl p-1.5 flex justify-between items-center mt-5 h-[65px]">
          <div className="pl-3 flex items-center gap-3">
            <div className="p-2 bg-[#B1745780] rounded-lg">
              <Lightbulb />
            </div>
            <p className={`${montserrat500.className} text-xl`}>
              Include Examples
            </p>
          </div>
          <div className="pr-4">
            <Switch
              checked={formData.include_examples === "yes"}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  include_examples: checked ? "yes" : "no",
                }))
              }
            />
          </div>
        </div>
        <div className="bg-[#D9D9D966] rounded-xl p-1.5 flex justify-between items-center mt-5 h-[65px]">
          <div className="pl-3 flex items-center gap-3">
            <div className="p-2 bg-[#B1745780] rounded-lg">
              <ChartLine />
            </div>
            <p
              className={`${montserrat500.className} text-xl flex items-center`}
            >
              Include Visuals
              <span className="ml-2 relative group">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                <div className="absolute left-0 bottom-full mb-2 bg-gray-800 text-white p-2 rounded text-sm w-48 opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:block pointer-events-none">
                  This is an experimental feature
                </div>
              </span>
            </p>
          </div>
          <div className="pr-4">
            <Switch
              checked={formData.include_images === "yes"}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  include_images: checked ? "yes" : "no",
                }))
              }
            />
          </div>
        </div>
      </div>
    );
  };

  const step4Component = () => {
    if (!hasAttemptedGeneration && !isGenerating) {
      return (
        <div className="px-4 pt-1 h-full flex flex-col items-center justify-center">
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-gray-600" />
              </div>
              <h2 className={`${montserrat500.className} text-2xl`}>
                No Notes Generated Yet
              </h2>
              <p className={`${montserrat400.className} text-sm mt-2`}>
                Please complete steps 1-3 and generate your notes first.
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(0)}
              className="cursor-pointer px-4 py-2 border rounded-lg bg-[#B17457] text-white transition-colors flex items-center gap-2 hover:bg-[#8f523a] mx-auto"
            >
              <span className="text-lg">Start from beginning</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      );
    }

    const title = isGenerating
      ? "Your Notes are being generated"
      : "Your Notes are Ready!";

    const message = isGenerating
      ? "Please wait while we prepare your notes..."
      : generationComplete
      ? "Here's a preview of what we've created"
      : "";

    return (
      <div>
        <div className="pb-5 px-4 flex justify-between items-center border-b border-gray-300">
          <div className="flex items-center gap-2 text-4xl">
            <BookOpen size={40} className="text-[#B17457]" />
            <p className={`${montserrat500.className}`}>Generated Notes</p>
          </div>

          <div className="flex items-center gap-3">
            {isGenerating && markdownContent && (
              <button
                onClick={togglePreview}
                className={`${montserrat500.className} h-10 flex items-center gap-1 px-3 cursor-pointer border border-[#B17457] rounded-md hover:bg-gray-100 transition text-sm`}
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            )}
            <button
              onClick={downloadGeneratedNotes}
              className={`${
                montserrat500.className
              } h-10 flex items-center gap-1 px-3 cursor-pointer border border-[#B17457] rounded-md hover:bg-gray-100 transition text-sm ${
                !generationComplete || !downloadId
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={!generationComplete || !downloadId}
            >
              <Download size={20} />
              Download
            </button>
          </div>
        </div>

        <div className="px-4 pt-1 h-full flex flex-col items-center justify-center">
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <div
                className={`w-16 h-16 ${
                  isGenerating ? "bg-[#B1745780]" : "bg-[#B17457]"
                } rounded-full flex items-center justify-center mx-auto mb-4`}
              >
                {isGenerating ? (
                  <Loader2 size={32} className="text-white animate-spin" />
                ) : (
                  <Sparkles size={32} className="text-white" />
                )}
              </div>
              <h2 className={`${montserrat500.className} text-2xl`}>{title}</h2>
              <p className={`${montserrat400.className} text-sm mt-2`}>
                {message}
              </p>
            </div>
          </div>

          <div className="w-[60rem] h-[22rem] rounded-2xl bg-gray-100 border border-gray-300 flex items-center justify-center relative overflow-hidden">
            {isGenerating ? (
              showPreview && markdownContent ? (
                <div className="w-full h-full">
                  <PDFLikeMarkdownDisplay
                    markdownContent={markdownContent}
                    isGenerating={isGenerating}
                    downloadId=""
                  />
                </div>
              ) : (
                <div className="text-center backdrop-blur-md bg-white/30 absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin h-10 w-10 text-gray-500 mx-auto mb-4" />
                  <p className={`${montserrat500.className} text-gray-500`}>
                    Generating your notes...
                  </p>
                </div>
              )
            ) : generationComplete && markdownContent ? (
              <iframe
                src={`${downloadId}#zoom=80&toolbar=0&navpanes=0`}
                className="w-full h-full border-0 rounded-lg"
                title="PDF Viewer"
              />
            ) : (
              <div className="text-center">
                <p className={`${montserrat500.className} text-gray-500`}>
                  No preview available
                </p>
                {error && <p className="text-red-500 mt-2">{error}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="bg-[#F3EFE5] pt-20">
        <Navbar />
        <div
          className={`text-center text-5xl text-[#4A4947] pt-16 pb-10 ${montserrat600.className}`}
        >
          Generate Notes
        </div>
        <div className="flex flex-col items-center px-6 pb-10 w-full">
          <div className="relative h-6 mb-16 w-4/5">
            <div className="absolute top-1/2 -translate-y-1/2 w-full h-4 rounded-2xl bg-[#D9D9D9]" />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-4 rounded-2xl bg-[#B17457] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />

            <div className="absolute top-full left-0 w-full mt-2">
            {steps.map((label, index) => {
  const edgeInset = 2;
  const stepCount = steps.length - 1;
  const leftPercent =
    edgeInset + ((100 - edgeInset * 2) / stepCount) * index;
  const isErrorState =
    (index === 0 && validationErrors.subject_name) ||
    (index === 1 && validationErrors.syllabus);
  const isNotClickable = index === 3 && !hasAttemptedGeneration;
  return (
    <div
      key={index}
      className={`absolute -translate-x-1/2 text-center ${isNotClickable ? "pointer-events-none opacity-50" : ""}`}
      style={{ left: `${leftPercent}%` }}
      onClick={() => handleStepClick(index)}
    >
      <div
        className={`w-10 h-10 ${isNotClickable ? "cursor-not-allowed" : "cursor-pointer"} mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
          isErrorState
            ? "bg-red-100 border-2 border-red-500"
            : currentStep >= index
            ? "bg-white border-2 border-[#B17457] text-[#B17457]"
            : "bg-[#D9D9D9] text-gray-600"
        }`}
      >
        {stepsCompleted[index] && currentStep > index ? (
          <CheckCircle
            color={isErrorState ? "#EF4444" : "#B17457"}
            size={24}
          />
        ) : isErrorState ? (
          <AlertCircle color="#EF4444" size={24} />
        ) : (
          React.cloneElement(stepIcons[index], {
            color: currentStep >= index ? "#B17457" : "#4A4947",
          })
        )}
      </div>
      <div
        className={`text-sm mt-1 ${
          isErrorState ? "text-red-500 font-medium" : ""
        }`}
      >
        {label}
      </div>
    </div>
  );
})}
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 min-h-[300px] w-[65rem] mt-10">
            <div className="flex flex-col gap-4 h-[40rem]">
              {currentStep === 0 && step1Component()}
              {currentStep === 1 && step2Component()}
              {currentStep === 2 && step3Component()}
              {currentStep === 3 && step4Component()}
            </div>
            <hr className="border-none h-px bg-[rgba(0,0,0,0.19)] my-4 -mx-6" />

            <div
              className={`flex ${
                currentStep === 0 ? "justify-end" : "justify-between"
              } mt-6 mx-10`}
            >
              {currentStep !== 0 && currentStep !== 3 && (
                <button
                  className="cursor-pointer px-4 py-2 border border-[#B17457] rounded transition-colors flex items-center gap-2 hover:bg-gray-100"
                  onClick={() =>
                    setCurrentStep((prev) => Math.max(prev - 1, 0))
                  }
                >
                  <ArrowLeft size={20} />
                  <span className="text-lg">Back</span>
                </button>
              )}

              {currentStep < 3 && (
                <button
                  className="cursor-pointer px-4 py-2 border rounded-lg bg-[#B17457] text-white transition-colors flex items-center gap-2 hover:bg-[#8f523a]"
                  onClick={() => {
                    if (currentStep === 2) {
                      handleSubmit();
                    } else {
                      setCurrentStep((prev) =>
                        Math.min(prev + 1, steps.length - 1)
                      );
                    }
                  }}
                >
                  <span className="text-lg">
                    {currentStep === 2 ? "Generate Notes" : "Continue"}
                  </span>
                  {currentStep === 2 ? (
                    <Sparkles size={20} />
                  ) : (
                    <ArrowRight size={20} />
                  )}
                </button>
              )}
              {currentStep === 3 && (
                <div className="flex justify-between items-center w-full">
                  <div className="-ml-4">{renderGenerationStatus()}</div>

                  <div className="flex gap-4 ml-10 -mr-6">
                    <button
                      onClick={handleSubmit}
                      className="cursor-pointer px-4 py-2 border rounded-lg bg-white text-black transition-colors flex items-center gap-2 border-[#B17457] hover:bg-gray-100"
                    >
                      <Redo size={20} />
                      <span className="text-lg">Regenerate</span>
                    </button>

                    <button
                      className="cursor-pointer px-4 py-2 border rounded-lg bg-[#B17457] text-white transition-colors flex items-center gap-2 hover:bg-[#8f523a]"
                      onClick={() => {
                        setCurrentStep(0);
                        setFormData({
                          email: user?.email,
                          syllabus: "",
                          subject_name: "",
                          user_instructions: "",
                          note_type: "concise",
                          include_examples: "yes",
                          include_images: "no",
                        });
                        setMarkdownContent("");
                      }}
                    >
                      <span className="text-lg">Create New Notes</span>
                      <Sparkles size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesGenerate;
