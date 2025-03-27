'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MenuIcon, X } from 'lucide-react'
import { Funnel_Display } from 'next/font/google'
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth'
import { useTheme } from 'next-themes'
import app from '@/firebase/firebaseconfig'
import { ModeToggle } from './mode-selector'
import { ChevronDown, ChevronUp } from 'lucide-react'

const funnel_display = Funnel_Display({
  subsets: ['latin'],
  weight: '400',
})

const Navbar = () => {
  const auth = getAuth(app)
  const router = useRouter()
  const { theme, resolvedTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const isDark = resolvedTheme === "dark"

  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [auth])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header
      className={`fixed right-0 left-0 top-0 py-4 px-4 backdrop-blur-lg z-[100] flex items-center border-b-[1px] justify-between ${!mounted
          ? 'bg-transparent'
          : isDark
            ? 'bg-neutral-800 border-neutral-800 text-white'
            : 'bg-white border-white text-green-700'
        } ${funnel_display.className}`}
    >
      <aside className="flex items-center gap-2">
        <Link href="/">
          <p className="text-3xl md:text-5xl bg-gradient-to-tr from-green-600 to-green-800 bg-clip-text text-transparent dark:from-green-400 dark:to-green-700">
            PandaPrep
          </p>
        </Link>
      </aside>

      <div className="relative">
        <nav
          className={`fixed md:relative left-0 top-0 w-full md:w-auto h-screen md:h-auto bg-white dark:bg-neutral-800 md:bg-transparent md:dark:bg-transparent transition-transform duration-300 ease-in-out transform ${mounted ? (menuOpen ? 'translate-x-0' : '-translate-x-full') : 'hidden'
            } md:translate-x-0 md:flex md:items-center md:gap-11 p-6 md:p-0 z-50 shadow-lg md:shadow-none`}
        >
          <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 md:hidden">
            <X size={24} className="text-gray-800 dark:text-gray-200" />
          </button>
          <ul className="flex flex-col md:flex-row items-center gap-6 md:gap-11 list-none">
            <li>
              <Link href="/generate" className="text-lg text-green-600 dark:text-gray-200">
                Notes Generation
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-lg text-green-600 dark:text-gray-200">
                Subscription
              </Link>
            </li>
            <li>
              <Link href="/history" className="text-lg text-green-600 dark:text-gray-200">
                History
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <aside className="flex items-center gap-4 relative">
        <ModeToggle />
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2"
            >
              <Image
                src={user.photoURL || '/default-avatar.png'}
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="font-medium text-green-700 dark:text-green-00">{user.displayName}</span>
              {dropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48  dark:bg-neutral-800 shadow-lg rounded-lg p-2 border border-gray-300 dark:border-neutral-700">
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-neutral-800 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push('/auth')}
            className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-gray-900"
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#C8F7C5_0%,#2E7D32_50%,#C8F7C5_100%)]" />
            {mounted && (
              <span
                className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full 
        px-3 py-1 text-sm font-medium backdrop-blur-3xl transition-colors
        ${isDark ? 'bg-neutral-800 text-green-500' : 'bg-white text-green-700'}`}
              >
                Login / Sign In
              </span>
            )}
          </button>
        )}

        <button onClick={() => setMenuOpen(true)} className="md:hidden">
          <MenuIcon className="text-green-600 dark:text-green-400" />
        </button>
      </aside>
    </header>
  )
}

export default Navbar
