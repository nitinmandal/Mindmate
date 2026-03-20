import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { journals } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Extract and validate ID
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const journalId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { title, content } = body;

    // Security check: reject if userId or user_id provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    // Validate that at least one field is being updated
    if (title === undefined && content === undefined) {
      return NextResponse.json(
        {
          error: 'At least one field (title or content) must be provided',
          code: 'NO_UPDATE_FIELDS',
        },
        { status: 400 }
      );
    }

    // Validate title if provided
    if (title !== undefined && title.trim() === '') {
      return NextResponse.json(
        { error: 'Title cannot be empty', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    // Validate content if provided
    if (content !== undefined && content.trim() === '') {
      return NextResponse.json(
        { error: 'Content cannot be empty', code: 'INVALID_CONTENT' },
        { status: 400 }
      );
    }

    // Check if journal exists and belongs to authenticated user
    const existingJournal = await db
      .select()
      .from(journals)
      .where(eq(journals.id, journalId))
      .limit(1);

    if (existingJournal.length === 0) {
      return NextResponse.json(
        { error: 'Journal not found', code: 'JOURNAL_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if journal belongs to authenticated user
    if (existingJournal[0].userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'You do not have permission to update this journal',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Build update object with only provided fields
    const updates: {
      title?: string;
      content?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updates.title = title.trim();
    }

    if (content !== undefined) {
      updates.content = content.trim();
    }

    // Update journal
    const updated = await db
      .update(journals)
      .set(updates)
      .where(
        and(eq(journals.id, journalId), eq(journals.userId, session.user.id))
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update journal', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Extract and validate ID
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const journalId = parseInt(id);

    // Check if journal exists and belongs to authenticated user
    const existingJournal = await db
      .select()
      .from(journals)
      .where(eq(journals.id, journalId))
      .limit(1);

    if (existingJournal.length === 0) {
      return NextResponse.json(
        { error: 'Journal not found', code: 'JOURNAL_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if journal belongs to authenticated user
    if (existingJournal[0].userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'You do not have permission to delete this journal',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Delete journal
    const deleted = await db
      .delete(journals)
      .where(
        and(eq(journals.id, journalId), eq(journals.userId, session.user.id))
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete journal', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Journal deleted successfully',
        journal: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}