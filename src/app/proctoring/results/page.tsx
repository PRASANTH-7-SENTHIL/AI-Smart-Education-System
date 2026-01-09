"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle, Download, RefreshCw, ArrowRight, BarChart } from "lucide-react"
import Link from "next/link"

export default function ExamResults() {
    // Mock Results Data
    const score = 85
    const totalQuestions = 20
    const correct = 17
    const wrong = 3
    const timeTaken = "24m 30s"
    const warnings = 1

    return (
        <div className="container mx-auto max-w-4xl py-12 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Exam Evaluation Report</h1>
                <p className="text-muted-foreground">
                    Detailed analysis of your performance and proctoring logs.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Performance Summary</CardTitle>
                        <CardDescription>Overall score and question breakdown.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-center py-4">
                            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-primary/20">
                                <div className="flex flex-col items-center">
                                    <span className="text-4xl font-bold text-primary">{score}%</span>
                                    <span className="text-xs text-muted-foreground">Score</span>
                                </div>
                                <svg className="absolute top-0 left-0 h-full w-full -rotate-90 transform">
                                    <circle
                                        className="text-primary"
                                        strokeWidth="8"
                                        strokeDasharray={100 * 3.14} // Approx circumference for mockup
                                        strokeDashoffset={100 * 3.14 * (1 - score / 100)}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="58" // calculated to fit
                                        cx="80"
                                        cy="80"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="rounded-lg border p-3">
                                <div className="flex items-center justify-center gap-2 text-emerald-500 mb-1">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-bold">{correct}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Correct</span>
                            </div>
                            <div className="rounded-lg border p-3">
                                <div className="flex items-center justify-center gap-2 text-destructive mb-1">
                                    <XCircle className="h-4 w-4" />
                                    <span className="font-bold">{wrong}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Incorrect</span>
                            </div>
                            <div className="rounded-lg border p-3">
                                <div className="flex items-center justify-center gap-2 text-blue-500 mb-1">
                                    <BarChart className="h-4 w-4" />
                                    <span className="font-bold">Top 10%</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Percentile</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Proctoring Report</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Integrity Score</span>
                                <span className="font-bold text-emerald-500">95%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Focus Duration</span>
                                <span className="font-medium">24m 10s</span>
                            </div>
                            <div className="rounded-md bg-yellow-500/10 p-3 text-sm border border-yellow-500/20">
                                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="font-medium">1 Warning Issued</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    User changed tabs/window focus at 12:45 PM.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-primary">AI Feedback</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Great job on the React Hooks section! You consistently answered correctly. However, consider reviewing <strong>Next.js Routing patterns</strong> as you hesitated on those questions.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <Link href="/proctoring">
                    <Button variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Retake Exam
                    </Button>
                </Link>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Report
                </Button>
                <Link href="/learning-path">
                    <Button className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                        View Recommended Learning Path
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
