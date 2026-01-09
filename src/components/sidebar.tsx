"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    GraduationCap,
    FileAudio,
    UserCheck,
    BrainCircuit,
    Settings,
    LogOut,
} from "lucide-react"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Exam Proctoring",
        href: "/proctoring",
        icon: UserCheck,
    },
    {
        title: "Learning Path",
        href: "/learning-path",
        icon: GraduationCap,
    },
    {
        title: "Speech to Notes",
        href: "/speech-notes",
        icon: FileAudio,
    },
    {
        title: "AI Mentor",
        href: "/mentor",
        icon: BrainCircuit,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const { logout } = useAuth()

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card/50 backdrop-blur-xl">
            <div className="flex h-16 items-center px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <BrainCircuit className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">EduSmart AI</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-2">
                    {sidebarItems.map((item, index) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                                    isActive
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-md"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t p-4">
                <nav className="grid gap-1">
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                            pathname === "/settings" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                        )}
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                    <button
                        onClick={() => logout()}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/10"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </nav>
            </div>
        </div>
    )
}
