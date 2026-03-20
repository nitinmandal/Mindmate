import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Fetch chat messages for the authenticated user, ordered by createdAt ASC
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, session.user.id))
      .orderBy(asc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(messages, { status: 200 });
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
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sender } = body;

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        {
          error: 'Message is required and cannot be empty',
          code: 'MISSING_MESSAGE',
        },
        { status: 400 }
      );
    }

    if (!sender || typeof sender !== 'string') {
      return NextResponse.json(
        {
          error: 'Sender is required',
          code: 'MISSING_SENDER',
        },
        { status: 400 }
      );
    }

    // Validate sender value
    if (sender !== 'user' && sender !== 'ai') {
      return NextResponse.json(
        {
          error: 'Sender must be either "user" or "ai"',
          code: 'INVALID_SENDER',
        },
        { status: 400 }
      );
    }

    // Insert new chat message
    const newMessage = await db
      .insert(chatMessages)
      .values({
        userId: session.user.id,
        message: message.trim(),
        sender: sender,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}