"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import {
    User,
    Settings,
    UserCircle,
    Lock,
    LogOut,
    BookOpen,
    Zap,
    Bell,
    FileText,
    ShieldCheck,
    Palette,
    Moon,
    Sun,
    Trash2,
    Save,
    Camera,
    Languages,
    Database,
    ChevronRight,
    CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
    const { user, logout } = useAuth()
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Mock settings state (in a real app, these would come from Firestore)
    const [settings, setSettings] = useState({
        learningMode: "Video",
        difficulty: "Medium",
        dailyGoal: "2 hours",
        aiEnabled: true,
        examType: "JEE",
        adaptiveLearning: true,
        notifications: {
            classReminders: true,
            examAlerts: true,
            assignments: true,
            email: true,
            app: true
        },
        speechToNotes: true,
        notesLanguage: "English",
        downloadFormat: "PDF",
        darkMode: true,
        language: "English"
    })

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                try {
                    const docRef = doc(db, "users", user.uid)
                    const docSnap = await getDoc(docRef)
                    if (docSnap.exists()) {
                        setProfile(docSnap.data())
                    } else {
                        // Fallback to auth data if no Firestore doc
                        setProfile({
                            fullName: user.displayName || "User",
                            email: user.email,
                            role: "Student",
                            phone: user.phoneNumber || "Not provided",
                            photoURL: user.photoURL
                        })
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error)
                } finally {
                    setLoading(false)
                }
            }
        }
        fetchProfile()
    }, [user])

    const handleToggle = (section: string, key?: string) => {
        if (key) {
            setSettings(prev => ({
                ...prev,
                [section]: {
                    ...prev[section as keyof typeof settings] as any,
                    [key]: !(prev[section as keyof typeof settings] as any)[key]
                }
            }))
        } else {
            setSettings(prev => ({
                ...prev,
                [section]: !prev[section as keyof typeof settings]
            }))
        }
    }

    const handleSave = async () => {
        setSaving(true)
        // Simulate save
        setTimeout(() => {
            setSaving(false)
        }, 1000)
    }

    if (loading) {
        return <div className="flex h-full items-center justify-center">Loading settings...</div>
    }

    return (
        <div className="container mx-auto max-w-5xl py-8 px-4">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your account preferences and learning experience.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <Database className="mr-2 h-4 w-4" />
                        Clear Cache
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                {/* 1. Profile Header */}
                <Card className="overflow-hidden border-none bg-gradient-to-r from-primary/10 via-background to-background ring-1 ring-border">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center gap-6 md:flex-row">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                                    <AvatarImage src={profile?.photoURL || undefined} />
                                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                                        {profile?.fullName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <button className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg hover:bg-primary/90 transition-all transform group-hover:scale-110">
                                    <Camera className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-col items-center gap-2 md:flex-row md:items-baseline">
                                    <h2 className="text-2xl font-bold">{profile?.fullName}</h2>
                                    <Badge variant="secondary" className="bg-primary/20 text-primary font-semibold">
                                        {profile?.role}
                                    </Badge>
                                </div>
                                <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-muted-foreground md:grid-cols-2">
                                    <div className="flex items-center justify-center gap-2 md:justify-start">
                                        <Bell className="h-3 w-3" /> {profile?.email}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 md:justify-start">
                                        <ShieldCheck className="h-3 w-3" /> {profile?.phone}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">Edit Profile</Button>
                                <Button variant="destructive" size="sm" onClick={logout}>
                                    <LogOut className="mr-2 h-4 w-4" /> Logout
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* 2. Account Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCircle className="h-5 w-5 text-blue-500" /> Account Settings
                            </CardTitle>
                            <CardDescription>Manage your profile and security credentials.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input defaultValue={profile?.fullName} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input defaultValue={profile?.email} disabled />
                            </div>
                            <Button variant="outline" className="w-full justify-start">
                                <Lock className="mr-2 h-4 w-4" /> Change Password
                                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 3. Learning Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-purple-500" /> Learning Preferences
                            </CardTitle>
                            <CardDescription>Tailor your learning experience.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Difficulty</Label>
                                    <Select
                                        defaultValue={settings.difficulty}
                                        onValueChange={(v) => setSettings(p => ({ ...p, difficulty: v }))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Easy">Easy</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Learning Mode</Label>
                                    <Select
                                        defaultValue={settings.learningMode}
                                        onValueChange={(v) => setSettings(p => ({ ...p, learningMode: v }))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Video">Video</SelectItem>
                                            <SelectItem value="Notes">Notes</SelectItem>
                                            <SelectItem value="Practice">Practice</SelectItem>
                                            <SelectItem value="AI Mentor">AI Mentor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Daily Study Goal</Label>
                                <Input defaultValue={settings.dailyGoal} placeholder="e.g. 2 hours" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. AI & Exam Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-amber-500" /> AI & Exam Settings
                            </CardTitle>
                            <CardDescription>Configure AI capabilities and exam prep.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>AI Recommendations</Label>
                                    <p className="text-xs text-muted-foreground">Personalized content based on performance.</p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.aiEnabled}
                                    onChange={() => handleToggle('aiEnabled')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Exam Type</Label>
                                <Select
                                    defaultValue={settings.examType}
                                    onValueChange={(v) => setSettings(p => ({ ...p, examType: v }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="JEE">JEE Mains/Advanced</SelectItem>
                                        <SelectItem value="NEET">NEET</SelectItem>
                                        <SelectItem value="IIT">IIT Foundations</SelectItem>
                                        <SelectItem value="Custom">Custom Exam</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Adaptive Learning</Label>
                                    <p className="text-xs text-muted-foreground">Adjust difficulty automatically.</p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.adaptiveLearning}
                                    onChange={() => handleToggle('adaptiveLearning')}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 5. Notifications */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-rose-500" /> Notifications
                            </CardTitle>
                            <CardDescription>Control how you receive updates.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Class Reminders</Label>
                                <ToggleSwitch
                                    checked={settings.notifications.classReminders}
                                    onChange={() => handleToggle('notifications', 'classReminders')}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Exam Alerts</Label>
                                <ToggleSwitch
                                    checked={settings.notifications.examAlerts}
                                    onChange={() => handleToggle('notifications', 'examAlerts')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                <div className="flex items-center gap-2">
                                    <ToggleSwitch
                                        checked={settings.notifications.email}
                                        onChange={() => handleToggle('notifications', 'email')}
                                        size="sm"
                                    />
                                    <span className="text-xs">Email Alerts</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ToggleSwitch
                                        checked={settings.notifications.app}
                                        onChange={() => handleToggle('notifications', 'app')}
                                        size="sm"
                                    />
                                    <span className="text-xs">App Notifications</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 6. Notes & Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-emerald-500" /> Notes & Content
                            </CardTitle>
                            <CardDescription>Preferences for your study materials.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Speech-to-Notes</Label>
                                    <p className="text-xs text-muted-foreground">Auto-generate notes from audio.</p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.speechToNotes}
                                    onChange={() => handleToggle('speechToNotes')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Download Format</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={settings.downloadFormat === 'PDF' ? 'default' : 'outline'}
                                        onClick={() => setSettings(p => ({ ...p, downloadFormat: 'PDF' }))}
                                        className="flex-1"
                                    >PDF</Button>
                                    <Button
                                        variant={settings.downloadFormat === 'DOC' ? 'default' : 'outline'}
                                        onClick={() => setSettings(p => ({ ...p, downloadFormat: 'DOC' }))}
                                        className="flex-1"
                                    >DOC</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 7. Privacy & Security */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-cyan-500" /> Privacy & Security
                            </CardTitle>
                            <CardDescription>Manage your data and permissions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" className="w-full justify-between">
                                Camera & Microphone Permissions
                                <Badge variant="outline">Enabled</Badge>
                            </Button>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Activity Tracking</Label>
                                    <p className="text-xs text-muted-foreground">Allow us to track progress for better insights.</p>
                                </div>
                                <ToggleSwitch checked={true} onChange={() => { }} />
                            </div>
                            <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 8. App Preferences */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5 text-orange-500" /> App Preferences
                            </CardTitle>
                            <CardDescription>Customize your application look and feel.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Appearance</Label>
                                <div className="flex gap-2 p-1 bg-accent rounded-lg">
                                    <Button
                                        variant={settings.darkMode ? 'ghost' : 'default'}
                                        size="sm"
                                        className="flex-1 h-8"
                                        onClick={() => setSettings(p => ({ ...p, darkMode: false }))}
                                    >
                                        <Sun className="mr-2 h-3 w-3" /> Light
                                    </Button>
                                    <Button
                                        variant={settings.darkMode ? 'default' : 'ghost'}
                                        size="sm"
                                        className="flex-1 h-8"
                                        onClick={() => setSettings(p => ({ ...p, darkMode: true }))}
                                    >
                                        <Moon className="mr-2 h-3 w-3" /> Dark
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Display Language</Label>
                                <Select defaultValue={settings.language}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="Hindi">Hindi</SelectItem>
                                        <SelectItem value="Tamil">Tamil</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button variant="outline" className="w-full">
                                    Reset All Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function ToggleSwitch({ checked, onChange, size = "md" }: { checked: boolean, onChange: () => void, size?: "sm" | "md" }) {
    const sizeClasses = size === "sm" ? "h-4 w-8" : "h-6 w-11"
    const thumbClasses = size === "sm" ? "h-3 w-3" : "h-5 w-5"
    const translateClasses = checked ? (size === "sm" ? "translate-x-4" : "translate-x-5") : "translate-x-0"

    return (
        <button
            type="button"
            className={`${sizeClasses} relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${checked ? 'bg-primary' : 'bg-input'}`}
            onClick={onChange}
        >
            <span
                className={`${thumbClasses} inline-block transform rounded-full bg-white transition-transform ${translateClasses}`}
            />
        </button>
    )
}
