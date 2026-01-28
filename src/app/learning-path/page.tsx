"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Route, BookOpen, Briefcase, Download } from "lucide-react"
import { geminiService } from "@/lib/gemini"
import { useAuth } from "@/context/auth-context"
import { logActivity } from "@/lib/activity-logger"

export default function LearningPathPage() {
    const { user } = useAuth()
    const [goal, setGoal] = useState("")
    const [background, setBackground] = useState("")
    const [loading, setLoading] = useState(false)
    const [plan, setPlan] = useState<any | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleDownload = () => {
        const roadmapUrl = "https://github.com/miztiik/AI-Learning-Path/raw/master/Roadmap.pdf"
        const link = document.createElement("a")
        link.href = roadmapUrl
        link.download = "Beginner_to_Advanced_Full_AI_Roadmap.pdf"
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const generatePlan = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setPlan(null)
        setError(null)

        const prompt = `
      You are an AI learning-path architect for a Smart Education platform.
      Your task is to generate a personalized career learning roadmap in a structured JSON format.

      User Inputs:
      Career Goal: ${goal}
      Current Knowledge Level: ${background}

      Instructions:
      Analyze the selected career goal.
      Consider the user’s current knowledge level and skip or fast-track basic topics if applicable.
      Generate a step-by-step learning journey from the user’s current level to job-ready level.
      Each step must be ordered sequentially and logically.
      The output must be machine-readable JSON only (no explanations, no markdown).

      Output Format (STRICT):
      {
        "career": "${goal}",
        "current_level": "string",
        "journey": [
          {
            "step": 1,
            "title": "string",
            "description": "string",
            "level": "beginner | intermediate | advanced",
            "milestone": true
          }
        ]
      }
    `

        try {
            const result = await geminiService.generateResponse(prompt)
            // More robust JSON extraction
            let cleanResult = result
            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                cleanResult = jsonMatch[0]
            }

            try {
                const parsed = JSON.parse(cleanResult)
                setPlan(parsed)

                // Log Activity
                if (user) {
                    logActivity(user.uid, "PATH_GENERATED", {
                        career: goal,
                        steps: parsed.journey?.length || 0
                    })
                }
            } catch (e) {
                console.error("Failed to parse JSON", e)
                setError("AI was unable to generate a valid roadmap. Please try again with more details.")
            }
        } catch (error: any) {
            console.error("Error generating plan:", error)
            setError(error.message || "Something went wrong while connecting to the AI. Please check your connection.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Learning Path Recommender</h1>
                <p className="text-muted-foreground">Get a personalized roadmap to reach your career goals.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Your Profile</CardTitle>
                        <CardDescription>Tell us about yourself.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={generatePlan} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="goal">Dream Job / Goal</Label>
                                <Input
                                    id="goal"
                                    placeholder="e.g. Full Stack Developer"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="background">Current Skills / Background</Label>
                                <Textarea
                                    id="background"
                                    placeholder="e.g. Know basics of Python, want to learn React..."
                                    value={background}
                                    onChange={(e) => setBackground(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Route className="mr-2 h-4 w-4" />}
                                Generate Path
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div className="space-y-1">
                            <CardTitle>Your Personalized Roadmap</CardTitle>
                            <CardDescription>
                                {plan ? `Path to ${plan.career}` : "Your plan will appear here after generation."}
                            </CardDescription>
                        </div>
                        {plan && (
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <Download className="h-4 w-4 mr-2" />
                                Download Full AI Roadmap (PDF)
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                                <p>Analyzing market trends and curriculum...</p>
                            </div>
                        ) : plan && plan.journey ? (
                            <div className="space-y-8">
                                <div className="relative">
                                    <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-border md:left-1/2 md:-ml-0.5" />
                                    <div className="space-y-8">
                                        {plan.journey.map((step: any, index: number) => (
                                            <div key={index} className="relative flex flex-col md:flex-row items-center group">
                                                {/* Line Connector logic if needed or just letting the absolute bar do it */}

                                                {/* Left side (Desktop) */}
                                                <div className={`flex w-full md:w-1/2 justify-start md:justify-end md:pr-8 pl-16 md:pl-0 ${index % 2 === 0 ? 'md:text-right' : 'md:text-right md:hidden'}`}>
                                                    {index % 2 === 0 && (
                                                        <div className="p-4 bg-card border rounded-lg hover:shadow-lg transition-all w-full md:w-auto">
                                                            <div className="flex items-center gap-2 justify-start md:justify-end mb-1">
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${step.level === 'beginner' ? 'bg-green-500/10 text-green-500' :
                                                                    step.level === 'intermediate' ? 'bg-blue-500/10 text-blue-500' :
                                                                        'bg-purple-500/10 text-purple-500'
                                                                    }`}>
                                                                    {step.level}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-bold text-lg">{step.title}</h4>
                                                            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Center Dot */}
                                                <div className="absolute left-6 md:left-1/2 -ml-3 md:-ml-3 w-6 h-6 rounded-full border-4 border-background bg-primary z-10 shadow-sm group-hover:scale-125 transition-transform" />

                                                {/* Right side (Desktop) */}
                                                <div className={`flex w-full md:w-1/2 justify-start md:pl-8 pl-16 ${index % 2 !== 0 ? '' : 'md:hidden'}`}>
                                                    {(index % 2 !== 0 || true) && (
                                                        <div className={`p-4 bg-card border rounded-lg hover:shadow-lg transition-all w-full md:w-auto ${index % 2 === 0 ? 'md:hidden' : ''}`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${step.level === 'beginner' ? 'bg-green-500/10 text-green-500' :
                                                                    step.level === 'intermediate' ? 'bg-blue-500/10 text-blue-500' :
                                                                        'bg-purple-500/10 text-purple-500'
                                                                    }`}>
                                                                    {step.level}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-bold text-lg">{step.title}</h4>
                                                            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12 text-destructive text-center space-y-3">
                                <Route className="h-12 w-12 opacity-50" />
                                <p className="font-medium">{error}</p>
                                <Button variant="outline" size="sm" onClick={generatePlan}>Try Again</Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                <Briefcase className="h-12 w-12 mb-2 opacity-50" />
                                <p>Enter your details to generate a plan</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
