"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Mood = {
  id: number;
  emoji: string;
  moodName: string;
  createdAt: string;
};

const moodToValue: Record<string, number> = {
  "Very Happy": 5,
  "Happy": 4,
  "Okay": 3,
  "Sad": 2,
  "Very Sad": 1,
};

export function MoodChart() {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMoods();
  }, []);

  const fetchMoods = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/moods?limit=14", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMoods(data);
      }
    } catch (error) {
      console.error("Error fetching moods:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-3xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = moods
    .slice()
    .reverse()
    .map((mood) => ({
      date: new Date(mood.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: moodToValue[mood.moodName] || 3,
      emoji: mood.emoji,
    }));

  if (chartData.length === 0) {
    return (
      <Card className="rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Mood Trends</h3>
            <p className="text-sm text-muted-foreground">Track your emotional wellbeing</p>
          </div>
        </div>
        <div className="py-8 text-center text-sm text-muted-foreground">
          Start tracking your mood to see trends over time
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Mood Trends</h3>
          <p className="text-sm text-muted-foreground">Last {chartData.length} days</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5]} fontSize={12} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-lg">
                      <p className="text-sm font-semibold">{payload[0].payload.date}</p>
                      <p className="text-xs text-muted-foreground">
                        {payload[0].payload.emoji} Mood: {payload[0].value}/5
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
