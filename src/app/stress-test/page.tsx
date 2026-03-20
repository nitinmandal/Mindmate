"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, CheckCircle2, Loader2, AlertTriangle, Info, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

// Section-based questions following PHQ-9, GAD-7, PSS-15, WHO-5
const sections = [
  {
    id: 1,
    title: "Depression Screening (PHQ-9)",
    description: "These questions assess depression symptoms",
    questions: [
      { id: 1, text: "Little interest or pleasure in doing things" },
      { id: 2, text: "Feeling down, depressed, or hopeless" },
      { id: 3, text: "Trouble falling or staying asleep, or sleeping too much" },
      { id: 4, text: "Feeling tired or having little energy" },
      { id: 5, text: "Poor appetite or overeating" },
      { id: 6, text: "Feeling bad about yourself or that you are a failure" },
      { id: 7, text: "Trouble concentrating on things, such as reading or watching TV" },
      { id: 8, text: "Moving or speaking so slowly that others notice, or being fidgety or restless" },
      { id: 9, text: "Thoughts that you would be better off dead or of hurting yourself" },
    ],
  },
  {
    id: 2,
    title: "Anxiety Screening (GAD-7)",
    description: "These questions assess anxiety symptoms",
    questions: [
      { id: 10, text: "Feeling nervous, anxious, or on edge" },
      { id: 11, text: "Not being able to stop or control worrying" },
      { id: 12, text: "Worrying too much about different things" },
      { id: 13, text: "Trouble relaxing" },
      { id: 14, text: "Being so restless that it's hard to sit still" },
      { id: 15, text: "Becoming easily annoyed or irritable" },
      { id: 16, text: "Feeling afraid as if something awful might happen" },
    ],
  },
  {
    id: 3,
    title: "Perceived Stress Scale (PSS)",
    description: "These questions assess your stress levels",
    questions: [
      { id: 17, text: "Been upset because of something that happened unexpectedly" },
      { id: 18, text: "Felt that you were unable to control important things in your life" },
      { id: 19, text: "Felt nervous and stressed" },
      { id: 20, text: "Felt confident about your ability to handle personal problems", reverse: true },
      { id: 21, text: "Felt that things were going your way", reverse: true },
      { id: 22, text: "Found that you could not cope with all the things you had to do" },
      { id: 23, text: "Been able to control irritations in your life", reverse: true },
      { id: 24, text: "Felt that you were on top of things", reverse: true },
      { id: 25, text: "Been angered because of things outside of your control" },
      { id: 26, text: "Felt difficulties were piling up so high you could not overcome them" },
      { id: 27, text: "Been able to handle your personal problems", reverse: true },
      { id: 28, text: "Felt overwhelmed by responsibilities" },
      { id: 29, text: "Had thoughts racing through your mind making it hard to concentrate" },
      { id: 30, text: "Felt peaceful and calm", reverse: true },
      { id: 31, text: "Felt like everything was an effort" },
    ],
  },
  {
    id: 4,
    title: "Well-being Index (WHO-5)",
    description: "These questions assess your overall well-being",
    questions: [
      { id: 32, text: "I have felt cheerful and in good spirits", reverse: true },
      { id: 33, text: "I have felt calm and relaxed", reverse: true },
      { id: 34, text: "I have felt active and vigorous", reverse: true },
      { id: 35, text: "I woke up feeling fresh and rested", reverse: true },
      { id: 36, text: "My daily life has been filled with things that interest me", reverse: true },
    ],
  },
];

const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);

const responseOptions = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half" },
  { value: 3, label: "Nearly every day" },
];

