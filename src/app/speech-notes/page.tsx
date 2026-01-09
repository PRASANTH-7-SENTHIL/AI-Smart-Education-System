"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, FileText, Loader2, Save } from "lucide-react"
import { geminiService } from "@/lib/gemini"

// Define SpeechRecognition types as they might not be in standard TS lib
declare global {
    interface Window {
        webkitSpeechRecognition: any
        SpeechRecognition: any
    }
}

export default function SpeechNotesPage() {
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [notes, setNotes] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [recognition, setRecognition] = useState<any>(null)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (SpeechRecognition) {
                const recognitionInstance = new SpeechRecognition()
                recognitionInstance.continuous = true
                recognitionInstance.interimResults = true

                recognitionInstance.onresult = (event: any) => {
                    let currentTranscript = ""
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        currentTranscript += event.results[i][0].transcript
                    }
                    setTranscript(prev => prev + " " + currentTranscript)
                }

                recognitionInstance.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error)
                    setIsRecording(false)
                }

                setRecognition(recognitionInstance)
            }
        }
    }, [])

    const toggleRecording = () => {
        if (isRecording) {
            recognition?.stop()
            setIsRecording(false)
        } else {
            setTranscript("") // Clear previous or append? Let's clear for new session
            recognition?.start()
            setIsRecording(true)
        }
    }

    const generateNotes = async () => {
        if (!transcript) return
        setIsProcessing(true)

        const prompt = `
      Convert the following unstructured speech transcript into organized, concise study notes.
      Use bullet points, headers, and bold text for key terms.
      
      Transcript:
      "${transcript}"
    `

        try {
            const result = await geminiService.generateResponse(prompt)
            setNotes(result)
        } catch (error) {
            console.error("Error generating notes:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Speech-to-Notes AI</h1>
                <p className="text-muted-foreground">Record lectures and let AI organize them into perfect notes.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="h-[600px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Recording & Transcript</CardTitle>
                        <CardDescription>Speak clearly or play a lecture.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                        <div className="flex-1 p-4 bg-muted/30 rounded-lg border overflow-y-auto whitespace-pre-wrap">
                            {transcript || <span className="text-muted-foreground italic">Transcript will appear here...</span>}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant={isRecording ? "destructive" : "default"}
                                onClick={toggleRecording}
                                className="flex-1"
                            >
                                {isRecording ? (
                                    <>
                                        <MicOff className="mr-2 h-4 w-4" /> Stop Recording
                                    </>
                                ) : (
                                    <>
                                        <Mic className="mr-2 h-4 w-4" /> Start Recording
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={generateNotes}
                                disabled={!transcript || isProcessing || isRecording}
                            >
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                Generate Notes
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-[600px] flex flex-col">
                    <CardHeader>
                        <CardTitle>AI Summarized Notes</CardTitle>
                        <CardDescription>Your structured study material.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        {isProcessing ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <p>Organizing content...</p>
                            </div>
                        ) : notes ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                {notes.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <FileText className="h-12 w-12 mb-2" />
                                <p>Generated notes will appear here</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
