import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, user } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const VALID_CATEGORIES = ['share_feelings', 'mental_growth', 'support_encouragement'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const category = searchParams.get('category');

    let query = db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        category: posts.category,
        isAnonymous: posts.isAnonymous,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(posts)
      .leftJoin(user, eq(posts.userId, user.id))
      .orderBy(desc(posts.createdAt))
      .$dynamic();

    if (category) {
      query = query.where(eq(posts.category, category));
    }

    const results = await query.limit(limit).offset(offset);

    const formattedResults = results.map(post => ({
      id: post.id,
      userId: post.userId,
      content: post.content,
      category: post.category,
      isAnonymous: post.isAnonymous,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.isAnonymous ? null : {
        name: post.authorName,
        image: post.authorImage,
      },
    }));

    return NextResponse.json(formattedResults, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, category, isAnonymous = false } = body;

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Content is required and must not be empty',
          code: 'INVALID_CONTENT',
        },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        {
          error: 'Category is required',
          code: 'MISSING_CATEGORY',
        },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: 'INVALID_CATEGORY',
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const newPost = await db
      .insert(posts)
      .values({
        userId: session.user.id,
        content: content.trim(),
        category,
        isAnonymous: Boolean(isAnonymous),
        likesCount: 0,
        commentsCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (newPost.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create post', code: 'CREATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(newPost[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}