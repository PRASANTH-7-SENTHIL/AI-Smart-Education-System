"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Trophy, Clock, Target, CheckCircle2, XCircle, BrainCircuit, RefreshCcw, Home } from "lucide-react"
import { geminiService } from "@/lib/gemini"

interface ExamData {
    examType: string
    difficulty: string
    total: number
    answers: Record<number, number>
    questions: any[]
    timeTaken: number
}

function ResultsContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [data, setData] = useState<ExamData | null>(null)
    const [score, setScore] = useState(0)
    const [aiFeedback, setAiFeedback] = useState<string>("")
    const [loadingFeedback, setLoadingFeedback] = useState(true)

    useEffect(() => {
        const rawData = searchParams.get("data")
        if (rawData) {
            try {
                const parsed = JSON.parse(decodeURIComponent(rawData))
                setData(parsed)
                calculateScore(parsed)
            } catch (e) {
                console.error("Failed to parse result data", e)
            }
        }
    }, [searchParams])

    const calculateScore = (examData: ExamData) => {
        let correct = 0
        examData.questions.forEach((q) => {
            if (examData.answers[q.id] === q.correctAnswer) {
                correct++
            }
        })
        setScore(correct)
    }

    useEffect(() => {
        if (data && score !== undefined) {
            generateAiFeedback()
        }
    }, [data, score])

    const generateAiFeedback = async () => {
        if (!data) return
        setLoadingFeedback(true)
        try {
            const prompt = `
                Analyze the following exam results and provide a concise, motivational feedback report.
                Exam Type: ${data.examType}
                Difficulty: ${data.difficulty}
                Score: ${score} / ${data.total}
                Time Taken: ${Math.floor(data.timeTaken / 60)} minutes and ${data.timeTaken % 60} seconds.
                
                Provide:
                1. A brief summary of the performance.
                2. Key strengths (based on the score).
                3. Areas for improvement.
                4. A suggested study strategy.
                
                Keep it professional and encouraging.
            `
            const feedback = await geminiService.generateResponse(prompt)
            setAiFeedback(feedback)
        } catch (e) {
            console.error("Failed to generate AI feedback", e)
            setAiFeedback("Great effort! Keep practicing to improve your speed and accuracy.")
        } finally {
            setLoadingFeedback(false)
        }
    }

    if (!data) return <div className="p-20 text-center">No data available.</div>

    const percentage = Math.round((score / data.total) * 100)
    const minutes = Math.floor(data.timeTaken / 60)
    const seconds = data.timeTaken % 60

    return (
        <div className="container mx-auto py-10 max-w-5xl space-y-8">
            <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                    <Trophy className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight">Exam Completed!</h1>
                <p className="text-xl text-muted-foreground italic">
                    Great job on completing your {data.examType} assessment.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Score Card */}
                <Card className="border-2 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Total Score</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                        <div className="text-6xl font-black text-primary">{percentage}%</div>
                        <p className="text-lg font-medium">{score} / {data.total} Correct Answers</p>
                        <Progress value={percentage} className="h-3" />
                    </CardContent>
                </Card>

                {/* Accuracy Card */}
                <Card className="border-2 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Accuracy & Focus</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="flex justify-around items-center h-24">
                            <div className="flex flex-col items-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-1" />
                                <span className="font-bold">{score}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">Correct</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <XCircle className="h-8 w-8 text-destructive mb-1" />
                                <span className="font-bold">{data.total - score}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">Incorrect</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <Target className="h-8 w-8 text-blue-500 mb-1" />
                                <span className="font-bold">{data.difficulty}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">Level</span>
                            </div>
                        </div>
                        <Badge variant="outline" className="w-full justify-center py-1">Highly Precise</Badge>
                    </CardContent>
                </Card>

                {/* Time Card */}
                <Card className="border-2 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Efficiency</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="text-4xl font-black flex items-center justify-center gap-2">
                            <Clock className="h-8 w-8 text-primary" />
                            {minutes}m {seconds}s
                        </div>
                        <p className="text-sm text-muted-foreground italic">Avg: {Math.round(data.timeTaken / data.total)}s per question</p>
                        <div className="p-3 bg-muted rounded-lg text-xs font-medium">
                            Faster than 85% of peers
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* AI Performance Analysis */}
                <Card className="md:col-span-1 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BrainCircuit className="h-5 w-5 text-primary" />
                            AI Insights & Feedback
                        </CardTitle>
                        <CardDescription>Personalized analysis of your performance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingFeedback ? (
                            <div className="flex flex-col items-center py-10 space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">AI is analyzing your patterns...</p>
                            </div>
                        ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                                {aiFeedback}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Detailed Breakdown */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Topic Wise Strength</CardTitle>
                        <CardDescription>Where you shined and where to focus.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span>Core Concepts</span>
                                <span>90%</span>
                            </div>
                            <Progress value={90} className="h-2 bg-emerald-500/20" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span>Problem Solving</span>
                                <span>65%</span>
                            </div>
                            <Progress value={65} className="h-2 bg-blue-500/20" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span>Time Management</span>
                                <span>{Math.max(10, 100 - percentage)}%</span>
                            </div>
                            <Progress value={Math.max(10, 100 - percentage)} className="h-2 bg-yellow-500/20" />
                        </div>

                        <div className="pt-4 border-t space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Improvement Actions</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" className="justify-start">
                                    <Target className="mr-2 h-3 w-3" /> Practice Easy
                                </Button>
                                <Button variant="outline" size="sm" className="justify-start">
                                    <Clock className="mr-2 h-3 w-3" /> Time Drills
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">
                <Button size="lg" className="px-10 font-bold" onClick={() => router.push("/exam/config")}>
                    <RefreshCcw className="mr-2 h-5 w-5" /> Retake Exam
                </Button>
                <Button size="lg" variant="outline" className="px-10 font-bold" onClick={() => router.push("/dashboard")}>
                    <Home className="mr-2 h-5 w-5" /> Back to Dashboard
                </Button>
            </div>
        </div>
    )
}

export default function ExamResultsPage() {
    return (
        <Suspense fallback={<div className="container py-20 text-center">Loading results...</div>}>
            <ResultsContent />
        </Suspense>
    )
}
