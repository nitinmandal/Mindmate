import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const VALID_THEMES = ['light', 'dark', 'system'];
const VALID_STRESS_LEVELS = ['low', 'moderate', 'high'];

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const preferences = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    if (preferences.length === 0) {
      return NextResponse.json({
        userId: session.user.id,
        hasCompletedOnboarding: false,
        currentStressLevel: null,
        lastStressTestDate: null,
        theme: 'system',
        emailNotifications: true,
        communityNotifications: true,
        createdAt: null,
        updatedAt: null
      }, { status: 200 });
    }

    return NextResponse.json(preferences[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const {
      hasCompletedOnboarding,
      currentStressLevel,
      lastStressTestDate,
      theme,
      emailNotifications,
      communityNotifications
    } = body;

    if (theme !== undefined && !VALID_THEMES.includes(theme)) {
      return NextResponse.json({ 
        error: `Invalid theme. Must be one of: ${VALID_THEMES.join(', ')}`,
        code: "INVALID_THEME" 
      }, { status: 400 });
    }

    if (currentStressLevel !== undefined && currentStressLevel !== null && !VALID_STRESS_LEVELS.includes(currentStressLevel)) {
      return NextResponse.json({ 
        error: `Invalid stress level. Must be one of: ${VALID_STRESS_LEVELS.join(', ')}`,
        code: "INVALID_STRESS_LEVEL" 
      }, { status: 400 });
    }

    const existingPreferences = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    const updateData: any = {
      updatedAt: new Date()
    };

    if (hasCompletedOnboarding !== undefined) {
      updateData.hasCompletedOnboarding = hasCompletedOnboarding;
    }
    if (currentStressLevel !== undefined) {
      updateData.currentStressLevel = currentStressLevel;
    }
    if (lastStressTestDate !== undefined) {
      updateData.lastStressTestDate = lastStressTestDate ? new Date(lastStressTestDate) : null;
    }
    if (theme !== undefined) {
      updateData.theme = theme;
    }
    if (emailNotifications !== undefined) {
      updateData.emailNotifications = emailNotifications;
    }
    if (communityNotifications !== undefined) {
      updateData.communityNotifications = communityNotifications;
    }

    if (existingPreferences.length === 0) {
      const insertData = {
        userId: session.user.id,
        hasCompletedOnboarding: hasCompletedOnboarding ?? false,
        currentStressLevel: currentStressLevel ?? null,
        lastStressTestDate: lastStressTestDate ? new Date(lastStressTestDate) : null,
        theme: theme ?? 'system',
        emailNotifications: emailNotifications ?? true,
        communityNotifications: communityNotifications ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newPreferences = await db.insert(userPreferences)
        .values(insertData)
        .returning();

      return NextResponse.json(newPreferences[0], { status: 200 });
    }

    const updatedPreferences = await db.update(userPreferences)
      .set(updateData)
      .where(eq(userPreferences.userId, session.user.id))
      .returning();

    if (updatedPreferences.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update preferences',
        code: "UPDATE_FAILED" 
      }, { status: 500 });
    }

    return NextResponse.json(updatedPreferences[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}