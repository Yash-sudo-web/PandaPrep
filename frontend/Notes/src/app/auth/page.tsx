'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, onAuthStateChanged, User } from 'firebase/auth'
import  app  from '@/firebase/firebaseconfig'
import Image from 'next/image'

const AuthPage = () => {
  const auth = getAuth(app)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        setTimeout(() => router.push('/'), 1500) 
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleSignIn = async (providerType: 'google' | 'github') => {
    const provider = providerType === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      console.error('Authentication error:', error)
      if (error.code === 'auth/account-exists-with-different-credential') {
        alert('An account already exists with this email using a different sign-in method. Try another option.')
      }
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-white to-green-100">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl p-8 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col justify-center text-center md:text-left p-8 bg-gradient-to-tr from-green-700 to-green-500 text-white rounded-l-2xl">
          <h1 className="text-5xl font-extrabold">Welcome</h1>
          <p className="text-lg mt-2">Sign in to continue your journey with PandaPrep.</p>
        </div>

        <div className="flex-1 p-8 bg-white rounded-r-2xl flex flex-col items-center justify-center">
          {user ? (
            <div className="flex flex-col items-center">
              <Image src={user.photoURL || '/default-avatar.png'} alt="User Avatar" width={50} height={50} className="rounded-full" />
              <p className="mt-2 font-medium text-lg">{user.displayName}</p>
              <p className="text-gray-500">{user.email}</p>
              <p className="text-green-600 font-medium mt-4">Redirecting to home...</p>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-semibold text-green-700">Sign In</h2>
              <button
                onClick={() => handleSignIn('google')}
                className="mt-6 w-64 p-3 flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg hover:border-gray-400 transition duration-300"
              >
                <Image src="https://www.gstatic.com/images/branding/product/1x/gsa_48dp.png" alt="Google Logo" width={24} height={24} className="w-6 h-6" />
                <span className="text-gray-700 font-medium">Sign in with Google</span>
              </button>
              <button
                onClick={() => handleSignIn('github')}
                className="mt-4 w-64 p-3 flex items-center justify-center gap-3 bg-gray-900 text-white rounded-lg shadow-md hover:shadow-lg hover:bg-gray-800 transition duration-300"
              >
                <Image src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" width={24} height={24} className="w-6 h-6 bg-white rounded-full" />
                <span className="font-medium">Sign in with GitHub</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthPage
