"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const moods = [
  { emoji: "😄", name: "great", label: "Great" },
  { emoji: "🙂", name: "good", label: "Good" },
  { emoji: "😐", name: "okay", label: "Okay" },
  { emoji: "😞", name: "sad", label: "Sad" },
  { emoji: "😢", name: "very_sad", label: "Very Sad" },
];

export const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast.error("Please select a mood");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const mood = moods.find((m) => m.name === selectedMood);

      const response = await fetch("/api/moods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          emoji: mood?.emoji,
          moodName: selectedMood,
          note: note.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to log mood");
      }

      toast.success("Mood logged successfully!");
      setSelectedMood(null);
      setNote("");
    } catch (error) {
      console.error("Error logging mood:", error);
      toast.error("Failed to log mood. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-3xl p-6">
      <h3 className="mb-4 text-lg font-semibold">How are you feeling today?</h3>
      
      <div className="mb-4 flex justify-between gap-2">
        {moods.map((mood) => (
          <button
            key={mood.name}
            onClick={() => setSelectedMood(mood.name)}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all hover:scale-105 ${
              selectedMood === mood.name
                ? "border-primary bg-primary/10"
                : "border-transparent bg-muted/50 hover:bg-muted"
            }`}
          >
            <span className="text-3xl">{mood.emoji}</span>
            <span className="text-xs font-medium">{mood.label}</span>
          </button>
        ))}
      </div>

      <Textarea
        placeholder="Add a note about your mood (optional)..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mb-4 min-h-[80px] rounded-2xl"
      />

      <Button
        onClick={handleSubmit}
        disabled={!selectedMood || isSubmitting}
        className="w-full rounded-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging...
          </>
        ) : (
          "Log Mood"
        )}
      </Button>
    </Card>
  );
};
