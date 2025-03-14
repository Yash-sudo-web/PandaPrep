'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'
import app from '@/firebase/firebaseconfig'
import { Funnel_Display } from 'next/font/google';
import Navbar from "@/compnents/global/navbar";
import { PlaceholdersAndVanishInput } from "@/compnents/ui/search";
import { cn } from "@/lib/utils";

const funnel_display = Funnel_Display({
  subsets: ['latin'],
  weight: '400',
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
                router.push('/auth');
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
        <div className={cn("min-h-screen bg-white text-green-700", funnel_display.className)}>
            <Navbar />
            <main className="flex flex-col justify-center items-center min-h-screen bg-[radial-gradient(circle_at_center,_#d1fae5,_white)] p-6">
                <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-8 text-center">
                    <h1 className="text-4xl font-extrabold text-green-700 mb-4">Generate Notes</h1>
                    <p className="text-lg text-gray-600 mb-6">Enter a topic and select the depth of notes you want.</p>

                    <PlaceholdersAndVanishInput
                        placeholders={["Enter your topic...", "E.g., Machine Learning", "E.g., Web Development"]}
                        onChange={handleInputChange}
                        onSubmit={(e) => handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)}
                    />

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <label className="text-lg font-semibold">Choose Depth:</label>
                        <select
                            value={depth}
                            onChange={(e) => setDepth(e.target.value)}
                            className="p-3 border border-green-400 rounded-lg text-green-700 bg-white outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="Standard">Standard</option>
                            <option value="Detailed">Detailed</option>
                            <option value="Summarized">Summarized</option>
                        </select>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default NotesGenerate;
