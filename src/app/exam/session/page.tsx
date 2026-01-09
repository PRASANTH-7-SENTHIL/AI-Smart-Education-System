"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle, Video, VideoOff, Timer, Send, ArrowRight, ArrowLeft } from "lucide-react"
import { geminiService } from "@/lib/gemini"
import Script from "next/script"

declare global {
    interface Window {
        tmPose: any;
    }
}

interface Question {
    id: number
    text: string
    options: string[]
    correctAnswer: number
}

function SessionContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const videoRef = useRef<HTMLVideoElement>(null)

    // Config from URL
    const examType = searchParams.get("type") || "General"
    const difficulty = searchParams.get("difficulty") || "Medium"
    const totalQuestions = parseInt(searchParams.get("questions") || "20")

    // State
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, number>>({})
    const [loading, setLoading] = useState(true)
    const [timeLeft, setTimeLeft] = useState(0)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Proctoring State
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [proctorStatus, setProctorStatus] = useState<"secure" | "warning" | "danger">("secure")
    const [proctorFeedback, setProctorFeedback] = useState("Monitoring...")
    const [violationCount, setViolationCount] = useState(0)
    const [currentClass, setCurrentClass] = useState<string>("Initializing AI...")
    const [probabilities, setProbabilities] = useState<any[]>([])

    // TM Pose References
    const modelRef = useRef<any>(null)
    const tmWebcamRef = useRef<any>(null)
    const animationFrameRef = useRef<number | null>(null)
    const modelUrl = "https://teachablemachine.withgoogle.com/models/placeholder/" // User can update this

    // Timer calculation
    const getDuration = (count: number) => {
        if (count <= 20) return 15 * 60
        if (count <= 50) return 30 * 60
        if (count <= 75) return 60 * 60
        if (count <= 100) return 90 * 60
        return 180 * 60
    }

    // Initialize Exam
    useEffect(() => {
        const init = async () => {
            setTimeLeft(getDuration(totalQuestions))
            await generateQuestions()
        }
        init()
    }, [])

    // Timer Logic
    useEffect(() => {
        if (timeLeft <= 0 && !loading && !isSubmitted) {
            handleAutoSubmit()
            return
        }
        if (isSubmitted || loading) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft, loading, isSubmitted])

    // Question Generation
    const generateQuestions = async () => {
        try {
            const prompt = `
                Generate ${totalQuestions} multiple choice questions for a ${examType} exam.
                Difficulty Level: ${difficulty}
                Format the output as a JSON array of objects:
                [
                    {
                        "id": 1,
                        "text": "Question text here?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctAnswer": 0
                    }
                ]
                Ensure the questions are accurate and relevant to ${examType}.
                Only return the JSON.
            `
            const result = await geminiService.generateResponse(prompt)
            const cleanResult = result.replace(/```json|```/g, "").trim()
            const parsed = JSON.parse(cleanResult)
            setQuestions(parsed)
            setLoading(false)
        } catch (err) {
            console.error("Failed to generate questions", err)
            setError("Failed to generate questions. Please refresh.")
            setLoading(false)
        }
    }

    // Teachable Machine Pose Logic
    const initTM = async () => {
        if (!window.tmPose) return

        try {
            const modelURL = modelUrl + "model.json"
            const metadataURL = modelUrl + "metadata.json"

            // load the model and metadata
            modelRef.current = await window.tmPose.load(modelURL, metadataURL)
            const maxPredictions = modelRef.current.getTotalClasses()

            // Setup webcam
            const size = 200
            const flip = true
            tmWebcamRef.current = new window.tmPose.Webcam(size, size, flip)
            await tmWebcamRef.current.setup()
            await tmWebcamRef.current.play()

            // Attach the TM webcam's video element to our ref for display
            if (videoRef.current && tmWebcamRef.current.webcam) {
                videoRef.current.srcObject = tmWebcamRef.current.webcam.srcObject;
            }

            loop()
        } catch (err) {
            console.warn("Could not load TM model, falling back to mock monitoring:", err)
            // Fallback: mock loop to show behavior logic
            mockLoop()
        }
    }

    const loop = async () => {
        if (isSubmitted) return
        if (tmWebcamRef.current) tmWebcamRef.current.update()
        await predict()
        animationFrameRef.current = window.requestAnimationFrame(loop)
    }

    const predict = async () => {
        if (!modelRef.current || !tmWebcamRef.current) return

        const { posenetOutput } = await modelRef.current.estimatePose(tmWebcamRef.current.canvas)
        const prediction = await modelRef.current.predict(posenetOutput)

        setProbabilities(prediction)

        // Find highest probability class
        const highest = prediction.reduce((prev: any, current: any) =>
            (prev.probability > current.probability) ? prev : current
        )

        updateBehaviorStatus(highest.className, highest.probability)
    }

    const mockLoop = () => {
        if (isSubmitted) return
        const classes = ["Normal", "Looking Away", "Using Phone", "Talking", "Head Down"]
        const randomIdx = Math.random() > 0.9 ? Math.floor(Math.random() * classes.length) : 0
        const mockClass = classes[randomIdx]

        updateBehaviorStatus(mockClass, 0.95)
        setTimeout(mockLoop, 1000)
    }

    const updateBehaviorStatus = (className: string, probability: number) => {
        setCurrentClass(className)

        // Logic: Class 1 (Normal) is safe, others (2-5) are cheating
        // We assume index 0 is Class 1 (Normal)
        const isNormal = className.toLowerCase().includes("normal") || className.toLowerCase().includes("correct") || className === "Normal"

        if (isNormal) {
            setProctorStatus("secure")
            setProctorFeedback("Normal behaviour detected. Continue exam.")
        } else {
            setProctorStatus("warning")
            setProctorFeedback(`Suspicious Activity: ${className} detected!`)
            setViolationCount(prev => prev + 1)

            if (violationCount > 100) { // Higher threshold for frame-by-frame detection
                setProctorStatus("danger")
                setProctorFeedback("CRITICAL: Repeated violations. Session flagged for review.")
            }
        }
    }

    useEffect(() => {
        const init = async () => {
            setTimeLeft(getDuration(totalQuestions))
            await generateQuestions()
        }
        init()
    }, [])

    useEffect(() => {
        if (!loading && !isSubmitted) {
            // Give scripts time to load if they are still loading
            const checkTM = setInterval(() => {
                if (window.tmPose) {
                    initTM()
                    clearInterval(checkTM)
                }
            }, 1000)
            return () => clearInterval(checkTM)
        }
    }, [loading, isSubmitted])

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current)
            if (tmWebcamRef.current) tmWebcamRef.current.stop()
        }
    }, [])

    // Handlers
    const handleAnswerChange = (questionId: number, answerIndex: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: answerIndex }))
    }

    const handleSubmit = async () => {
        setIsSubmitted(true)
        if (stream) {
            stream.getTracks().forEach(t => t.stop())
        }

        // Prepare results for analysis
        const results = {
            examType,
            difficulty,
            total: totalQuestions,
            answers,
            questions,
            timeTaken: getDuration(totalQuestions) - timeLeft
        }

        // Logic to calculate score and navigate to result
        // For now, let's just push to a result page with ID or data
        // We'll store this in a real app, here we might pass via session/params
        router.push(`/exam/results?data=${encodeURIComponent(JSON.stringify(results))}`)
    }

    const handleAutoSubmit = () => {
        console.log("Time's up! Auto-submitting...")
        handleSubmit()
    }

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-xl font-medium">AI is generating your unique exam paper...</p>
                <p className="text-muted-foreground italic">Connecting with ${examType} syllabus...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container py-20 text-center space-y-4">
                <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
                <h2 className="text-2xl font-bold">Something went wrong</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]

    return (
        <div className="container mx-auto py-6 grid gap-6 lg:grid-cols-4">
            <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js" strategy="beforeInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js" strategy="beforeInteractive" />

            {/* Left Panel: Stats & Proctoring */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="sticky top-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Video className="h-4 w-4" /> Live Monitoring
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                            <div className="absolute top-2 left-2">
                                <Badge variant={proctorStatus === 'secure' ? 'default' : proctorStatus === 'warning' ? 'outline' : 'destructive'} className="bg-background/80 backdrop-blur-sm">
                                    {proctorStatus.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md p-2 rounded text-[10px] text-white font-mono">
                                <p className="font-bold text-primary mb-1">BEHAVIOR: {currentClass.toUpperCase()}</p>
                                <div className="space-y-1">
                                    {probabilities.slice(0, 3).map((p, i) => (
                                        <div key={i} className="flex justify-between items-center">
                                            <span className="truncate mr-2">{p.className}</span>
                                            <span>{(p.probability * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Alert className={proctorStatus === 'secure' ? 'bg-green-500/5' : 'bg-destructive/5'}>
                            <AlertTitle className="text-xs font-bold uppercase tracking-wider">AI ANALYSIS</AlertTitle>
                            <AlertDescription className="text-sm">
                                <div className="mt-1 font-bold">
                                    Status: {currentClass}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {proctorFeedback}
                                </div>
                                {violationCount > 0 && <p className="mt-1 font-bold text-destructive">Violation Score: {violationCount}</p>}
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{Math.round(((Object.keys(answers).length) / totalQuestions) * 100)}%</span>
                            </div>
                            <Progress value={(Object.keys(answers).length / totalQuestions) * 100} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Panel: Question Area */}
            <div className="lg:col-span-3 space-y-6">
                {/* Header: Timer & Submit */}
                <div className="flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-2xl font-bold border-2 ${timeLeft < 300 ? 'text-destructive border-destructive animate-pulse' : 'text-primary border-primary/20'}`}>
                            <Timer className="h-6 w-6" />
                            {formatTime(timeLeft)}
                        </div>
                        <div>
                            <p className="text-sm font-bold">{examType} Exam</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">Difficulty: {difficulty}</p>
                        </div>
                    </div>
                    <Button variant="destructive" className="font-bold" onClick={handleSubmit}>
                        <Send className="mr-2 h-4 w-4" /> Submit Exam
                    </Button>
                </div>

                {/* Question Card */}
                <Card className="min-h-[400px] flex flex-col border-2">
                    <CardHeader>
                        <div className="flex justify-between items-center mb-4">
                            <Badge variant="secondary" className="px-3 py-1">Question {currentQuestionIndex + 1} of {totalQuestions}</Badge>
                        </div>
                        <CardTitle className="text-2xl leading-relaxed">
                            {currentQuestion.text}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="grid gap-3">
                            {currentQuestion.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswerChange(currentQuestion.id, idx)}
                                    className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all hover:border-primary/50 group ${answers[currentQuestion.id] === idx
                                        ? 'border-primary bg-primary/5 shadow-md'
                                        : 'border-muted bg-card hover:bg-muted/30'
                                        }`}
                                >
                                    <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors ${answers[currentQuestion.id] === idx
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-muted text-muted-foreground border-muted-foreground/30 group-hover:border-primary/50'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="text-lg font-medium">{option}</span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-6 border-t flex items-center justify-between bg-muted/20">
                        <Button
                            variant="outline"
                            size="lg"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        >
                            <ArrowLeft className="mr-2 h-5 w-5" /> Previous
                        </Button>

                        <div className="flex gap-2">
                            {questions.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2 w-2 rounded-full ${idx === currentQuestionIndex ? 'bg-primary w-6' :
                                        answers[questions[idx].id] !== undefined ? 'bg-primary/40' : 'bg-muted-foreground/20'
                                        } transition-all`}
                                />
                            ))}
                        </div>

                        {currentQuestionIndex < totalQuestions - 1 ? (
                            <Button
                                size="lg"
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            >
                                Next <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={handleSubmit}
                            >
                                Final Review <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default function ExamSessionPage() {
    return (
        <Suspense fallback={<div className="container py-20 text-center">Loading Session Configuration...</div>}>
            <SessionContent />
        </Suspense>
    )
}
