"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
    onAuthStateChanged,
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { logActivity } from "@/lib/activity-logger"

interface AuthContextType {
    user: User | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user)
            setLoading(false)
            if (!user && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                // Optional: redirect logic handled in MainLayout usually, but good to be safe
            }
        })
        return () => unsubscribe()
    }, [router])

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider()
        try {
            const result = await signInWithPopup(auth, provider)
            // Log Login Activity (non-blocking)
            logActivity(result.user.uid, "LOGIN", {
                email: result.user.email,
                method: "google"
            })
            router.push("/")
        } catch (error) {
            console.error("Error signing in with Google", error)
        }
    }

    const signIn = async (email: string, password: string) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password)
            logActivity(result.user.uid, "LOGIN", {
                email: result.user.email,
                method: "email_password"
            })
            router.push("/")
        } catch (error) {
            console.error("Error signing in", error)
            throw error
        }
    }

    const signUp = async (email: string, password: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password)
            logActivity(result.user.uid, "SIGN_UP", { email: result.user.email })
            // No return needed as we just want the side effect of user creation
        } catch (error) {
            console.error("Error signing up", error)
            throw error
        }
    }

    const logout = async () => {
        try {
            if (user) {
                logActivity(user.uid, "LOGOUT", { email: user.email })
            }
            await signOut(auth)
            router.push("/login")
        } catch (error) {
            console.error("Error signing out", error)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signIn, signUp, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
