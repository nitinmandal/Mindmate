"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Video, Clock, Award, Loader2, Calendar as CalendarIcon } from "lucide-react"
import BottomNav from "@/components/BottomNav"
import { useSession } from "@/lib/auth-client"
import { toast } from "sonner"

type Therapist = {
  id: number
  name: string
  email: string
  bio: string
  specialization: string
  rating: number
  image: string
  available: boolean
}

type Appointment = {
  id: number
  appointmentDate: string
  appointmentTime: string
  status: string
  therapist: {
    id: number
    name: string
    specialization: string
    image: string
  }
}

// Mock data with Indian names
const MOCK_THERAPISTS: Therapist[] = [
  {
    id: 1,
    name: "Dr. Priya Sharma",
    email: "priya.sharma@mindmate.com",
    bio: "Specialized in cognitive behavioral therapy with 12+ years of experience helping individuals overcome anxiety and depression. Passionate about holistic mental wellness.",
    specialization: "anxiety, depression, cognitive behavioral therapy",
    rating: 4.9,
    image: "from-purple-400 to-pink-400",
    available: true
  },
  {
    id: 2,
    name: "Dr. Rajesh Mehta",
    email: "rajesh.mehta@mindmate.com",
    bio: "Expert in trauma-informed care and PTSD treatment. Helping individuals heal from past experiences and build resilience for a brighter future.",
    specialization: "trauma, ptsd, emotional healing",
    rating: 4.8,
    image: "from-blue-400 to-cyan-400",
    available: true
  },
  {
    id: 3,
    name: "Dr. Anjali Desai",
    email: "anjali.desai@mindmate.com",
    bio: "Relationship counselor and family therapist. Specializing in communication, conflict resolution, and building stronger bonds between partners and families.",
    specialization: "relationships, family therapy, couples counseling",
    rating: 4.7,
    image: "from-pink-400 to-rose-400",
    available: true
  },
  {
    id: 4,
    name: "Dr. Arjun Reddy",
    email: "arjun.reddy@mindmate.com",
    bio: "ADHD specialist with focus on executive function coaching. Helping individuals develop strategies for focus, organization, and productivity.",
    specialization: "adhd, executive function, productivity",
    rating: 4.6,
    image: "from-green-400 to-emerald-400",
    available: false
  },
  {
    id: 5,
    name: "Dr. Sneha Kapoor",
    email: "sneha.kapoor@mindmate.com",
    bio: "Addiction recovery specialist and substance abuse counselor. Supporting individuals on their journey to recovery with compassion and evidence-based methods.",
    specialization: "addiction, substance abuse, recovery",
    rating: 4.9,
    image: "from-orange-400 to-amber-400",
    available: true
  },
  {
    id: 6,
    name: "Dr. Vikram Singh",
    email: "vikram.singh@mindmate.com",
    bio: "Work stress and burnout expert. Helping professionals maintain work-life balance, manage workplace anxiety, and prevent career burnout.",
    specialization: "work stress, burnout, career counseling",
    rating: 4.5,
    image: "from-indigo-400 to-purple-400",
    available: true
  },
  {
    id: 7,
    name: "Dr. Kavita Patel",
    email: "kavita.patel@mindmate.com",
    bio: "Child and adolescent psychologist with expertise in developmental issues, school anxiety, and helping young minds navigate emotional challenges.",
    specialization: "anxiety, depression, adolescent therapy",
    rating: 4.8,
    image: "from-teal-400 to-cyan-400",
    available: true
  },
  {
    id: 8,
    name: "Dr. Aditya Verma",
    email: "aditya.verma@mindmate.com",
    bio: "Mindfulness-based stress reduction practitioner. Integrating meditation, yoga philosophy, and modern therapy for holistic mental wellness.",
    specialization: "anxiety, work stress, mindfulness",
    rating: 4.7,
    image: "from-violet-400 to-fuchsia-400",
    available: false
  }
]

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 1,
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    appointmentTime: "10:00",
    status: "scheduled",
    therapist: {
      id: 1,
      name: "Dr. Priya Sharma",
      specialization: "Anxiety & Depression",
      image: "from-purple-400 to-pink-400"
    }
  },
  {
    id: 2,
    appointmentDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
    appointmentTime: "14:30",
    status: "scheduled",
    therapist: {
      id: 3,
      name: "Dr. Anjali Desai",
      specialization: "Relationships",
      image: "from-pink-400 to-rose-400"
    }
  }
]

