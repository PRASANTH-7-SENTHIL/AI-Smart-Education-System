"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Video, VideoOff, Timer, Send, ArrowRight, ArrowLeft } from "lucide-react"
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
    const [currentClass, setCurrentClass] = useState<string>("Initializing...")
    const [probabilities, setProbabilities] = useState<any[]>([])

    // Script & Model State
    const [scriptsLoaded, setScriptsLoaded] = useState({ tf: false, tm: false })
    const [isModelLoading, setIsModelLoading] = useState(false)
    const [isModelReady, setIsModelReady] = useState(false)
    const [cameraPermission, setCameraPermission] = useState<"pending" | "granted" | "denied">("pending")

    // TM Pose References
    const modelRef = useRef<any>(null)
    const tmWebcamRef = useRef<any>(null)
    const animationFrameRef = useRef<number | null>(null)
    const modelUrl = "https://teachablemachine.withgoogle.com/models/kQ8TNxEXA/"

    const getDuration = (count: number) => {
        if (count <= 20) return 15 * 60
        if (count <= 50) return 30 * 60
        if (count <= 75) return 60 * 60
        if (count <= 100) return 90 * 60
        return 180 * 60
    }

    // Initialize Questions
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

    // Initialize Teachable Machine triggered by script load or useEffect
    useEffect(() => {
        if (scriptsLoaded.tm && !isModelReady && !isModelLoading && !isSubmitted) {
            initTM()
        }
    }, [scriptsLoaded, isModelReady, isModelLoading, isSubmitted])

    const initTM = async () => {
        if (!window.tmPose) return

        setIsModelLoading(true)
        setProctorFeedback("Requesting Camera Access...")

        try {
            const size = 200
            const flip = true
            tmWebcamRef.current = new window.tmPose.Webcam(size, size, flip)
            await tmWebcamRef.current.setup()
            await tmWebcamRef.current.play()

            setCameraPermission("granted")
            setProctorFeedback("Loading AI Model...")

            if (videoRef.current && tmWebcamRef.current.webcam) {
                videoRef.current.srcObject = tmWebcamRef.current.webcam.srcObject;
                setStream(tmWebcamRef.current.webcam.srcObject)
            }

            const modelURL = modelUrl + "model.json"
            const metadataURL = modelUrl + "metadata.json"

            modelRef.current = await window.tmPose.load(modelURL, metadataURL)
            setIsModelReady(true)
            setIsModelLoading(false)
            setProctorFeedback("System Ready.")

            loop()
        } catch (err) {
            console.warn("Could not load TM model:", err)
            setCameraPermission("denied")
            setIsModelLoading(false)
            setProctorFeedback("Camera access denied or Model failed.")
        }
    }

    const loop = async () => {
        if (isSubmitted) {
            if (tmWebcamRef.current) tmWebcamRef.current.stop()
            return
        }

        if (tmWebcamRef.current) {
            tmWebcamRef.current.update()
            await predict()
        }

        animationFrameRef.current = window.requestAnimationFrame(loop)
    }

    const predict = async () => {
        if (!modelRef.current || !tmWebcamRef.current) return

        const { posenetOutput } = await modelRef.current.estimatePose(tmWebcamRef.current.canvas)
        const prediction = await modelRef.current.predict(posenetOutput)

        // Map predictions to user-friendly format
        const mappedPredictions = prediction.map((p: any) => ({
            className: mapLabel(p.className),
            probability: p.probability
        }))

        setProbabilities(mappedPredictions)

        const highest = mappedPredictions.reduce((prev: any, current: any) =>
            (prev.probability > current.probability) ? prev : current
        )

        updateBehaviorStatus(highest.className)
    }

    const mapLabel = (label: string): string => {
        const l = label.toLowerCase()
        if (l.includes("normal") || l === "normal") return "Normal"
        if (l.includes("left")) return "Left"
        if (l.includes("right")) return "Right"
        if (l.includes("up")) return "Up"
        if (l.includes("down")) return "Down"
        return label // Fallback
    }

    const updateBehaviorStatus = (className: string) => {
        setCurrentClass(className)

        if (className === "Normal") {
            setProctorStatus("secure")
            setProctorFeedback("Normal behaviour detected.")
        } else {
            setProctorStatus("warning")
            setProctorFeedback(`Suspicious Activity: Looking ${className}`)
            setViolationCount(prev => prev + 1)
        }
    }

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current)
            if (tmWebcamRef.current) tmWebcamRef.current.stop()
        }
    }, [])

    const handleAnswerChange = (questionId: number, answerIndex: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: answerIndex }))
    }

    const handleSubmit = async () => {
        setIsSubmitted(true)
        if (stream) {
            stream.getTracks().forEach(t => t.stop())
        }

        const results = {
            examType,
            difficulty,
            total: totalQuestions,
            answers,
            questions,
            timeTaken: getDuration(totalQuestions) - timeLeft
        }

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
                <p className="text-xl font-medium">Generating Exam...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container py-20 text-center">
                <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
                <h2 className="text-2xl font-bold">Error Loading Exam</h2>
                <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]

    return (
        <div className="container mx-auto py-6 grid gap-6 lg:grid-cols-4">
            <Script
                src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js"
                strategy="afterInteractive"
                onLoad={() => setScriptsLoaded(prev => ({ ...prev, tf: true }))}
            />
            {scriptsLoaded.tf && (
                <Script
                    src="https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js"
                    strategy="afterInteractive"
                    onLoad={() => setScriptsLoaded(prev => ({ ...prev, tm: true }))}
                />
            )}

            {/* Left Panel: Monitoring */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="sticky top-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Video className="h-4 w-4" /> Live Monitoring
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden relative border-2 border-muted">
                            {stream ? (
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <VideoOff className="h-8 w-8 mb-2" />
                                    <p className="text-xs">Camera Off</p>
                                </div>
                            )}

                            {stream && (
                                <div className="absolute top-2 left-2">
                                    <Badge variant={proctorStatus === 'secure' ? 'default' : 'destructive'} className="bg-background/80 backdrop-blur-sm">
                                        {proctorStatus.toUpperCase()}
                                    </Badge>
                                </div>
                            )}

                            {stream && (
                                <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md p-2 rounded text-[10px] text-white font-mono">
                                    <p className="font-bold text-primary mb-1">STATUS: {currentClass.toUpperCase()}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            {probabilities.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-xs">
                                    <span>{p.className}</span>
                                    <Progress value={p.probability * 100} className="h-1 w-16" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Panel */}
            <div className="lg:col-span-3 space-y-6">
                <div className="flex justify-between items-center p-4 bg-card border rounded-xl">
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-2xl font-bold text-primary flex items-center gap-2">
                            <Timer className="h-6 w-6" /> {formatTime(timeLeft)}
                        </span>
                        <div>
                            <p className="font-bold">{examType} Exam</p>
                            <p className="text-xs text-muted-foreground">{difficulty}</p>
                        </div>
                    </div>
                    <Button variant="destructive" onClick={handleSubmit}>Submit</Button>
                </div>

                <Card className="min-h-[400px] flex flex-col border-2">
                    <CardHeader>
                        <Badge variant="secondary" className="w-fit mb-2">Q{currentQuestion.id}</Badge>
                        <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                        {currentQuestion.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswerChange(currentQuestion.id, idx)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[currentQuestion.id] === idx
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:bg-muted/50'
                                    }`}
                            >
                                <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
                                {option}
                            </button>
                        ))}
                    </CardContent>
                    <div className="p-6 border-t flex justify-between bg-muted/20">
                        <Button
                            variant="outline"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(p => p - 1)}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                        </Button>
                        {currentQuestionIndex < totalQuestions - 1 ? (
                            <Button onClick={() => setCurrentQuestionIndex(p => p + 1)}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>
                                Finish <ArrowRight className="ml-2 h-4 w-4" />
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
        <Suspense fallback={<div className="p-20 text-center">Loading...</div>}>
            <SessionContent />
        </Suspense>
    )
}
