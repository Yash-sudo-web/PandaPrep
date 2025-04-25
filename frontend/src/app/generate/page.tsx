"use client";

import { useEffect, useState, useRef } from "react";
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

    // Check auth state and redirect if not logged in
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

  const toggleView = () => {
    setShowPreview((prev) => !prev);
  };

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDarkMode = mounted && resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  const socketRef = useRef<WebSocket | null>(null);
  let email = "";

  useEffect(() => {
    email = getCookie("email") || "";
    setFormData((prev) => ({ ...prev, email: email }));
  }, []);

  useEffect(() => {
    if (idToken) {
      handleGetUser();
    }
  }, [idToken]);

  const [formData, setFormData] = useState({
    email: email,
    syllabus: "",
    subject_name: "",
    user_instructions: "",
    note_type: "concise",
    include_examples: "no",
    include_images: "no",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const connectWebSocket = (reqId: string) => {
    // Close existing socket if it exists
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Create a new WebSocket connection
    const wsUrl = `${BASE_URL.replace("http", "ws")}/ws?requestId=${reqId}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message:", data);

        if (data.type === "connected") {
          console.log("WebSocket connection confirmed");
        } else if (data.type === "stage_update") {
          setCurrentStage(data.stage);

          // Handle specific stages
          if (data.stage === "generation_complete") {
            setGenerationComplete(true);
            setIsGenerating(false);
            setShowGenerateButton(true);
            console.log(data);
            if (data.data && data.data.downloadId) {
              setDownloadId(data.data.downloadId);
            }
          }
        } else if (data.type === "content_update") {
          setMarkdownContent(data.content);
        } else if (data.type === "error") {
          setError(data.message);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("WebSocket connection error");
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
      console.error("Internal Server Error:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.syllabus || !formData.subject_name) {
        setError("Please fill in all required fields.");
        return;
      }
      if (formData.syllabus.length < 10) {
        setError("Syllabus should be at least 10 characters long.");
        return;
      }
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
          setError(error.response.data.error);
        } else {
          setError("An unexpected error occurred");
        }
      } else {
        setError("Error generating notes");
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
          setError("Failed to download notes");
        }
      }
    } else {
      setError("No download URL available");
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

    return (
      <div
        className={`mb-4 p-3 ${
          isDarkMode ? "border-green-900" : "bg-green-50 border-green-200"
        } border rounded-md`}
      >
        <p className={`${isDarkMode ? "text-white" : "text-green-700"}`}>
          {statusMessage}
        </p>
        {generationComplete && (
          <button
            onClick={downloadGeneratedNotes}
            className={`mt-2 px-4 py-2 cursor-pointer rounded-md ${
              isDarkMode
                ? "bg-green-700 text-white hover:bg-green-900 border-green-900"
                : "bg-white text-green-700 border-green-700 hover:bg-green-700 hover:text-white"
            } transition duration-300`}
          >
            Download Notes
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-white text-green-700 pt-20",
        funnel_display.className
      )}
    >
      <Navbar />
      <main
        className={`flex flex-col justify-center items-center min-h-screen ${
          isDarkMode
            ? "bg-[radial-gradient(circle_at_center,_#134e2b,_#0a0a0a)]"
            : "bg-[radial-gradient(circle_at_center,_#d1fae5,_white)]"
        } p-4 md:p-6`}
      >
        <h1
          className={`text-3xl md:text-4xl font-extrabold ${
            isDarkMode ? "text-white" : "text-green-700"
          }  mb-2 md:mb-4 text-center`}
        >
          Generate Notes
        </h1>
        <p
          className={`text-base md:text-lg mb-4 md:mb-6 text-center px-4 ${
            isDarkMode ? "text-white" : "text-gray-600"
          }`}
        >
          Enter a topic and select the depth of notes you want.
        </p>
        <div className="md:hidden w-full max-w-md mb-4">
          <button
            onClick={toggleView}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300"
          >
            {showPreview ? "Show Form" : "Show Preview"}
          </button>
        </div>

        <div
          className={`${
            isDarkMode
              ? "bg-neutral-900 border-neutral-800 text-white"
              : "bg-white border-neutral-800 text-black"
          } w-full max-w-6xl  shadow-xl rounded-2xl p-4 md:p-8 text-center`}
        >
          <div className="flex flex-col lg:flex-row w-full">
            <div
              className={`w-full lg:w-[35%] ${
                showPreview ? "hidden md:block" : "block"
              }`}
            >
              <div className="flex flex-col gap-4 md:gap-8">
                <PlaceholdersAndVanishInput
                  label="Enter Subject Name"
                  placeholders={[
                    "Enter subject...",
                    "E.g., Machine Learning",
                    "E.g., Web Development",
                  ]}
                  handleChange={handleInputChange}
                  field="subject_name"
                />
                <PlaceholdersAndVanishInput
                  label="Enter your Syllabus"
                  placeholders={[
                    "Enter your syllabus...",
                    "E.g., Basic concepts: database & database users, characteristics of the database systems, concepts and architecture, data models, schemas & instances, DBMS architecture & data independence........",
                    "E.g., The basic human aspirations and their fulfillment through Right understanding and Resolution, Right understanding and Resolution as the activities of the Self, Self being central to Human Existence.......",
                  ]}
                  handleChange={handleInputChange}
                  field="syllabus"
                />

                <PlaceholdersAndVanishInput
                  label="User Instructions"
                  placeholders={[
                    "Enter your instructions...",
                    "E.g., Elaborate more on ER diagrams",
                    "E.g., Go in depth on the topic of Normalization",
                  ]}
                  handleChange={handleInputChange}
                  field="user_instructions"
                />
                <div className="flex flex-col gap-4 md:flex-row md:items-center lg:flex-col">
                  <div className="w-full md:w-auto">
                    <MultiTabSwitch
                      tabs={[
                        { label: "Concise", value: "concise" },
                        { label: "QnA", value: "qa" },
                        { label: "Detailed", value: "detailed" },
                      ]}
                      label="Choose the type of Notes generated"
                      lgSize
                      premium_feature={["detailed"]}
                      handleChange={handleInputChange}
                      field="note_type"
                      userCredits={userCredits}
                    />
                  </div>
                  <div className="flex flex-row gap-2 md:w-auto">
                    <MultiTabSwitch
                      tabs={[
                        { label: "Yes", value: "yes" },
                        { label: "No", value: "no" },
                      ]}
                      label="Include Examples?"
                      handleChange={handleInputChange}
                      field="include_examples"
                      userCredits={userCredits}
                    />
                    <MultiTabSwitch
                      tabs={[
                        { label: "No", value: "no" },
                        { label: "Yes", value: "yes" },
                      ]}
                      label="Include Visuals?"
                      premium_feature={["yes"]}
                      handleChange={handleInputChange}
                      field="include_images"
                      userCredits={userCredits}
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 p-2 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}

                {renderGenerationStatus()}

                <button
                  onClick={handleSubmit}
                  disabled={isGenerating}
                  className={`px-6 py-2 border rounded-lg shadow-md transition duration-300 ${
                    isGenerating
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : `cursor-pointer ${
                          isDarkMode
                            ? "bg-green-700 text-white hover:bg-green-900 border-green-900"
                            : "bg-white text-green-700 border-green-700 hover:bg-green-700 hover:text-white"
                        }`
                  }`}
                >
                  {isGenerating
                    ? "Generating..."
                    : generationComplete
                    ? "Generate Again"
                    : "Generate"}
                </button>
              </div>
            </div>

          <div className="hidden lg:block w-[1px] h-auto bg-green-400 mx-6"></div>  
            <div
              className={`w-full lg:w-[65%] mt-6 lg:mt-0 ${
                !showPreview ? "hidden md:block" : "block"
              }`}
            >
              <PDFLikeMarkdownDisplay
                markdownContent={markdownContent}
                isGenerating={isGenerating}
                downloadId={downloadId}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotesGenerate;
