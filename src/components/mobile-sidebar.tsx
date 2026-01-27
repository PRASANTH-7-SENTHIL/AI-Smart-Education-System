"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"

export function MobileSidebar() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Close sidebar when route changes
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden fixed top-4 left-4 z-50"
                onClick={() => setOpen(true)}
            >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open Menu</span>
            </Button>

            {open && (
                <div
                    className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-lg transition-transform duration-300 md:hidden",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="absolute right-4 top-4 z-50">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close Menu</span>
                    </Button>
                </div>
                <Sidebar className="border-none" />
            </div>
        </>
    )
}
