import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { moods } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const VALID_EMOJIS = ["😄", "🙂", "😐", "😞", "😢"] as const;
const VALID_MOOD_NAMES = ["great", "good", "okay", "sad", "very_sad"] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const results = await db.select()
      .from(moods)
      .where(eq(moods.userId, session.user.id))
      .orderBy(desc(moods.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { emoji, moodName, note } = body;

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!emoji) {
      return NextResponse.json({ 
        error: "Emoji is required",
        code: "MISSING_EMOJI" 
      }, { status: 400 });
    }

    if (!moodName) {
      return NextResponse.json({ 
        error: "Mood name is required",
        code: "MISSING_MOOD_NAME" 
      }, { status: 400 });
    }

    // Validate emoji is one of the allowed values
    if (!VALID_EMOJIS.includes(emoji as typeof VALID_EMOJIS[number])) {
      return NextResponse.json({ 
        error: "Invalid emoji. Must be one of: 😄, 🙂, 😐, 😞, 😢",
        code: "INVALID_EMOJI" 
      }, { status: 400 });
    }

    // Validate moodName is one of the allowed values
    if (!VALID_MOOD_NAMES.includes(moodName as typeof VALID_MOOD_NAMES[number])) {
      return NextResponse.json({ 
        error: "Invalid mood name. Must be one of: great, good, okay, sad, very_sad",
        code: "INVALID_MOOD_NAME" 
      }, { status: 400 });
    }

    // Insert new mood entry
    const newMood = await db.insert(moods)
      .values({
        userId: session.user.id,
        emoji: emoji.trim(),
        moodName: moodName.trim(),
        note: note ? note.trim() : null,
        createdAt: new Date()
      })
      .returning();

    return NextResponse.json(newMood[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}