export default function StressTestPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [result, setResult] = useState<{
    depressionScore: number;
    anxietyScore: number;
    stressScore: number;
    wellbeingScore: number;
    depressionLevel: string;
    anxietyLevel: string;
    stressLevel: string;
    insights: string;
    nextSteps: string[];
  } | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?redirect=/stress-test");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const currentSectionData = sections[currentSection];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / totalQuestions) * 100;

  const isSectionComplete = currentSectionData.questions.every((q) => answers[q.id] !== undefined);
  const isLastSection = currentSection === sections.length - 1;

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNextSection = () => {
    if (!isSectionComplete) {
      toast.error("Please answer all questions in this section");
      return;
    }
    if (!isLastSection) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const calculateResults = () => {
    let depressionScore = 0;
    let anxietyScore = 0;
    let stressScore = 0;
    let wellbeingScore = 0;

    sections.forEach((section) => {
      section.questions.forEach((q) => {
        const answer = answers[q.id] || 0;
        const score = q.reverse ? 3 - answer : answer;

        if (section.id === 1) depressionScore += score;
        else if (section.id === 2) anxietyScore += score;
        else if (section.id === 3) stressScore += score;
        else if (section.id === 4) wellbeingScore += score;
      });
    });

    // Severity levels
    const depressionLevel =
      depressionScore <= 4 ? "No significant" : depressionScore <= 9 ? "Mild" : depressionScore <= 14 ? "Moderate" : "Significant";
    const anxietyLevel =
      anxietyScore <= 4 ? "No significant" : anxietyScore <= 9 ? "Mild" : anxietyScore <= 14 ? "Moderate" : "Significant";
    const stressLevel = stressScore <= 13 ? "Low" : stressScore <= 26 ? "Moderate" : "High";

    // Generate insights
    let insights = "";
    if (depressionLevel === "Significant" || anxietyLevel === "Significant") {
      insights =
        "Your responses indicate significant symptoms that warrant professional attention. We recommend scheduling a consultation with a licensed mental health professional. Remember that seeking help is a sign of strength, and support is available.";
    } else if (depressionLevel === "Moderate" || anxietyLevel === "Moderate" || stressLevel === "High") {
      insights =
        "Your assessment suggests moderate symptoms affecting your daily life. Professional guidance could provide valuable tools and strategies. Consider speaking with a therapist who can offer personalized support and evidence-based interventions.";
    } else if (depressionLevel === "Mild" || anxietyLevel === "Mild" || stressLevel === "Moderate") {
      insights =
        "You're experiencing mild symptoms that many people face. Self-care practices like regular exercise, mindfulness, adequate sleep, and social connection can be helpful. Monitor your symptoms, and don't hesitate to reach out for support if they persist or worsen.";
    } else {
      insights =
        "Your responses suggest good overall mental health! Continue maintaining healthy lifestyle habits, strong social connections, and self-care practices. Regular check-ins with yourself help maintain this positive state.";
    }

    const nextSteps = [
      "Continue daily mood tracking to identify patterns and triggers",
      "Chat with Lyra AI for personalized coping strategies",
      "Join our community for peer support and shared experiences",
      depressionLevel === "Significant" || anxietyLevel === "Significant"
        ? "Consider professional help - early intervention is important"
        : "Explore mindfulness and stress reduction resources",
    ];

    return {
      depressionScore,
      anxietyScore,
      stressScore,
      wellbeingScore,
      depressionLevel,
      anxietyLevel,
      stressLevel,
      insights,
      nextSteps,
    };
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const results = calculateResults();
      const token = localStorage.getItem("bearer_token");

      // Save to database
      await fetch("/api/stress-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          score: results.depressionScore + results.anxietyScore + results.stressScore,
          stressLevel: results.stressLevel.toLowerCase(),
          recommendations: results.insights,
          testDate: new Date().toISOString(),
        }),
      });

      // Update user preferences
      await fetch("/api/user-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hasCompletedOnboarding: true,
          currentStressLevel: results.stressLevel.toLowerCase(),
          lastStressTestDate: new Date().toISOString(),
        }),
      });

      setResult(results);
      toast.success("Assessment completed!");
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast.error("Failed to save results. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Introduction screen
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-[#faf5ff] to-[#e0f2fe] px-4 py-12 dark:from-[#0c1f17] dark:via-[#1f1629] dark:to-[#0a1929]">
        <div className="mx-auto max-w-2xl">
          <Card className="rounded-3xl p-8 shadow-xl">
            <div className="mb-6 text-center">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#a7f3d0] via-[#ddd6fe] to-[#bae6fd]">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h1 className="mb-3 text-3xl font-bold">Mental Health Assessment</h1>
              <p className="text-lg text-muted-foreground">
                This comprehensive assessment combines validated psychological scales to help you understand your mental health.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">It takes about 5-10 minutes.</p>
            </div>

            <div className="mb-8 space-y-4 rounded-2xl bg-muted/30 p-6">
              <h3 className="font-semibold">This assessment includes:</h3>
              <div className="space-y-3">
                {sections.map((section) => (
                  <div key={section.id} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#a7f3d0]" />
                    <div>
                      <p className="font-medium">{section.title}</p>
                      <p className="text-sm text-muted-foreground">{section.questions.length} questions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• Your responses are confidential and stored securely</p>
              <p>• Answer honestly for the most accurate results</p>
              <p>• Think about the past 2 weeks when answering</p>
              <p>• This is not a diagnostic tool - consult a professional for diagnosis</p>
            </div>

            <Button
              onClick={() => setShowIntro(false)}
              size="lg"
              className="mt-8 w-full rounded-full bg-gradient-to-r from-[#a7f3d0] via-[#ddd6fe] to-[#bae6fd] text-lg font-semibold text-gray-900 hover:opacity-90"
            >
              Start Assessment
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Results screen
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-[#faf5ff] to-[#e0f2fe] px-4 py-12 dark:from-[#0c1f17] dark:via-[#1f1629] dark:to-[#0a1929]">
        <div className="mx-auto max-w-4xl">
          <Card className="rounded-3xl p-8 shadow-xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#a7f3d0] to-[#bae6fd]">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="mb-2 text-3xl font-bold">Your Assessment Results</h1>
              <p className="text-sm text-muted-foreground">
                Completed on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>

            {/* Score Cards - 2 column grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <Card className="rounded-2xl bg-gradient-to-br from-[#a7f3d0]/20 to-[#a7f3d0]/5 p-6">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Depression Score</h3>
                <div className="mb-2 text-4xl font-bold" style={{ color: "#10b981" }}>
                  {result.depressionScore}
                  <span className="text-xl text-muted-foreground">/27</span>
                </div>
                <div className="inline-flex rounded-full bg-white/60 px-3 py-1 text-sm font-medium dark:bg-black/20">
                  {result.depressionLevel}
                </div>
              </Card>

              <Card className="rounded-2xl bg-gradient-to-br from-[#ddd6fe]/20 to-[#ddd6fe]/5 p-6">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Anxiety Score</h3>
                <div className="mb-2 text-4xl font-bold" style={{ color: "#a78bfa" }}>
                  {result.anxietyScore}
                  <span className="text-xl text-muted-foreground">/21</span>
                </div>
                <div className="inline-flex rounded-full bg-white/60 px-3 py-1 text-sm font-medium dark:bg-black/20">
                  {result.anxietyLevel}
                </div>
              </Card>
            </div>

            {/* Insights Section */}
            <Card className="mb-6 rounded-2xl bg-gradient-to-br from-[#bae6fd]/20 to-[#bae6fd]/5 p-6">
              <h3 className="mb-3 text-lg font-bold">Clinical Insights</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{result.insights}</p>
            </Card>

            {/* Next Steps Section */}
            <div className="mb-8 rounded-2xl bg-muted/30 p-6">
              <h3 className="mb-4 text-lg font-bold">Recommended Next Steps</h3>
              <div className="space-y-3">
                {result.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a7f3d0] to-[#bae6fd] text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => router.push("/")} variant="outline" className="flex-1 rounded-full" size="lg">
                Back to Dashboard
              </Button>
              <Button
                onClick={() => router.push("/chat")}
                className="flex-1 rounded-full bg-gradient-to-r from-[#a7f3d0] via-[#ddd6fe] to-[#bae6fd] text-gray-900 hover:opacity-90"
                size="lg"
              >
                Chat with Lyra
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Assessment form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-[#faf5ff] to-[#e0f2fe] px-4 py-12 dark:from-[#0c1f17] dark:via-[#1f1629] dark:to-[#0a1929]">
      <div className="mx-auto max-w-3xl">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">{currentSectionData.title}</span>
            <span className="text-muted-foreground">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/50 dark:bg-black/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#a7f3d0] via-[#ddd6fe] to-[#bae6fd] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <Card className="rounded-3xl p-6 shadow-xl sm:p-8">
          <div className="mb-6">
            <p className="mb-1 text-sm font-medium text-muted-foreground">{currentSectionData.description}</p>
            <p className="text-xs text-muted-foreground">
              Section {currentSection + 1} of {sections.length}
            </p>
          </div>

          {/* Question Cards */}
          <div className="space-y-6">
            {currentSectionData.questions.map((question, qIndex) => (
              <Card key={question.id} className="rounded-2xl border-2 p-4">
                <p className="mb-4 font-bold">
                  {qIndex + 1}. Over the last 2 weeks: {question.text}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {responseOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(question.id, option.value)}
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all hover:border-[#a7f3d0] hover:bg-[#a7f3d0]/10 ${
                        answers[question.id] === option.value
                          ? "border-[#a7f3d0] bg-[#a7f3d0] text-gray-900"
                          : "border-border bg-background"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <Button
              onClick={handlePreviousSection}
              disabled={currentSection === 0}
              variant="outline"
              className="rounded-full"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {isLastSection ? (
              <Button
                onClick={handleSubmit}
                disabled={!isSectionComplete || isSubmitting}
                className="rounded-full bg-gradient-to-r from-[#a7f3d0] via-[#ddd6fe] to-[#bae6fd] text-gray-900 hover:opacity-90"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Get Results"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNextSection}
                disabled={!isSectionComplete}
                className="rounded-full bg-gradient-to-r from-[#a7f3d0] via-[#ddd6fe] to-[#bae6fd] text-gray-900 hover:opacity-90"
                size="lg"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}