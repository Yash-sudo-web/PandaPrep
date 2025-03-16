// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from 'firebase/auth'
 

const firebaseConfig = {
  apiKey: "AIzaSyBITfmRxLHRCBvYxkyOI_WcnXUXqPOa6qs",
  authDomain: "pandaprep-619.firebaseapp.com",
  projectId: "pandaprep-619",
  storageBucket: "pandaprep-619.firebasestorage.app",
  messagingSenderId: "842714637661",
  appId: "1:842714637661:web:718019c3e733765e4334b4",
  measurementId: "G-MY2TTQTPFS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth=getAuth(app);

export default app;

