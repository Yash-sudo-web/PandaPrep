// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from 'firebase/auth'
 

const firebaseConfig = {
  apiKey: "AIzaSyDzpZmkHtIDbxloN-atUxCSxMOcrzltIIc",
  authDomain: "pandaprep-44ead.firebaseapp.com",
  projectId: "pandaprep-44ead",
  storageBucket: "pandaprep-44ead.firebasestorage.app",
  messagingSenderId: "959415883697",
  appId: "1:959415883697:web:5fcb03eb3a1ec8f70fcf90",
  measurementId: "G-Z9RQRMPJ6F"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth=getAuth(app);

export default app;