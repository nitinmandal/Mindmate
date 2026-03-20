"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Video, Clock, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

type Appointment = {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  therapist: {
    id: number;
    name: string;
    specialization: string;
    image: string;
  };
};

export function UpcomingAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/appointments?status=scheduled", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Get next 3 upcoming appointments
        const upcoming = data
          .filter((apt: Appointment) => {
            const aptDate = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
            return aptDate > new Date();
          })
          .slice(0, 3);
        setAppointments(upcoming);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
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

  return (
    <Card className="rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
            <p className="text-sm text-muted-foreground">Your scheduled sessions</p>
          </div>
        </div>
        <Link href="/appointments">
          <Button size="sm" variant="ghost" className="rounded-full">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-sm text-muted-foreground">No upcoming appointments</p>
            <Link href="/appointments">
              <Button className="rounded-full">
                <Calendar className="mr-2 h-4 w-4" />
                Book a Session
              </Button>
            </Link>
          </div>
        ) : (
          appointments.map((apt) => {
            const aptDate = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
            const isToday =
              aptDate.toDateString() === new Date().toDateString();
            const isTomorrow =
              new Date(aptDate).setHours(0, 0, 0, 0) ===
              new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0, 0);

            return (
              <Card key={apt.id} className="rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br ${apt.therapist.image}`} />
                  <div className="flex-1">
                    <p className="font-semibold">{apt.therapist.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {apt.therapist.specialization.split(",")[0]}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {isToday ? "Today" : isTomorrow ? "Tomorrow" : aptDate.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {aptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  {isToday && (
                    <Button size="sm" className="rounded-full">
                      <Video className="mr-2 h-3 w-3" />
                      Join
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </Card>
  );
}
