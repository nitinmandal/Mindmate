"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Brain } from "lucide-react";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OnboardingDialog = ({ open, onOpenChange }: OnboardingDialogProps) => {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const handleTakeTest = () => {
    onOpenChange(false);
    router.push("/stress-test");
  };

  const handleSkip = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      await fetch("/api/user-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hasCompletedOnboarding: true,
        }),
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
    onOpenChange(false);
  };

  const steps = [
    {
      icon: Sparkles,
      title: "Welcome to MindMate!",
      description:
        "Your compassionate digital companion for mental wellness. We're here to support you on your journey to better mental health.",
    },
    {
      icon: Heart,
      title: "Here's What We Offer",
      description:
        "Chat with our AI companion, connect with a supportive community, track your mood, and book sessions with licensed therapists—all in one place.",
    },
    {
      icon: Brain,
      title: "Let's Start with a Quick Assessment",
      description:
        "Take our 5-minute stress test to help us understand your current mental state and provide personalized recommendations.",
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Icon className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {currentStep.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex flex-col gap-3">
          {step < steps.length - 1 ? (
            <>
              <Button onClick={() => setStep(step + 1)} className="rounded-full">
                Continue
              </Button>
              <Button onClick={handleSkip} variant="ghost" className="rounded-full">
                Skip for now
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleTakeTest} className="rounded-full">
                Take Stress Test
              </Button>
              <Button onClick={handleSkip} variant="ghost" className="rounded-full">
                Maybe later
              </Button>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
