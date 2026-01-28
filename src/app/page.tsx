import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrainCircuit, FileAudio, GraduationCap, UserCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const modules = [
    {
      title: "Exam Configuration",
      description: "Secure, AI-monitored environment with real-time behavioral analysis.",
      icon: UserCheck,
      href: "/exam/config",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      stats: "Setup Ready",
    },
    {
      title: "Learning Path",
      description: "Personalized roadmaps and career guides with AI PDF downloads.",
      icon: GraduationCap,
      href: "/learning-path",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      stats: "3 Paths Generated",
    },
    {
      title: "Speech to Notes",
      description: "Convert lectures and audio into structured, concise notes automatically.",
      icon: FileAudio,
      href: "/speech-notes",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      stats: "12 Notes Saved",
    },
    {
      title: "AI Mentor",
      description: "Get personalized guidance and answers to your academic questions.",
      icon: BrainCircuit,
      href: "/mentor",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      stats: "24/7 Available",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, Student</h1>
        <p className="text-muted-foreground">
          Track your progress and access your AI learning tools.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.title} className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {module.title}
                </CardTitle>
                <div className={`${module.bg} p-2 rounded-full`}>
                  <Icon className={`h-4 w-4 ${module.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{module.stats}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {module.description}
                </p>
                <div className="mt-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <Link href={module.href}>
                    <Button variant="outline" className="w-full justify-between hover:bg-primary hover:text-primary-foreground">
                      Access Tool
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest exams and learning milestones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">Exam Configuration</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                  <div className="ml-auto font-medium text-emerald-500">+150 XP</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Smart recommendations for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-500 mb-2">
                <BrainCircuit className="h-4 w-4" />
                <span className="text-sm font-medium">Focus Area</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your performance in Physics has dropped by 5%. Consider reviewing <strong>Kinematics</strong> this week.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
