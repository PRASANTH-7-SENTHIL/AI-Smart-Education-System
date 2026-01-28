"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Send, Bot, User, GraduationCap } from "lucide-react"
import { geminiService } from "@/lib/gemini"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/context/auth-context"
import { logActivity } from "@/lib/activity-logger"

interface Message {
    role: "user" | "model"
    text: string
}

const SYSTEM_PROMPT_TEMPLATE = `
You are an AI Special Mentor integrated into a Smart Education System.
You answer questions for a student named {{USER_NAME}}.
You answer user questions using adaptive academic depth based on selected mark type.

The user will provide:
1. A question
2. A selected answer mode:
   - Normal
   - 2 Mark
   - 5 Mark
   - 10 Mark
   - 15 Mark

YOUR TASK:
Answer the question according to the selected mode exactly.

ANSWER MODE RULES:

NORMAL MODE:
- Respond like a normal AI chat
- Simple, clear explanation
- Conversational but informative
- use emojis

2 MARK MODE:
- Very short and precise answer
- 2 to 3 key points only
- One short paragraph or bullets
- use emojis
- Exam-oriented definition style

5 MARK MODE:
- Medium-length answer
- Clear explanation with 4–5 points
- Use headings if needed
- use emojis
- Suitable for written exams

10 MARK MODE:
- Long, detailed academic answer
- Use proper structure:
  • Definition / Introduction
  • Explanation
  • Advantages / Features
  • Applications (if applicable)
- Use minimal emojis for clarity (📌, ✅, 🔹)
- Professional and student-friendly

15 MARK MODE:
- Very detailed, full-length answer
- Strict academic structure:
  • Title
  • Introduction
  • Detailed Explanation
  • Diagram description (text only)
  • Advantages
  • Applications
  • Conclusion
- Use emojis to enhance readability (📘, 🔍, ⚙️, 📊, ✅)
- Maintain professional academic tone

GENERAL RULES (ALL MODES):
- Understand the question even if it is informal
- Do not add unrelated information
- Do not mention marks explicitly in the answer
- Keep formatting clean and readable
- Plain text output (PDF-friendly)
- No markdown symbols (*, #, **)

USER SELECTED MODE:
{{ANSWER_MODE}}

FINAL OUTPUT:
Return only the answer, formatted exactly according to the selected mode.
`

export default function MentorPage() {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([
        { role: "model", text: "Hello! I'm your AI Mentor. How can I help you with your studies today?" }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [answerMode, setAnswerMode] = useState("Normal")
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Scroll to bottom on new message
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = { role: "user" as const, text: input }
        setMessages(prev => [...prev, userMsg])

        // Log Activity
        if (user) {
            logActivity(user.uid, "QUESTION_ASKED", {
                mode: answerMode,
                length: input.length
            })
        }

        setInput("")
        setLoading(true)

        try {
            // Prepare history for Gemini
            // Exclude the initial "Hello" message (index 0) as it is not part of the API conversation
            const history = messages.slice(1).map(m => ({
                role: m.role,
                parts: m.text
            }))

            const userName = user?.displayName || user?.email?.split('@')[0] || "Student"
            const systemInstruction = SYSTEM_PROMPT_TEMPLATE
                .replace("{{ANSWER_MODE}}", answerMode)
                .replace("{{USER_NAME}}", userName)

            const chat = await geminiService.startChat(history, systemInstruction)
            const result = await chat.sendMessage(input)
            const response = await result.response.text()

            setMessages(prev => [...prev, { role: "model", text: response }])
        } catch (error: any) {
            console.error("Chat error:", error)
            let errorMessage = "I'm having trouble connecting right now. Please try again."
            if (error.message) {
                errorMessage += ` (Error: ${error.message})`
            }
            setMessages(prev => [...prev, { role: "model", text: errorMessage }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-[calc(100vh-theme(spacing.24))] flex flex-col gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Special Mentor</h1>
                <p className="text-muted-foreground">Your 24/7 academic companion.</p>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="py-3 border-b bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-emerald-500" />
                        <span className="font-semibold">Mentor Bot ({answerMode})</span>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <div className="h-full overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <Avatar className="h-8 w-8">
                                        {msg.role === 'user' ? (
                                            <AvatarFallback className="bg-primary text-primary-foreground"><GraduationCap className="h-4 w-4" /></AvatarFallback>
                                        ) : (
                                            <AvatarFallback className="bg-emerald-500/10 text-emerald-500"><Bot className="h-4 w-4" /></AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className={`p-3 rounded-lg text-sm ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-emerald-500/10 text-emerald-500"><Bot className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted p-3 rounded-lg flex items-center">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="p-3 border-t bg-background">
                    <form onSubmit={handleSend} className="flex gap-2 w-full">
                        <Select value={answerMode} onValueChange={setAnswerMode} disabled={loading}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Normal">Normal</SelectItem>
                                <SelectItem value="2 Mark">2 Mark</SelectItem>
                                <SelectItem value="5 Mark">5 Mark</SelectItem>
                                <SelectItem value="10 Mark">10 Mark</SelectItem>
                                <SelectItem value="15 Mark">15 Mark</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Ask a question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
