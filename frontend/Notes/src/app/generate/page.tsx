"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import app from "@/firebase/firebaseconfig";
import { Funnel_Display } from "next/font/google";
import Navbar from "@/compnents/global/navbar";
import { PlaceholdersAndVanishInput } from "@/compnents/ui/input-text";
import { cn } from "@/lib/utils";
import MultiTabSwitch from "@/compnents/ui/option-switch";
import axios from "axios";
import { BASE_URL } from "@/lib/constant";

const funnel_display = Funnel_Display({
  subsets: ["latin"],
  weight: "400",
});

const NotesGenerate = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const auth = getAuth(app);

  const [formData, setFormData] = useState({
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

  const handleSubmit = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/generate-notes`, formData, {
        responseType: "blob",
      });
  
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "generated_notes.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating notes:", error);
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

    return () => unsubscribe();
  }, [auth, router]);

  return (
    <div
      className={cn(
        "min-h-screen bg-white text-green-700 pt-24",
        funnel_display.className
      )}
    >
      <Navbar />
      <main className="flex flex-col justify-center items-center min-h-screen bg-[radial-gradient(circle_at_center,_#d1fae5,_white)] p-6">
        <h1 className="text-4xl font-extrabold text-green-700 mb-4">
          Generate Notes
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Enter a topic and select the depth of notes you want.
        </p>
        <div className="w-full max-w-6xl bg-white shadow-xl rounded-2xl p-8 text-center flex">
          <div className="w-[35%] flex">
            <div className="flex flex-col gap-8">
              <PlaceholdersAndVanishInput
                label="Enter Domain"
                placeholders={[
                  "Enter domain...",
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
              <MultiTabSwitch
                tabs={[
                  {
                    label: "Concise",
                    value: "concise",
                  },
                  {
                    label: "QnA",
                    value: "qna",
                  },
                  {
                    label: "Detailed",
                    value: "detailed",
                  },
                ]}
                label="Choose the type of Notes generated"
                lgSize
                premium_feature={["detailed"]}
                handleChange={handleInputChange}
                field="note_type"
              />
              <div className="flex gap-2">
                <MultiTabSwitch
                  tabs={[
                    {
                      label: "Yes",
                      value: "yes",
                    },
                    {
                      label: "No",
                      value: "no",
                    },
                  ]}
                  label="Include Examples?"
                  handleChange={handleInputChange}
                  field="include_examples"
                />
                <MultiTabSwitch
                  tabs={[
                    {
                      label: "No",
                      value: "no",
                    },
                    {
                      label: "Yes",
                      value: "yes",
                    },
                  ]}
                  label="Include Visuals?"
                  premium_feature={["yes"]}
                  handleChange={handleInputChange}
                  field="include_images"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-white text-green-700 border border-green-700 rounded-lg shadow-md hover:bg-green-700 hover:text-white transition duration-300"
              >
                Generate
              </button>
            </div>
          </div>
          <div className="w-[1px] h-[3/4] bg-green-400 mx-6"></div>
          <div className="w-[65%] bg-[radial-gradient(circle_at_center,_#d1fae5,_white)]"></div>
        </div>
      </main>
    </div>
  );
};

export default NotesGenerate;
