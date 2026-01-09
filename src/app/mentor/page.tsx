"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send, Bot, User } from "lucide-react"
import { geminiService } from "@/lib/gemini"

interface Message {
    role: "user" | "model"
    text: string
}

export default function MentorPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "model", text: "Hello! I'm your AI Mentor. How can I help you with your studies today?" }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
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
        setInput("")
        setLoading(true)

        try {
            // Prepare history for Gemini
            const history = messages.map(m => ({
                role: m.role,
                parts: m.text
            }))

            const chat = await geminiService.startChat(history)
            const result = await chat.sendMessage(input)
            const response = await result.response.text()

            setMessages(prev => [...prev, { role: "model", text: response }])
        } catch (error) {
            console.error("Chat error:", error)
            setMessages(prev => [...prev, { role: "model", text: "I'm having trouble connecting right now. Please try again." }])
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
                        <span className="font-semibold">Mentor Bot</span>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <div className="h-full overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <Avatar className="h-8 w-8">
                                        {msg.role === 'user' ? (
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
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
