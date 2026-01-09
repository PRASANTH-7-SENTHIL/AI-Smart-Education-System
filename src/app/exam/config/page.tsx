"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardList, BrainCircuit, Timer, ArrowRight, BookOpen } from "lucide-react"

const EXAM_TYPES = [
    "NEET",
    "JEE",
    "IIT",
    "UPSC",
    "TNPSC",
    "Digital Marketing",
    "Software Engineering",
    "Artificial Intelligence"
]

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"]

const QUESTION_COUNTS = [20, 50, 75, 100, 200]

const DURATION_MAPPING: Record<number, string> = {
    20: "15 minutes",
    50: "30 minutes",
    75: "1 hour",
    100: "1 hour 30 minutes",
    200: "3 hours"
}

export default function ExamConfigPage() {
    const router = useRouter()
    const [examType, setExamType] = useState<string>("")
    const [difficulty, setDifficulty] = useState<string>("Medium")
    const [questionCount, setQuestionCount] = useState<string>("20")

    const handleStartExam = () => {
        if (!examType) return

        // Pass configuration via query params or state management
        const params = new URLSearchParams({
            type: examType,
            difficulty,
            questions: questionCount
        })
        router.push(`/exam/session?${params.toString()}`)
    }

    return (
        <div className="container mx-auto max-w-2xl py-12 space-y-8">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
                    <BrainCircuit className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Setup Your AI Exam</h1>
                <p className="text-muted-foreground text-lg">
                    Configure your session. AI will generate a unique set of questions for you.
                </p>
            </div>

            <Card className="border-2 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Exam Configuration</CardTitle>
                    <CardDescription>All fields are required to generate your personalized roadmap.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Step 1: Exam Type */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Step 1: Select Exam Type
                        </Label>
                        <Select onValueChange={setExamType} value={examType}>
                            <SelectTrigger className="h-12 text-lg">
                                <SelectValue placeholder="Choose an exam category..." />
                            </SelectTrigger>
                            <SelectContent>
                                {EXAM_TYPES.map((type) => (
                                    <SelectItem key={type} value={type} className="text-lg py-3">
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Step 2: Difficulty */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            Step 2: Select Difficulty Level
                        </Label>
                        <Select onValueChange={setDifficulty} value={difficulty}>
                            <SelectTrigger className="h-12 text-lg">
                                <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                                {DIFFICULTY_LEVELS.map((level) => (
                                    <SelectItem key={level} value={level} className="text-lg py-3">
                                        {level}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Step 3: Question Count */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <BrainCircuit className="h-4 w-4 text-primary" />
                            Step 3: Number of Questions
                        </Label>
                        <Select onValueChange={setQuestionCount} value={questionCount}>
                            <SelectTrigger className="h-12 text-lg">
                                <SelectValue placeholder="How many questions?" />
                            </SelectTrigger>
                            <SelectContent>
                                {QUESTION_COUNTS.map((count) => (
                                    <SelectItem key={count} value={count.toString()} className="text-lg py-3">
                                        {count} Questions
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Auto-Duration Info */}
                    <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-md border shadow-sm">
                                <Timer className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Assigned Duration</p>
                                <p className="text-xl font-bold text-primary">
                                    {DURATION_MAPPING[parseInt(questionCount)]}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Auto-calculated</p>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full h-14 text-xl font-bold transition-all hover:scale-[1.02]"
                        disabled={!examType}
                        onClick={handleStartExam}
                    >
                        Start AI Exam
                        <ArrowRight className="ml-2 h-6 w-6" />
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: "AI Generated", desc: "Every exam is unique" },
                    { title: "Live Proctoring", desc: "Strict secure environment" },
                    { title: "Instant Result", desc: "Detailed AI feedback" }
                ].map((feature, i) => (
                    <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl border bg-card/50">
                        <p className="font-bold text-sm">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
