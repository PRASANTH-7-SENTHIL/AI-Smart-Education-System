"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, AlertOctagon, Timer, CheckCircle, Video } from "lucide-react"
import { cn } from "@/lib/utils"

import { useAuth } from "@/context/auth-context"
import { logActivity } from "@/lib/activity-logger"

// Mock Questions Data
const EXAM_QUESTIONS = [
    {
        id: 1,
        question: "Which of the following is not a standard React hook?",
        options: ["useState", "useEffect", "useRouter", "useReducer"],
        correct: "useRouter" // Next.js specific
    },
    {
        id: 2,
        question: "What is the primary purpose of the 'useEffect' hook?",
        options: ["State management", "Side effects", "Routing", "Optimization"],
        correct: "Side effects"
    },
    {
        id: 3,
        question: "In Next.js 13+, which directory is used for the App Router?",
        options: ["pages", "src/pages", "app", "router"],
        correct: "app"
    }
]

function ExamSessionContent() {
    const router = useRouter()
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const type = searchParams.get("type") || "General"

    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
    const [timeLeft, setTimeLeft] = useState(1800) // 30 mins
    const [warnings, setWarnings] = useState(0)
    const [isFlagged, setIsFlagged] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Start Webcam (Mock)
    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream
                    }
                })
                .catch(err => console.error("Webcam access denied", err))
        }
    }, [])

    // Window Focus Detection
    useEffect(() => {
        const handleBlur = () => {
            setWarnings(prev => prev + 1)
            setIsFlagged(true)
            setTimeout(() => setIsFlagged(false), 3000)
        }
        window.addEventListener("blur", handleBlur)
        return () => window.removeEventListener("blur", handleBlur)
    }, [])

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(timer)
                    router.push("/proctoring/results")
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [router])

    const handleAnswer = (option: string) => {
        setSelectedAnswers(prev => ({ ...prev, [EXAM_QUESTIONS[currentQuestion].id]: option }))
    }

    // Log Exam Start
    useEffect(() => {
        if (user) {
            logActivity(user.uid, "EXAM_STARTED", { type, timestamp: new Date().toISOString() })
        }
    }, [user, type])

    const handleNext = async () => {
        if (currentQuestion < EXAM_QUESTIONS.length - 1) {
            setCurrentQuestion(prev => prev + 1)
        } else {
            if (user) {
                await logActivity(user.uid, "EXAM_SUBMITTED", {
                    score: "pending",
                    warnings,
                    type
                })
            }
            router.push("/proctoring/results")
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Main Exam Area */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-lg px-4 py-1">
                            {type} Exam
                        </Badge>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-sm">Question {currentQuestion + 1} of {EXAM_QUESTIONS.length}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xl font-bold text-primary">
                        <Timer className="h-5 w-5" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle className="leading-relaxed">
                            {EXAM_QUESTIONS[currentQuestion].question}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        {EXAM_QUESTIONS[currentQuestion].options.map((option, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleAnswer(option)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        handleAnswer(option)
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-all hover:border-primary/50",
                                    selectedAnswers[EXAM_QUESTIONS[currentQuestion].id] === option
                                        ? "bg-primary/10 border-primary ring-1 ring-primary"
                                        : "bg-background"
                                )}
                            >
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium",
                                    selectedAnswers[EXAM_QUESTIONS[currentQuestion].id] === option
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "text-muted-foreground"
                                )}>
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <span className="text-base">{option}</span>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="justify-between border-t p-6">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestion === 0}
                        >
                            Previous
                        </Button>
                        <Button onClick={handleNext}>
                            {currentQuestion === EXAM_QUESTIONS.length - 1 ? "Submit Exam" : "Next Question"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Proctoring Sidebar */}
            <div className="w-80 flex flex-col gap-6">
                <Card className={cn(
                    "overflow-hidden border-2 transition-colors",
                    isFlagged ? "border-destructive animate-pulse" : "border-emerald-500/50"
                )}>
                    <CardHeader className="bg-muted/50 p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium">
                                <Video className="h-4 w-4" />
                                Live Proctoring
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs text-muted-foreground">Active</span>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="aspect-video bg-black relative">
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="h-full w-full object-cover opacity-80"
                        />
                        {/* Overlay for "Scanning" effect */}
                        <div className="absolute inset-0 bg-[url('/scan-lines.png')] opacity-10 pointer-events-none" />
                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-xs text-white font-mono flex items-center gap-1">
                            <Eye className="h-3 w-3" /> AI Monitoring
                        </div>
                    </div>
                    <CardContent className="p-4 bg-muted/20">
                        <div className="space-y-4">
                            {isFlagged && (
                                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2 border border-destructive/20">
                                    <AlertOctagon className="h-4 w-4" />
                                    <span>Suspicious activity detected! Focus returned to exam window.</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Confidence Score</span>
                                    <span className="font-medium text-emerald-500">98%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[98%]" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Warnings Issued</span>
                                    <span className={cn("font-medium", warnings > 0 ? "text-destructive" : "text-emerald-500")}>
                                        {warnings} / 3
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all", warnings > 0 ? "bg-destructive" : "bg-emerald-500")}
                                        style={{ width: `${(warnings / 3) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="rounded-lg border bg-card p-4 space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        Answer Status
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                        {EXAM_QUESTIONS.map((q, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "aspect-square rounded flex items-center justify-center text-sm font-medium transition-colors",
                                    selectedAnswers[q.id]
                                        ? "bg-primary text-primary-foreground"
                                        : currentQuestion === idx
                                            ? "border border-primary text-primary"
                                            : "bg-secondary text-muted-foreground"
                                )}
                            >
                                {idx + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ExamSession() {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center p-8">Loading session...</div>}>
            <ExamSessionContent />
        </Suspense>
    )
}
