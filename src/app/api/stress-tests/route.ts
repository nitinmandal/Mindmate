import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stressTests } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const results = await db.select()
      .from(stressTests)
      .where(eq(stressTests.userId, session.user.id))
      .orderBy(desc(stressTests.testDate))
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

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { score, stressLevel, recommendations, testDate } = body;

    if (score === undefined || score === null) {
      return NextResponse.json({ 
        error: "Score is required",
        code: "MISSING_SCORE" 
      }, { status: 400 });
    }

    if (!stressLevel) {
      return NextResponse.json({ 
        error: "Stress level is required",
        code: "MISSING_STRESS_LEVEL" 
      }, { status: 400 });
    }

    if (!recommendations) {
      return NextResponse.json({ 
        error: "Recommendations are required",
        code: "MISSING_RECOMMENDATIONS" 
      }, { status: 400 });
    }

    if (!testDate) {
      return NextResponse.json({ 
        error: "Test date is required",
        code: "MISSING_TEST_DATE" 
      }, { status: 400 });
    }

    const scoreInt = parseInt(score);
    if (isNaN(scoreInt) || scoreInt < 0 || scoreInt > 105) {
      return NextResponse.json({ 
        error: "Score must be an integer between 0 and 105",
        code: "INVALID_SCORE" 
      }, { status: 400 });
    }

    const validStressLevels = ['low', 'moderate', 'high'];
    if (!validStressLevels.includes(stressLevel.toLowerCase())) {
      return NextResponse.json({ 
        error: "Stress level must be one of: low, moderate, high",
        code: "INVALID_STRESS_LEVEL" 
      }, { status: 400 });
    }

    const testDateObj = new Date(testDate);
    if (isNaN(testDateObj.getTime())) {
      return NextResponse.json({ 
        error: "Invalid test date format",
        code: "INVALID_TEST_DATE" 
      }, { status: 400 });
    }

    const newStressTest = await db.insert(stressTests)
      .values({
        userId: session.user.id,
        score: scoreInt,
        stressLevel: stressLevel.toLowerCase(),
        recommendations: recommendations.trim(),
        testDate: testDateObj,
        createdAt: new Date()
      })
      .returning();

    return NextResponse.json(newStressTest[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}