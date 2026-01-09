"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle, Video, VideoOff } from "lucide-react"
import Script from "next/script"

declare global {
    interface Window {
        tmPose: any
    }
}

export default function ProctoringPage() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [status, setStatus] = useState<"secure" | "warning" | "danger">("secure")
    const [feedback, setFeedback] = useState<string>("Waiting to start session...")
    const [currentClass, setCurrentClass] = useState<string>("Inactive")
    const [probabilities, setProbabilities] = useState<any[]>([])
    const [violationCount, setViolationCount] = useState(0)

    // TM Pose References
    const modelRef = useRef<any>(null)
    const tmWebcamRef = useRef<any>(null)
    const animationFrameRef = useRef<number | null>(null)
    const modelUrl = "https://teachablemachine.withgoogle.com/models/placeholder/"

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current)
            if (tmWebcamRef.current) tmWebcamRef.current.stop()
        }
    }, [])

    const startProctoring = async () => {
        if (!window.tmPose) {
            setFeedback("Loading AI scripts, please wait...")
            return
        }

        try {
            setFeedback("Initializing AI Model...")
            const modelURL = modelUrl + "model.json"
            const metadataURL = modelUrl + "metadata.json"

            modelRef.current = await window.tmPose.load(modelURL, metadataURL)

            const size = 400
            const flip = true
            tmWebcamRef.current = new window.tmPose.Webcam(size, size, flip)
            await tmWebcamRef.current.setup()
            await tmWebcamRef.current.play()

            setStream(tmWebcamRef.current.webcam.srcObject)
            if (videoRef.current) {
                videoRef.current.srcObject = tmWebcamRef.current.webcam.srcObject
            }

            setFeedback("Continuous monitoring active.")
            loop()
        } catch (err) {
            console.error("Error starting TM Pose:", err)
            setFeedback("Failed to load model. Running in simulation mode...")
            setStream(new MediaStream()) // Dummy stream for UI
            mockLoop()
        }
    }

    const stopProctoring = () => {
        if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current)
        if (tmWebcamRef.current) tmWebcamRef.current.stop()
        setStream(null)
        setFeedback("Session ended.")
        setStatus("secure")
        setCurrentClass("Inactive")
    }

    const loop = async () => {
        if (tmWebcamRef.current) tmWebcamRef.current.update()
        await predict()
        animationFrameRef.current = window.requestAnimationFrame(loop)
    }

    const predict = async () => {
        if (!modelRef.current || !tmWebcamRef.current) return
        const { posenetOutput } = await modelRef.current.estimatePose(tmWebcamRef.current.canvas)
        const prediction = await modelRef.current.predict(posenetOutput)
        setProbabilities(prediction)
        const highest = prediction.reduce((prev: any, curr: any) =>
            (prev.probability > curr.probability) ? prev : curr
        )
        updateStatus(highest.className)
    }

    const mockLoop = () => {
        if (!stream) return
        const classes = ["Normal", "Looking Away", "Using Phone", "Talking"]
        const mockClass = Math.random() > 0.9 ? classes[Math.floor(Math.random() * classes.length)] : "Normal"
        updateStatus(mockClass)
        setTimeout(mockLoop, 2000)
    }

    const updateStatus = (className: string) => {
        setCurrentClass(className)
        const isNormal = className.toLowerCase().includes("normal")
        if (isNormal) {
            setStatus("secure")
        } else {
            setStatus("warning")
            setViolationCount(prev => prev + 1)
        }
    }

    return (
        <div className="space-y-6">
            <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js" strategy="beforeInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js" strategy="beforeInteractive" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Exam Proctoring</h1>
                    <p className="text-muted-foreground">Secure, automated monitoring for your exams.</p>
                </div>
                <div className="flex gap-2">
                    {!stream ? (
                        <Button onClick={startProctoring}>Start Session</Button>
                    ) : (
                        <Button variant="destructive" onClick={stopProctoring}>End Session</Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Continuous Monitoring Feed</CardTitle>
                        <CardDescription>Real-time pose analysis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative aspect-video rounded-lg bg-black overflow-hidden flex items-center justify-center">
                            {stream ? (
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                            ) : (
                                <div className="flex flex-col items-center text-muted-foreground">
                                    <VideoOff className="h-12 w-12 mb-2" />
                                    <p>Camera is off</p>
                                </div>
                            )}
                            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-lg text-white font-mono border border-white/10">
                                <p className="text-xs font-bold text-primary mb-2 uppercase tracking-tighter">Detected Behaviour</p>
                                <p className="text-xl font-black mb-2">{currentClass.toUpperCase()}</p>
                                <div className="space-y-1">
                                    {probabilities.slice(0, 4).map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px]">
                                            <span className="opacity-70">{p.className}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${p.probability * 100}%` }} />
                                                </div>
                                                <span className="w-6 text-right font-bold">{(p.probability * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Behavior Analysis</CardTitle>
                        <CardDescription>AI-detected events and status log.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className={`p-6 rounded-xl border-2 flex flex-col items-center gap-2 text-center ${status === 'secure' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                            status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}>
                            {status === 'secure' && <CheckCircle className="h-12 w-12 mb-2" />}
                            {status === 'warning' && <AlertTriangle className="h-12 w-12 mb-2 animate-pulse" />}
                            <span className="text-2xl font-black italic">
                                {status === 'secure' ? 'SECURE ENVIRONMENT' : 'SUSPICIOUS ACTIVITY'}
                            </span>
                            <p className="text-sm font-medium opacity-80">{feedback}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Violation Score</p>
                                <p className="text-2xl font-black">{violationCount}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Session Duration</p>
                                <p className="text-2xl font-black">Live</p>
                            </div>
                        </div>

                        <Alert>
                            <AlertTitle className="text-xs font-bold">SYSTEM LOG</AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground mt-1">
                                [AI Engine]: Initialized PoseNet. Monitoring 5 behaviour classes...
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
