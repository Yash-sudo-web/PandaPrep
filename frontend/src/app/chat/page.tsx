"use client";
import React, { useEffect, useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/compnents/ui/sidebar";
import { IconBrandTabler, IconSettings, IconHome } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import app from "@/firebase/firebaseconfig";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceholdersAndVanishInput } from "@/compnents/ui/input-text";
import { Funnel_Display } from "next/font/google";

const funnel_display = Funnel_Display({
  subsets: ["latin"],
  weight: "400",
});

function ChatPage() {
  const auth = getAuth(app);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div
        className={`flex justify-center items-center h-screen text-xl font-semibold ${funnel_display.className}`}
      >
        Loading...
      </div>
    );
  }

  const links = [
    { 
      label: "History", 
      href: "#", 
      icon: <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-800" /> 
    },
    { 
      label: "Settings", 
      href: "#", 
      icon: <IconSettings className="h-5 w-5 shrink-0 text-neutral-800" /> 
    },
    { 
      label: "Return to Home", 
      href: "/", 
      icon: <IconHome className="h-5 w-5 shrink-0 text-neutral-800" /> 
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-full h-screen bg-gradient-to-b from-white to-green-200 overflow-hidden",
        funnel_display.className
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}

              {user && (
                <SidebarLink
                  link={{
                    label: open ? user.displayName ?? "" : "",
                    href: "#",
                    icon: (
                      <Image
                        src={user.photoURL || "/default-avatar.png"}
                        alt="User Avatar"
                        width={50}
                        height={50}
                        className="h-7 w-7 shrink-0 rounded-full"
                      />
                    ),
                  }}
                />
              )}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <ChatWindow />
    </div>
  );
}

function Logo() {
  return (
    <div className="text-neutral-800 font-medium">PandaPrep</div>
  );
}

function LogoIcon() {
  return (
    <div className="h-5 w-6 bg-white dark:bg-black rounded" />
  );
}

function ChatWindow() {
  return (
    <div className="flex flex-1 p-4 md:p-10 bg-white rounded-tl-2xl flex-col w-full h-full">
      <div className="chat-container flex-1 overflow-y-auto p-4">
        {/* Chat messages go here */}
      </div>
      <PlaceholdersAndVanishInput
        placeholders={["Type a message..."]}
        onChange={() => {}}
        onSubmit={() => {}}
      />
    </div>
  );
}

export default ChatPage;