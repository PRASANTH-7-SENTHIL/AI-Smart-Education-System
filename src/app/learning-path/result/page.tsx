"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ArrowRight, PlayCircle, BookOpen, Trophy } from "lucide-react"
import { Suspense } from "react"

// Mock Path Generator based on Goal
const generatePath = (goal: string | null) => {
    const base = [
        { title: "Foundations & Basics", duration: "2 Weeks", status: "completed" },
        { title: "Core Concepts & Theory", duration: "4 Weeks", status: "in-progress" },
        { title: "Practical Application", duration: "3 Weeks", status: "locked" },
        { title: "Advanced Specialization", duration: "4 Weeks", status: "locked" },
        { title: "Final Capstone Project", duration: "2 Weeks", status: "locked" },
    ]

    if (goal?.toLowerCase().includes("neet")) {
        return base.map((item, i) => ({
            ...item,
            title: ["Physics Mechanics", "Organic Chemistry", "Biology: Genetics", "Mock Tests Series", "Final Review"][i]
        }))
    }

    return base
}

function ResultContent() {
    const searchParams = useSearchParams()
    const goal = searchParams.get("goal") || "General Learning"
    const path = generatePath(goal)

    return (
        <div className="container mx-auto max-w-5xl py-8 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Your Personalized Roadmap</h1>
                    <p className="text-muted-foreground">
                        Tailored path to achieve: <span className="text-primary font-semibold">{goal}</span>
                    </p>
                </div>
                <Button variant="outline">
                    <Trophy className="mr-2 h-4 w-4" /> View Certificates
                </Button>
            </div>

            <div className="relative border-l-2 border-muted ml-4 space-y-12 py-4">
                {path.map((step, index) => (
                    <div key={index} className="relative pl-8">
                        <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 bg-background 
              ${step.status === 'completed' ? 'border-primary bg-primary' :
                                step.status === 'in-progress' ? 'border-primary animate-pulse' : 'border-muted-foreground'
                            }`}
                        />

                        <Card className={`transition-all hover:shadow-md ${step.status === 'locked' ? 'opacity-70' : ''}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {step.title}
                                            {step.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                            {step.status === 'in-progress' && <Badge variant="secondary" className="text-xs">Current Focus</Badge>}
                                        </CardTitle>
                                        <CardDescription>Estimated Duration: {step.duration}</CardDescription>
                                    </div>
                                    {step.status !== 'locked' && (
                                        <Button size="sm" variant={step.status === 'in-progress' ? 'default' : 'outline'}>
                                            {step.status === 'completed' ? 'Review' : 'Continue'}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            {step.status !== 'locked' && (
                                <CardContent>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                                            <PlayCircle className="h-8 w-8 text-primary/80" />
                                            <div>
                                                <div className="font-medium text-sm">Video Lectures</div>
                                                <div className="text-xs text-muted-foreground">12 Modules • 4.5 Hrs</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                                            <BookOpen className="h-8 w-8 text-secondary-foreground/80" />
                                            <div>
                                                <div className="font-medium text-sm">Reading Materials</div>
                                                <div className="text-xs text-muted-foreground">PDFs & Notes</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function LearningPathResult() {
    return (
        <Suspense fallback={<div className="container py-8 flex justify-center">Loading roadmap...</div>}>
            <ResultContent />
        </Suspense>
    )
}
