'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, onAuthStateChanged, User } from 'firebase/auth'
import app from '@/firebase/firebaseconfig'
import Image from 'next/image'
import { Funnel_Display } from 'next/font/google';
import axios from 'axios';
import { BASE_URL } from '@/lib/constant';
import { setCookie } from '@/lib/utils';

const funnel_display = Funnel_Display({
  subsets: ['latin'],
  weight: '400',
});

const AuthPage = () => {
  const auth = getAuth(app)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        setTimeout(() => router.push('/generate'), 1500)
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleSignIn = async (providerType: 'google' | 'github') => {
    const provider = providerType === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider()
    try {
      const response= await signInWithPopup (auth, provider)
      const email=response.user.email || " "
      setCookie('email', email, 7)
      try{
        const reqBody = {
          uid: response.user.uid,
          email: response.user.email,
          displayName: response.user.displayName,
          photoURL: response.user.photoURL,
          providerId: response.user.providerData?.[0]?.providerId || null, 
          createdAt: response.user.metadata?.creationTime || null,
          lastLoginAt: response.user.metadata?.lastSignInTime || null, 
          providerData: response.user.providerData || [], 
          tokens: response.user.stsTokenManager || {} 
        };
        
        const res=axios.post(`${BASE_URL}/user/signin`,reqBody)


      }catch(error:any){
        console.error('Internal Server Error:', error)
      }
    } catch (error: any) {
      console.error('Authentication error:', error)
      if (error.code === 'auth/account-exists-with-different-credential') {
        alert('An account already exists with this email using a different sign-in method. Try another option.')
      }
    }
  }

  return (
    <div className={`flex justify-center items-center min-h-screen bg-white bg-[radial-gradient(circle_at_center,_#d1fae5,_white)] ${funnel_display.className}`}>
      <div className="w-3/2 max-w-5xl bg-white shadow-xl rounded-2xl p-6 ">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-5xl font-extrabold text-green-700">Welcome</h1>
          <p className="text-lg mt-2 text-gray-600">Unlock your brain-panda! 
            Login to unleash the notes.</p>
          
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-white rounded-r-2xl">
          {user ? (
            <div className="flex flex-col items-center">
              <Image src={user.photoURL || '/default-avatar.png'} alt="User Avatar" width={50} height={50} className="rounded-full" />
              <p className="mt-2 font-medium text-lg">{user.displayName}</p>
              <p className="text-gray-500">{user.email}</p>
              <p className="text-green-600 font-medium mt-4">Your Notes are just one step away...</p>
            </div>
          ) : (
            <>
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
              <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-white text-green-700 border border-green-700 rounded-lg shadow-md hover:bg-green-700 hover:text-white transition duration-300"
          >
            Back to Home
          </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthPage