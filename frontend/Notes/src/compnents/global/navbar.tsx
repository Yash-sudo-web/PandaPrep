'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { MenuIcon } from 'lucide-react'
import { Funnel_Display } from 'next/font/google'
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth'
import  app  from '@/firebase/firebaseconfig' 

const funnel_display = Funnel_Display({
  subsets: ['latin'],
  weight: '400',
})

const Navbar = () => {
  const auth = getAuth(app);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="fixed right-0 left-0 top-0 py-4 px-4 bg-white backdrop-blur-lg z-[100] flex items-center border-b-[1px] border-white justify-between">
      <aside className="flex items-center gap-[2px]">
        <p className={`text-5xl font-bold bg-gradient-to-tr from-green-600 to-green-900 bg-clip-text text-transparent ${funnel_display.className}`}>
          PandaPrep
        </p>
      </aside>
      <nav className="absolute left-[50%] top-[50%] transform translate-x-[-50%] translate-y-[-50%] hidden md:block">
        <ul className="flex items-center gap-11 list-none">
          <li>
            <Link href="#" className={`bg-gradient-to-tr from-green-600 to-green-900 bg-clip-text text-transparent text-lg ${funnel_display.className}`}>Pricing</Link>
          </li>
          <li>
            <Link href="#" className={`bg-gradient-to-tr from-green-600 to-green-900 bg-clip-text text-transparent text-lg ${funnel_display.className}`}>Resources</Link>
          </li>
          <li>
            <Link href="#" className={`bg-gradient-to-tr from-green-600 to-green-900 bg-clip-text text-transparent text-lg ${funnel_display.className}`}>Documentation</Link>
          </li>
        </ul>
      </nav>
      <aside className="flex items-center gap-4 relative">
        {user ? (
          <div className="flex items-center gap-2">
            <Image src={user.photoURL || '/default-avatar.png'} alt="User Avatar" width={40} height={40} className="rounded-full" />
            <span className={`text-green-700 font-medium ${funnel_display.className}`}>{user.displayName}</span>
            <button onClick={handleSignOut} className="ml-4 px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg">Sign Out</button>
          </div>
        ) : (
          <button 
            onClick={() => router.push('/auth')} 
            className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#C8F7C5_0%,#2E7D32_50%,#C8F7C5_100%)]" />
            <span className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white px-3 py-1 text-sm font-medium text-green-700 backdrop-blur-3xl ${funnel_display.className}`}>
              Login / Sign In
            </span>
          </button>
        )}
        <MenuIcon className="md:hidden" />
      </aside>
    </header>
  )
}

export default Navbar;
