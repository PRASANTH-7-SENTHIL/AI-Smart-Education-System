"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, FileText, Loader2, Download, Printer } from "lucide-react"
import { geminiService } from "@/lib/gemini"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/auth-context"
import { logActivity } from "@/lib/activity-logger"

// Define SpeechRecognition types as they might not be in standard TS lib
declare global {
    interface Window {
        webkitSpeechRecognition: any
        SpeechRecognition: any
    }
}

export default function SpeechNotesPage() {
    const { user } = useAuth()
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
                    // For continuous recording, we might want to append, but avoid duplication in interim
                    // A simple approach for this demo:
                    if (event.results[event.results.length - 1].isFinal) {
                        setTranscript(prev => prev + " " + event.results[event.results.length - 1][0].transcript)
                    }
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
            // setTranscript("") // Optional: Clear on new record? Let's keep it to allow appending.
            recognition?.start()
            setIsRecording(true)
        }
    }

    const generateNotes = async () => {
        if (!transcript) return
        setIsProcessing(true)

        // Detailed prompt based on user request
        const prompt = `
            You are an AI assistant for a speech-to-notes system.
            
            OBJECTIVES:
            1. Correct all grammar and spelling errors.
            2. Remove unnecessary filler words and repeated phrases.
            3. Convert the content into clear, well-structured educational notes.
            4. Organize the content logically for easy student understanding.
            5. Generate an AI-formatted academic report suitable for study material.

            FORMAT REQUIREMENTS:
            - Title
            - Abstract
            - Introduction
            - Topic Explanation (use headings and bullet points)
            - Examples (if applicable)
            - Conclusion
            - Key Learning Outcomes

            TONE:
            - Formal
            - Educational
            - Student-friendly
            - Academic standard

            CRITICAL OUTPUT FORMAT INSTRUCTION:
            - Return the response ONLY as raw semantic HTML (e.g., <h1>, <h2>, <p>, <ul>, <li>, <strong>).
            - Do NOT include <html>, <head>, or <body> tags.
            - Do NOT wrap the code in markdown code blocks like \`\`\`html.
            - Ensure the HTML is styled with basic semantic tags to look good in a document.

            INPUT TRANSCRIPT:
            "${transcript}"
        `

        try {
            const result = await geminiService.generateResponse(prompt)
            // Clean up if AI wraps it in markdown code blocks despite instructions
            const cleanHtml = result.replace(/```html|```/g, "").trim()
            setNotes(cleanHtml)

            if (user) {
                logActivity(user.uid, "NOTE_SAVED", {
                    length: transcript.length,
                    topic_preview: transcript.substring(0, 50) + "..."
                })
            }
        } catch (error) {
            console.error("Error generating notes:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6">
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-notes, #printable-notes * {
                        visibility: visible;
                    }
                    #printable-notes {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20px;
                        background: white;
                        color: black;
                    }
                    /* Hide scrollbars and other UI elements */
                    button, .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Speech-to-Notes AI</h1>
                    <p className="text-muted-foreground">Record lectures and let AI organize them into perfect notes.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Panel: Input */}
                <Card className="h-[700px] flex flex-col no-print">
                    <CardHeader>
                        <CardTitle>Recording & Transcript</CardTitle>
                        <CardDescription>Speak, record, or paste a lecture transcript below.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                        <Textarea
                            placeholder="Transcript will appear here... You can also type or paste text manually."
                            className="flex-1 text-lg leading-relaxed resize-none p-4"
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                        />

                        <div className="flex gap-2">
                            <Button
                                variant={isRecording ? "destructive" : "default"}
                                onClick={toggleRecording}
                                className="flex-1 h-12 text-lg"
                            >
                                {isRecording ? (
                                    <>
                                        <MicOff className="mr-2 h-5 w-5 animate-pulse" /> Stop Recording
                                    </>
                                ) : (
                                    <>
                                        <Mic className="mr-2 h-5 w-5" /> Start Recording
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={generateNotes}
                                disabled={!transcript || isProcessing || isRecording}
                                className="flex-1 h-12 text-lg"
                            >
                                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                                Generate Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Panel: Output */}
                <Card className="h-[700px] flex flex-col border-2 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                        <div className="space-y-1">
                            <CardTitle>AI Summarized Report</CardTitle>
                            <CardDescription>Ready for export.</CardDescription>
                        </div>
                        {notes && (
                            <Button variant="default" size="sm" onClick={handlePrint} className="no-print gap-2">
                                <Printer className="h-4 w-4" /> Download Report
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-8 bg-white text-black rounded-b-xl">
                        <div id="printable-notes">
                            {isProcessing ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                                    <p className="text-lg font-medium">Analyzing speech patterns...</p>
                                    <p className="text-sm opacity-70">Structuring academic content...</p>
                                </div>
                            ) : notes ? (
                                <div
                                    className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:pb-2 prose-h2:mt-6 prose-ul:list-disc prose-li:my-1"
                                    dangerouslySetInnerHTML={{ __html: notes }}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed rounded-lg">
                                    <FileText className="h-16 w-16 mb-4" />
                                    <p className="text-xl font-medium">No notes generated yet</p>
                                    <p>Record or paste text to begin</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
