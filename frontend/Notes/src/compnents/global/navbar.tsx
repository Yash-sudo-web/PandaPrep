import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { MenuIcon } from 'lucide-react'
// import { UserButton, currentUser } from '@clerk/nextjs'
import { Funnel_Display } from 'next/font/google'

type Props = {}

const funnel_display = Funnel_Display({
  subsets: ['latin'],
  weight: '400',
})
const Navbar = async (props: Props) => {
  
  return (
    <header className="fixed right-0 left-0 top-0 py-4 px-4 bg-white backdrop-blur-lg z-[100] flex items-center border-b-[1px] border-white justify-between">
      <aside className="flex items-center gap-[2px]">
        <p
          className={`text-5xl font-bold bg-gradient-to-tr from-green-600 to-green-900 bg-clip-text text-transparent ${funnel_display.className}`}
        >
          PandaPrep
        </p>



      </aside>
      <nav className="absolute left-[50%] top-[50%] transform translate-x-[-50%] translate-y-[-50%] hidden md:block">
        <ul className="flex items-center gap-11 list-none">
         
          <li>
            <Link href="#" className={`bg-gradient-to-tr from-green-600 to-green-900 bg-clip-text text-transparent text-lg  ${funnel_display.className}`}>Pricing</Link>
          </li>

          <li>
            <Link href="#" className={`bg-gradient-to-tr from-green-600 to-green-900 bg-clip-text text-transparent text-lg ${funnel_display.className}`}>Resources</Link>
          </li>
          <li>
            <Link href="#" className={`bg-gradient-to-tr from-green-600 to-green-900 bg-clip-text text-transparent text-lg  ${funnel_display.className}`}>Documentation</Link>
          </li>
      
        </ul>

      </nav>
      <aside className="flex items-center gap-4">
        <Link
          href="/login"
          className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#C8F7C5_0%,#2E7D32_50%,#C8F7C5_100%)]" />

          <span className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white px-3 py-1 text-sm font-medium text-green-700 backdrop-blur-3xl ${funnel_display.className}`}>
            {true ? 'Login /Sign In' : 'Get Started'}
          </span>
        </Link>
        <MenuIcon className="md:hidden" />
      </aside>
    </header>
  )
}

export default Navbar