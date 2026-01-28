import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyC__jcWOzrLCQUFf0E9yE0A8RVHiMFnE30",
    authDomain: "smart-education-39570.firebaseapp.com",
    projectId: "smart-education-39570",
    storageBucket: "smart-education-39570.firebasestorage.app",
    messagingSenderId: "129479378498",
    appId: "1:129479378498:web:83e3813ce9ee06abe48fdb",
    measurementId: "G-GJZTDBKJV5"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

let analytics;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, db, analytics };
