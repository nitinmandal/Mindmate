"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ExternalLink } from "lucide-react";

const resources = [
  {
    id: 1,
    title: "5-Minute Breathing Exercise",
    category: "Anxiety",
    description: "Quick guided breathing technique to calm your nervous system and reduce anxiety in moments of stress.",
    icon: "🫁",
    link: "#",
  },
  {
    id: 2,
    title: "Sleep Hygiene Guide",
    category: "Sleep",
    description: "Evidence-based tips for improving sleep quality and establishing healthy bedtime routines.",
    icon: "😴",
    link: "#",
  },
  {
    id: 3,
    title: "Mindful Meditation Basics",
    category: "Meditation",
    description: "Learn the fundamentals of mindfulness meditation to reduce stress and increase present-moment awareness.",
    icon: "🧘",
    link: "#",
  },
  {
    id: 4,
    title: "Managing Work Stress",
    category: "Work",
    description: "Practical strategies for setting boundaries, managing workload, and preventing burnout.",
    icon: "💼",
    link: "#",
  },
  {
    id: 5,
    title: "Cognitive Reframing",
    category: "CBT",
    description: "Learn to identify and challenge negative thought patterns using cognitive behavioral techniques.",
    icon: "🧠",
    link: "#",
  },
  {
    id: 6,
    title: "Building Healthy Relationships",
    category: "Relationships",
    description: "Communication skills and strategies for nurturing meaningful connections with others.",
    icon: "💝",
    link: "#",
  },
];

export function ResourcesSection() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
          <Lightbulb className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Wellness Resources</h2>
          <p className="text-sm text-muted-foreground">
            Evidence-based tools and exercises for mental health
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Card
            key={resource.id}
            className="group cursor-pointer rounded-3xl p-6 transition-all hover:shadow-lg"
          >
            <div className="mb-3 text-4xl">{resource.icon}</div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{resource.title}</h3>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mb-3 text-sm text-muted-foreground">{resource.description}</p>
            <Badge variant="secondary" className="rounded-full">
              {resource.category}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
