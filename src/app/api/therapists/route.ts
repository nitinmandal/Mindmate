import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { therapists } from '@/db/schema';
import { eq, desc, like, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const availableParam = searchParams.get('available');
    const specializationParam = searchParams.get('specialization');

    let query = db.select().from(therapists);

    const conditions = [];

    // Filter by availability (default to true if not specified)
    const showAvailable = availableParam === null || availableParam === 'true';
    if (showAvailable) {
      conditions.push(eq(therapists.available, true));
    } else if (availableParam === 'false') {
      conditions.push(eq(therapists.available, false));
    }

    // Filter by specialization (search within comma-separated values)
    if (specializationParam) {
      conditions.push(like(therapists.specialization, `%${specializationParam}%`));
    }

    // Apply conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Order by rating descending
    const results = await query.orderBy(desc(therapists.rating));

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}