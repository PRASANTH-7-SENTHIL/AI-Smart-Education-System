"use client"

import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { useAuth } from "@/context/auth-context"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { user, loading } = useAuth()
    const router = useRouter()

    // Pages that don't need the sidebar or auth protection
    const publicRoutes = ["/login", "/signup"]
    const isPublic = publicRoutes.includes(pathname)

    useEffect(() => {
        if (!loading && !user && !isPublic) {
            router.push("/login")
        }
    }, [user, loading, isPublic, router])

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg font-medium">Loading Smart Education...</span>
            </div>
        )
    }

    if (!user && !isPublic) {
        return null // Will redirect via useEffect
    }

    return (
        <div className="flex min-h-screen">
            {!isPublic && (
                <>
                    <Sidebar className="hidden md:flex" />
                    <MobileSidebar />
                </>
            )}
            <main className={`flex-1 overflow-y-auto bg-muted/20 ${!isPublic ? 'p-4 pt-16 md:p-8' : ''}`}>
                {children}
            </main>
        </div>
    )
}