export default function AppointmentsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all")
  const [therapists, setTherapists] = useState<Therapist[]>(MOCK_THERAPISTS)
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS)
  
  // Booking dialog state
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
  const [bookingDate, setBookingDate] = useState("")
  const [bookingTime, setBookingTime] = useState("")
  const [bookingNotes, setBookingNotes] = useState("")
  const [isBooking, setIsBooking] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/appointments")
    }
  }, [session, isPending, router])

  // Filter therapists
  const filteredTherapists = useMemo(() => {
    let filtered = [...therapists]

    // Filter by specialty
    if (selectedSpecialty !== "all") {
      filtered = filtered.filter(t => 
        t.specialization.toLowerCase().includes(selectedSpecialty.toLowerCase())
      )
    }

    return filtered
  }, [therapists, selectedSpecialty])

  const handleBookSession = (therapist: Therapist) => {
    setSelectedTherapist(therapist)
    setBookingDate("")
    setBookingTime("")
    setBookingNotes("")
    setShowBookingDialog(true)
  }

  const handleConfirmBooking = async () => {
    if (!selectedTherapist || !bookingDate || !bookingTime) {
      toast.error("Please fill in all required fields")
      return
    }

    // Validate date is in the future
    const selectedDateTime = new Date(`${bookingDate}T${bookingTime}`)
    if (selectedDateTime <= new Date()) {
      toast.error("Please select a future date and time")
      return
    }

    setIsBooking(true)
    
    // Simulate booking delay
    setTimeout(() => {
      // Add new appointment to the list
      const newAppointment: Appointment = {
        id: upcomingAppointments.length + 1,
        appointmentDate: bookingDate,
        appointmentTime: bookingTime,
        status: "scheduled",
        therapist: {
          id: selectedTherapist.id,
          name: selectedTherapist.name,
          specialization: selectedTherapist.specialization.split(",")[0].trim(),
          image: selectedTherapist.image
        }
      }

      setUpcomingAppointments([...upcomingAppointments, newAppointment])
      toast.success(`Appointment booked with ${selectedTherapist.name}!`)
      setShowBookingDialog(false)
      setIsBooking(false)
    }, 1000)
  }

  if (isPending) {
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
      <div className="min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl dark:bg-black/80">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <h1 className="text-2xl font-bold">Appointments</h1>
            <p className="text-sm text-muted-foreground">Book sessions with licensed therapists</p>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-6">
          {/* Upcoming Sessions */}
          {upcomingAppointments.length > 0 && (
            <Card className="mb-6 rounded-3xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 p-6">
              <h2 className="mb-4 text-lg font-semibold">Upcoming Sessions</h2>
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 3).map((apt) => {
                  const aptDate = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`)
                  const isToday = aptDate.toDateString() === new Date().toDateString()

                  return (
                    <div key={apt.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${apt.therapist.image}`} />
                        <div>
                          <p className="font-semibold">{apt.therapist.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {isToday ? "Today" : aptDate.toLocaleDateString()} • {aptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      {isToday && (
                        <Button variant="outline" className="rounded-full">
                          <Video className="mr-2 h-4 w-4" />
                          Join Call
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          <div className="space-y-6">
            {/* Filter by Specialty */}
            <Card className="rounded-3xl p-6">
              <h3 className="mb-4 font-semibold">Filter by Specialty</h3>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="All Specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="anxiety">Anxiety</SelectItem>
                  <SelectItem value="depression">Depression</SelectItem>
                  <SelectItem value="trauma">Trauma & PTSD</SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                  <SelectItem value="adhd">ADHD</SelectItem>
                  <SelectItem value="addiction">Addiction</SelectItem>
                  <SelectItem value="work stress">Work Stress</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            {/* Therapists List */}
            <div className="space-y-4">
              {filteredTherapists.length === 0 ? (
                <Card className="rounded-3xl p-12 text-center">
                  <p className="text-muted-foreground">No therapists found for this specialty.</p>
                </Card>
              ) : (
                filteredTherapists.map((therapist) => {
                  const specialties = therapist.specialization.split(",").map((s) => s.trim())
                  
                  return (
                    <Card key={therapist.id} className="rounded-3xl p-6">
                      <div className="flex gap-4">
                        <div className={`h-20 w-20 shrink-0 rounded-2xl bg-gradient-to-br ${therapist.image}`} />
                        <div className="flex-1">
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{therapist.name}</h3>
                              <p className="text-sm text-muted-foreground">{therapist.email}</p>
                            </div>
                            <Badge variant={therapist.available ? "default" : "secondary"} className="rounded-full">
                              {therapist.available ? "Available" : "Unavailable"}
                            </Badge>
                          </div>

                          <div className="mb-3 flex flex-wrap gap-2">
                            {specialties.slice(0, 4).map((spec, index) => (
                              <Badge key={index} variant="outline" className="rounded-full">
                                {spec}
                              </Badge>
                            ))}
                          </div>

                          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{therapist.bio}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{therapist.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            <Button 
                              onClick={() => handleBookSession(therapist)} 
                              disabled={!therapist.available}
                              className="rounded-full"
                            >
                              Book Session
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          {selectedTherapist && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-muted p-4">
                <div className={`h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br ${selectedTherapist.image}`} />
                <div>
                  <p className="font-semibold">{selectedTherapist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTherapist.specialization.split(",")[0]}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Appointment Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Appointment Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific topics or concerns you'd like to discuss..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="min-h-[100px] rounded-2xl"
                />
              </div>

              <Button 
                onClick={handleConfirmBooking} 
                disabled={isBooking || !bookingDate || !bookingTime}
                className="w-full rounded-full"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}