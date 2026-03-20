"use client";

import { useEffect, useState } from "react";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, MessageCircle, Users, Calendar, Shield, Sparkles, Star, Loader2, Brain, TrendingUp } from "lucide-react"
import BottomNav from "@/components/BottomNav"
import AuthHeader from "@/components/AuthHeader"
import { useSession } from "@/lib/auth-client";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { MoodTracker } from "@/components/MoodTracker";
import { JournalSection } from "@/components/JournalSection";
import { MoodChart } from "@/components/MoodChart";
import { UpcomingAppointments } from "@/components/UpcomingAppointments";
import { ResourcesSection } from "@/components/ResourcesSection";

const motivationalQuotes = [
  "Every day is a fresh start. You've got this! 💪",
  "Your mental health is a priority, not a luxury. 🌸",
  "Small steps forward are still progress. 🌱",
  "Be kind to yourself. You're doing better than you think. ✨",
  "It's okay to take a break and breathe. 🌊",
  "You are stronger than your struggles. 💜",
];

export default function Home() {
  const { data: session, isPending } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [dailyQuote] = useState(() => 
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!session?.user) {
        setIsLoadingPrefs(false);
        return;
      }

      try {
        const token = localStorage.getItem("bearer_token");
        const response = await fetch("/api/user-preferences", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
          
          // Show onboarding if user hasn't completed it
          if (!data.hasCompletedOnboarding) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setIsLoadingPrefs(false);
      }
    };

    if (!isPending) {
      fetchPreferences();
    }
  }, [session, isPending]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getStressLevelMessage = () => {
    if (!preferences?.currentStressLevel) return "Take our stress test to get personalized insights.";
    
    const level = preferences.currentStressLevel;
    if (level === "low") return "You're managing stress well! Keep up the great work. 🌟";
    if (level === "moderate") return "Your stress levels are moderate. Remember to take care of yourself. 💙";
    return "Your stress levels are high. We're here to support you. Consider talking to a therapist. 💜";
  };

  return (
    <>
      <div className="min-h-screen pb-24">
        {/* Top Header with Auth */}
        <header className="sticky top-0 z-50 border-b bg-muted/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-bold">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                MindMate
              </span>
            </Link>
            <AuthHeader />
          </div>
        </header>

        {/* Personalized Welcome Section - Only show if logged in */}
        {session?.user && (
          <section className="bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 px-4 py-12 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
            <div className="mx-auto max-w-6xl">
              {isLoadingPrefs ? (
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="mb-8 text-center">
                    <h1 className="mb-2 text-3xl font-bold md:text-4xl">
                      {getGreeting()}, {session.user.name || "friend"}! 👋
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      {getStressLevelMessage()}
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Mood Tracker */}
                    <MoodTracker />

                    {/* Daily Insight Card */}
                    <Card className="rounded-3xl p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold">Daily Inspiration</h3>
                      </div>
                      <p className="mb-6 text-muted-foreground">{dailyQuote}</p>
                      
                      {!preferences?.currentStressLevel && (
                        <Link href="/stress-test">
                          <Button className="w-full rounded-full" variant="outline">
                            <Brain className="mr-2 h-4 w-4" />
                            Take Stress Test
                          </Button>
                        </Link>
                      )}
                      
                      {preferences?.currentStressLevel && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          Last test: {new Date(preferences.lastStressTestDate).toLocaleDateString()}
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-8">
                    <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Link href="/chat">
                        <Card className="cursor-pointer rounded-2xl p-6 transition-all hover:shadow-lg">
                          <MessageCircle className="mb-3 h-8 w-8 text-purple-600" />
                          <h3 className="mb-1 font-semibold">Talk to MindMate</h3>
                          <p className="text-sm text-muted-foreground">
                            Chat with our AI companion
                          </p>
                        </Card>
                      </Link>
                      <Link href="/appointments">
                        <Card className="cursor-pointer rounded-2xl p-6 transition-all hover:shadow-lg">
                          <Calendar className="mb-3 h-8 w-8 text-blue-600" />
                          <h3 className="mb-1 font-semibold">Book a Session</h3>
                          <p className="text-sm text-muted-foreground">
                            Connect with a therapist
                          </p>
                        </Card>
                      </Link>
                      <Link href="/community">
                        <Card className="cursor-pointer rounded-2xl p-6 transition-all hover:shadow-lg">
                          <Users className="mb-3 h-8 w-8 text-pink-600" />
                          <h3 className="mb-1 font-semibold">Visit Community</h3>
                          <p className="text-sm text-muted-foreground">
                            Share and connect
                          </p>
                        </Card>
                      </Link>
                    </div>
                  </div>

                  {/* Dashboard Sections */}
                  <div className="mt-8 space-y-6">
                    {/* Journal & Appointments Row */}
                    <div className="grid gap-6 lg:grid-cols-2">
                      <JournalSection />
                      <UpcomingAppointments />
                    </div>

                    {/* Mood Chart */}
                    <MoodChart />

                    {/* Resources Section */}
                    <ResourcesSection />
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Hero Section - Show if not logged in */}
        {!session?.user && !isPending && (
          <section className="relative overflow-hidden bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 px-4 py-20 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
            <div className="mx-auto max-w-6xl">
              <div className="text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 backdrop-blur-sm dark:bg-black/60">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Your Mental Wellness Journey Starts Here
                  </span>
                </div>
                <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                    MindMate
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
                  Your compassionate digital companion for emotional support, meaningful connections, and professional mental health care.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Link href="/register">
                    <Button size="lg" className="w-full rounded-full px-8 sm:w-auto">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="w-full rounded-full px-8 sm:w-auto">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold">How MindMate Helps You</h2>
              <p className="text-lg text-muted-foreground">
                Comprehensive mental wellness support, all in one place
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-3xl border-2 p-6 transition-all hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900">
                  <MessageCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">AI Companion</h3>
                <p className="text-muted-foreground">
                  Chat with our empathetic AI for instant emotional support, anytime you need it.
                </p>
              </Card>
              <Card className="rounded-3xl border-2 p-6 transition-all hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 dark:bg-pink-900">
                  <Users className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Community</h3>
                <p className="text-muted-foreground">
                  Connect with others who understand. Share experiences in a safe, supportive space.
                </p>
              </Card>
              <Card className="rounded-3xl border-2 p-6 transition-all hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Appointments</h3>
                <p className="text-muted-foreground">
                  Book sessions with licensed therapists who care about your wellbeing.
                </p>
              </Card>
              <Card className="rounded-3xl border-2 p-6 transition-all hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Privacy First</h3>
                <p className="text-muted-foreground">
                  Your conversations are confidential. We prioritize your privacy and security.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-muted/50 px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold">What Our Users Say</h2>
              <p className="text-lg text-muted-foreground">
                Real stories from real people finding support
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="rounded-3xl p-6">
                <div className="mb-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 text-muted-foreground">
                  "MindMate has been a lifesaver during my anxiety struggles. Having someone to talk to 24/7 makes all the difference."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                  <div>
                    <p className="font-semibold">Sarah M.</p>
                    <p className="text-sm text-muted-foreground">College Student</p>
                  </div>
                </div>
              </Card>
              <Card className="rounded-3xl p-6">
                <div className="mb-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 text-muted-foreground">
                  "The community feature helped me realize I'm not alone. Connecting with others who get it has been incredibly healing."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400" />
                  <div>
                    <p className="font-semibold">James T.</p>
                    <p className="text-sm text-muted-foreground">Software Developer</p>
                  </div>
                </div>
              </Card>
              <Card className="rounded-3xl p-6">
                <div className="mb-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 text-muted-foreground">
                  "Finding a therapist through MindMate was so easy. The booking system is seamless and the therapists are wonderful."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400" />
                  <div>
                    <p className="font-semibold">Emily R.</p>
                    <p className="text-sm text-muted-foreground">Teacher</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-12">
              <Heart className="mx-auto mb-6 h-16 w-16 text-white" />
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Ready to Start Your Wellness Journey?
              </h2>
              <p className="mb-8 text-lg text-white/90">
                Join thousands who have found support, connection, and healing through MindMate.
              </p>
              {session?.user ? (
                <Link href="/chat">
                  <Button size="lg" variant="secondary" className="rounded-full px-8">
                    Start Chatting
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="rounded-full px-8">
                    Get Started Free
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <h3 className="mb-4 text-xl font-bold">MindMate</h3>
                <p className="text-sm text-muted-foreground">
                  Your digital companion for mental wellness and emotional support.
                </p>
              </div>
              <div>
                <h4 className="mb-4 font-semibold">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/chat" className="hover:text-foreground">AI Chat</Link></li>
                  <li><Link href="/community" className="hover:text-foreground">Community</Link></li>
                  <li><Link href="/appointments" className="hover:text-foreground">Find Therapist</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                  <li><a href="#" className="hover:text-foreground">Crisis Hotline</a></li>
                  <li><a href="#" className="hover:text-foreground">Contact Us</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-foreground">HIPAA Compliance</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
              <p>© 2024 MindMate. All rights reserved. Not a substitute for professional medical advice.</p>
            </div>
          </div>
        </footer>
      </div>
      <BottomNav />
      
      {/* Onboarding Dialog */}
      {session?.user && (
        <OnboardingDialog 
          open={showOnboarding} 
          onOpenChange={setShowOnboarding}
        />
      )}
    </>
  )
}