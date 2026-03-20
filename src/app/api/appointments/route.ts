import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, therapists } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        therapistId: appointments.therapistId,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        therapist: {
          id: therapists.id,
          name: therapists.name,
          image: therapists.image,
          specialization: therapists.specialization,
          rating: therapists.rating,
          email: therapists.email,
          bio: therapists.bio,
        },
      })
      .from(appointments)
      .innerJoin(therapists, eq(appointments.therapistId, therapists.id))
      .where(eq(appointments.userId, session.user.id))
      .orderBy(desc(appointments.appointmentDate), desc(appointments.appointmentTime));

    if (status) {
      query = db
        .select({
          id: appointments.id,
          userId: appointments.userId,
          therapistId: appointments.therapistId,
          appointmentDate: appointments.appointmentDate,
          appointmentTime: appointments.appointmentTime,
          status: appointments.status,
          notes: appointments.notes,
          createdAt: appointments.createdAt,
          therapist: {
            id: therapists.id,
            name: therapists.name,
            image: therapists.image,
            specialization: therapists.specialization,
            rating: therapists.rating,
            email: therapists.email,
            bio: therapists.bio,
          },
        })
        .from(appointments)
        .innerJoin(therapists, eq(appointments.therapistId, therapists.id))
        .where(
          and(
            eq(appointments.userId, session.user.id),
            eq(appointments.status, status)
          )
        )
        .orderBy(desc(appointments.appointmentDate), desc(appointments.appointmentTime));
    }

    const results = await query;

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { therapistId, appointmentDate, appointmentTime, notes } = body;

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    if (!therapistId) {
      return NextResponse.json(
        {
          error: 'Therapist ID is required',
          code: 'MISSING_THERAPIST_ID',
        },
        { status: 400 }
      );
    }

    if (typeof therapistId !== 'number' || isNaN(therapistId)) {
      return NextResponse.json(
        {
          error: 'Invalid therapist ID format',
          code: 'INVALID_THERAPIST_ID',
        },
        { status: 400 }
      );
    }

    if (!appointmentDate) {
      return NextResponse.json(
        {
          error: 'Appointment date is required',
          code: 'MISSING_APPOINTMENT_DATE',
        },
        { status: 400 }
      );
    }

    if (!appointmentTime) {
      return NextResponse.json(
        {
          error: 'Appointment time is required',
          code: 'MISSING_APPOINTMENT_TIME',
        },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appointmentDate)) {
      return NextResponse.json(
        {
          error: 'Invalid appointment date format. Expected YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT',
        },
        { status: 400 }
      );
    }

    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(appointmentTime)) {
      return NextResponse.json(
        {
          error: 'Invalid appointment time format. Expected HH:MM',
          code: 'INVALID_TIME_FORMAT',
        },
        { status: 400 }
      );
    }

    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const currentDateTime = new Date();

    if (appointmentDateTime <= currentDateTime) {
      return NextResponse.json(
        {
          error: 'Appointment date and time must be in the future',
          code: 'PAST_APPOINTMENT_DATE',
        },
        { status: 400 }
      );
    }

    const therapist = await db
      .select()
      .from(therapists)
      .where(eq(therapists.id, therapistId))
      .limit(1);

    if (therapist.length === 0) {
      return NextResponse.json(
        {
          error: 'Therapist not found',
          code: 'THERAPIST_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (!therapist[0].available) {
      return NextResponse.json(
        {
          error: 'Therapist is not available',
          code: 'THERAPIST_NOT_AVAILABLE',
        },
        { status: 404 }
      );
    }

    const newAppointment = await db
      .insert(appointments)
      .values({
        userId: session.user.id,
        therapistId: therapistId,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        status: 'scheduled',
        notes: notes || null,
        createdAt: new Date(),
      })
      .returning();

    const appointmentWithTherapist = await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        therapistId: appointments.therapistId,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        therapist: {
          id: therapists.id,
          name: therapists.name,
          image: therapists.image,
          specialization: therapists.specialization,
          rating: therapists.rating,
          email: therapists.email,
          bio: therapists.bio,
        },
      })
      .from(appointments)
      .innerJoin(therapists, eq(appointments.therapistId, therapists.id))
      .where(eq(appointments.id, newAppointment[0].id))
      .limit(1);

    return NextResponse.json(appointmentWithTherapist[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}