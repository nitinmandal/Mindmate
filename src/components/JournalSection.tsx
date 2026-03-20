"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Journal = {
  id: number;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export function JournalSection() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/journals?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setJournals(data);
      }
    } catch (error) {
      console.error("Error fetching journals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const url = editingJournal ? `/api/journals/${editingJournal.id}` : "/api/journals";
      const method = editingJournal ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      if (response.ok) {
        toast.success(editingJournal ? "Journal updated!" : "Journal created!");
        setShowDialog(false);
        setTitle("");
        setContent("");
        setEditingJournal(null);
        fetchJournals();
      } else {
        throw new Error("Failed to save journal");
      }
    } catch (error) {
      console.error("Error saving journal:", error);
      toast.error("Failed to save journal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (journal: Journal) => {
    setEditingJournal(journal);
    setTitle(journal.title);
    setContent(journal.content);
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/journals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Journal deleted");
        fetchJournals();
      }
    } catch (error) {
      console.error("Error deleting journal:", error);
      toast.error("Failed to delete journal");
    }
  };

  const resetDialog = () => {
    setShowDialog(false);
    setTitle("");
    setContent("");
    setEditingJournal(null);
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

  return (
    <Card className="rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Journal Entries</h3>
            <p className="text-sm text-muted-foreground">Track your thoughts and feelings</p>
          </div>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => !open && resetDialog()}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingJournal ? "Edit Entry" : "New Journal Entry"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Entry title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-2xl"
                />
              </div>
              <div>
                <Textarea
                  placeholder="Write your thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] rounded-2xl"
                />
              </div>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full rounded-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Entry"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {journals.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No journal entries yet. Start writing to track your journey!
          </div>
        ) : (
          journals.map((journal) => (
            <Card key={journal.id} className="rounded-2xl p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{journal.title}</h4>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{journal.content}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleEdit(journal)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleDelete(journal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(journal.createdAt).toLocaleDateString()} at{" "}
                {new Date(journal.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
}
