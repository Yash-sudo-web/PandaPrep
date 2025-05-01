"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import app from "@/firebase/firebaseconfig";
import Image from "next/image";
import { montserrat500, montserrat600, montserrat700 } from "@/lib/font-utils";
import axios from "axios";
import { BASE_URL } from "@/lib/constant";
import { setCookie } from "@/lib/utils";
import { useTheme } from "next-themes";

const AuthPage = () => {
  const auth = getAuth(app);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setTimeout(() => router.push("/generate"), 1500);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignIn = async (providerType: "google" | "github") => {
    const provider =
      providerType === "google"
        ? new GoogleAuthProvider()
        : new GithubAuthProvider();
    try {
      const response: any = await signInWithPopup(auth, provider);

      const email = response.user.email || " ";
      setCookie("email", email, 7);
      try {
        const reqBody = {
          uid: response.user.uid,
          email: response.user.email,
          displayName: response.user.displayName,
          photoURL: response.user.photoURL,
          providerId: response.user.providerData?.[0]?.providerId || null,
          createdAt: response.user.metadata?.creationTime || null,
          lastLoginAt: response.user.metadata?.lastSignInTime || null,
          providerData: response.user.providerData || [],
          tokens: response.user.stsTokenManager || {},
        };

        await axios.post(`${BASE_URL}/user/signin`, reqBody);
      } catch (error: any) {
        console.error("Internal Server Error:", error);
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      if (error.code === "auth/account-exists-with-different-credential") {
        alert(
          "An account already exists with this email using a different sign-in method. Try another option."
        );
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FAF7F0]">
      <div className="w-full max-w-3xl rounded-2xl p-6 sm:p-10 flex flex-col bg-white border border-[#C9C3B3] shadow-lg">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6">
          <h1 className={`text-4xl sm:text-5xl font-extrabold text-[#4A4947] ${montserrat700.className}`}>
            Welcome
          </h1>
          <p className={`text-lg mt-4 text-[#B17457] ${montserrat600.className}`}>
            Unlock your brain-panda! Login to unleash the notes.
          </p>
        </div>
        <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center rounded-2xl bg-[#D8D2C2]/30">
          {user ? (
            <div className="flex flex-col items-center text-center">
              <Image
                src={user.photoURL || "/default-avatar.png"}
                alt="User Avatar"
                width={70}
                height={70}
                className="rounded-full border-2 border-[#B17457]"
              />
              <p className={`mt-4 font-medium text-xl text-[#4A4947] ${montserrat600.className}`}>
                {user.displayName}
              </p>
              <p className={`text-[#B17457] ${montserrat500.className}`}>
                {user.email}
              </p>
              <p className={`text-[#4A4947] font-medium mt-6 ${montserrat600.className}`}>
                Your Notes are just one step away...
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={() => handleSignIn("google")}
                className="w-full cursor-pointer max-w-xs p-3 flex items-center justify-center gap-3 bg-white border border-[#C9C3B3] rounded-lg shadow-md hover:shadow-lg hover:border-[#B17457] transition duration-300"
              >
                <Image
                  src="https://www.gstatic.com/images/branding/product/1x/gsa_48dp.png"
                  alt="Google Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                <span className={`text-[#4A4947] font-medium ${montserrat600.className}`}>
                  Sign in with Google
                </span>
              </button>
              <button
                onClick={() => handleSignIn("github")}
                className="mt-4 cursor-pointer w-full max-w-xs p-3 flex items-center justify-center gap-3 bg-[#4A4947] text-white rounded-lg shadow-md hover:shadow-lg hover:bg-[#5D5B58] transition duration-300"
              >
                <Image
                  src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                  alt="GitHub Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6 bg-white rounded-full"
                />
                <span className={`font-medium ${montserrat600.className}`}>
                  Sign in with GitHub
                </span>
              </button>
              <button
                onClick={() => router.push("/")}
                className={`mt-6 cursor-pointer px-6 py-2 border-2 border-[#B17457] text-[#B17457] rounded-lg shadow-md hover:bg-[#B17457] hover:text-white transition duration-300 ${montserrat600.className}`}
              >
                Back to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;