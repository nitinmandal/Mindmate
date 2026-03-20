"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Sparkles, Loader2, Brain, RefreshCw } from "lucide-react"
import BottomNav from "@/components/BottomNav"
import { useSession } from "@/lib/auth-client"
import { toast } from "sonner"

type Message = {
  id: number
  message: string
  sender: "user" | "ai"
  createdAt: string
}

export default function ChatPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [stressLevel, setStressLevel] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/chat")
    }
  }, [session, isPending, router])

  // Load chat history and user preferences
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user) return

      try {
        const token = localStorage.getItem("bearer_token")
        
        // Load user preferences for stress level context
        const prefsResponse = await fetch("/api/user-preferences", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (prefsResponse.ok) {
          const prefs = await prefsResponse.json()
          setStressLevel(prefs.currentStressLevel)
        }

        // Load chat history
        const historyResponse = await fetch("/api/chat-messages", {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (historyResponse.ok) {
          const history = await historyResponse.json()
          if (history.length === 0) {
            // Add welcome message if no history
            const welcomeMsg = {
              id: 0,
              message: "Hello! I'm Lyra, your compassionate AI companion. I'm here to listen and support you. How are you feeling today?",
              sender: "ai" as const,
              createdAt: new Date().toISOString(),
            }
            setMessages([welcomeMsg])
          } else {
            setMessages(history)
          }
        }
      } catch (error) {
        console.error("Error loading chat data:", error)
        toast.error("Failed to load chat history")
      } finally {
        setIsLoadingHistory(false)
      }
    }

    if (!isPending) {
      loadData()
    }
  }, [session, isPending])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const saveMessage = async (message: string, sender: "user" | "ai") => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/chat-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, sender }),
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error("Error saving message:", error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessageText = input.trim()
    setInput("")
    setIsTyping(true)

    // Save and display user message
    const savedUserMsg = await saveMessage(userMessageText, "user")
    if (savedUserMsg) {
      setMessages((prev) => [...prev, savedUserMsg])
    }

    try {
      // Prepare chat history for context
      const chatHistory = messages.slice(-6).map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.message,
      }))

      // Get AI response
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/chat-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessageText,
          chatHistory,
          stressLevel,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()
      const aiResponse = data.response

      // Save and display AI response
      const savedAiMsg = await saveMessage(aiResponse, "ai")
      if (savedAiMsg) {
        setMessages((prev) => [...prev, savedAiMsg])
      }

      if (data.fallback) {
        toast.info("Using fallback response. OpenAI API may not be configured.")
      }
    } catch (error) {
      console.error("Error getting AI response:", error)
      toast.error("Failed to get response. Please try again.")
      
      // Add fallback message
      const fallbackMsg = await saveMessage(
        "I'm having trouble responding right now. Please try again or consider talking to one of our professional therapists.",
        "ai"
      )
      if (fallbackMsg) {
        setMessages((prev) => [...prev, fallbackMsg])
      }
    } finally {
      setIsTyping(false)
    }
  }

  const handleRetakeStressTest = () => {
    router.push("/stress-test")
  }

  if (isPending || isLoadingHistory) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <>
      <div className="flex min-h-screen flex-col pb-24">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl dark:bg-black/80">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">Lyra - MindMate AI</h1>
                <p className="text-xs text-muted-foreground">Always here to listen</p>
              </div>
            </div>
            {stressLevel && (
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full"
                onClick={handleRetakeStressTest}
              >
                <Brain className="mr-2 h-4 w-4" />
                Retake Test
              </Button>
            )}
          </div>
        </header>

        {/* Stress Level Banner */}
        {stressLevel && (
          <div className={`border-b px-4 py-2 text-center text-sm ${
            stressLevel === "high" 
              ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              : stressLevel === "moderate"
              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
              : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          }`}>
            Current stress level: <span className="font-semibold capitalize">{stressLevel}</span>
            {stressLevel === "high" && " - Consider booking a therapy session"}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-4xl space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-3xl px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  <p
                    className={`mt-1 text-xs ${
                      message.sender === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-3xl bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="sticky bottom-20 border-t bg-white/80 px-4 py-4 backdrop-blur-xl dark:bg-black/80">
          <div className="mx-auto max-w-4xl">
            <Card className="rounded-3xl border-2 p-2">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Share what's on your mind..."
                  className="border-0 focus-visible:ring-0"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full"
                  disabled={!input.trim() || isTyping}
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Remember: I'm an AI companion. For crisis support, please contact a professional or emergency services.
            </p>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  )
}