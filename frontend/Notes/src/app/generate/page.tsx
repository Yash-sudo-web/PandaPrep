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

const funnel_display = Funnel_Display({
  subsets: ["latin"],
  weight: "400",
});

const NotesGenerate = () => {
  const [depth, setDepth] = useState("Standard");
  const [topic, setTopic] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const auth = getAuth(app);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Generating notes for:", topic);
  };

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
          <div className="w-[35%] flex flex-col gap-8">
            <PlaceholdersAndVanishInput
              label="Enter your Syllabus"
              placeholders={[
                "Enter your syllabus...",
                "E.g., Basic concepts: database & database users, characteristics of the database systems, concepts and architecture, data models, schemas & instances, DBMS architecture & data independence........",
                "E.g., The basic human aspirations and their fulfillment through Right understanding and Resolution, Right understanding and Resolution as the activities of the Self, Self being central to Human Existence.......",
              ]}
              onChange={handleInputChange}
              onSubmit={(e) =>
                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
              }
            />
            <PlaceholdersAndVanishInput
              label="Enter Subject Name"
              placeholders={[
                "Enter your subject...",
                "E.g., Machine Learning",
                "E.g., Web Development",
              ]}
              onChange={handleInputChange}
              onSubmit={(e) =>
                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
              }
            />
            <PlaceholdersAndVanishInput
              label="User Instructions"
              placeholders={[
                "Enter your instructions...",
                "E.g., Elaborate more on ER diagrams",
                "E.g., Go in depth on the topic of Normalization",
              ]}
              onChange={handleInputChange}
              onSubmit={(e) =>
                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
              }
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
            />
            <div className="flex">
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
              />
            </div>
          </div>
          <div className="w-[1px] h-[3/4] bg-green-400 mx-6"></div>
          <div className="w-[65%] bg-[radial-gradient(circle_at_center,_#d1fae5,_white)]">
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotesGenerate;
