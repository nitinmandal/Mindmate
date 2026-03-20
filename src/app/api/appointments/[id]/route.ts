import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, therapists } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const VALID_STATUSES = ['scheduled', 'completed', 'cancelled'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const appointmentId = parseInt(id);

    const existingAppointment = await db.select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (existingAppointment.length === 0) {
      return NextResponse.json({ 
        error: 'Appointment not found',
        code: 'APPOINTMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    if (existingAppointment[0].userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'You do not have permission to update this appointment',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes } = body;

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED' 
      }, { status: 400 });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    const updates: { status?: string; notes?: string | null } = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update',
        code: 'NO_UPDATES' 
      }, { status: 400 });
    }

    const updated = await db.update(appointments)
      .set(updates)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.userId, session.user.id)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update appointment',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    const therapistDetails = await db.select()
      .from(therapists)
      .where(eq(therapists.id, updated[0].therapistId))
      .limit(1);

    const appointmentWithTherapist = {
      ...updated[0],
      therapist: therapistDetails[0] || null
    };

    return NextResponse.json(appointmentWithTherapist, { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const appointmentId = parseInt(id);

    const existingAppointment = await db.select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (existingAppointment.length === 0) {
      return NextResponse.json({ 
        error: 'Appointment not found',
        code: 'APPOINTMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    if (existingAppointment[0].userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'You do not have permission to delete this appointment',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const deleted = await db.delete(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.userId, session.user.id)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete appointment',
        code: 'DELETE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Appointment deleted successfully',
      deletedAppointment: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}