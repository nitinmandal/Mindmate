import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { likes, posts } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // Validate post ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid post ID is required', code: 'INVALID_POST_ID' },
        { status: 400 }
      );
    }

    const postId = parseInt(id);

    // Check if post exists
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (post.length === 0) {
      return NextResponse.json(
        { error: 'Post not found', code: 'POST_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if user already liked the post
    const existingLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
      .limit(1);

    let liked: boolean;
    let updatedPost;

    if (existingLike.length > 0) {
      // Unlike: Delete the like record
      await db
        .delete(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

      // Decrement likesCount
      updatedPost = await db
        .update(posts)
        .set({
          likesCount: sql`${posts.likesCount} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId))
        .returning();

      liked = false;
    } else {
      // Like: Insert like record
      await db.insert(likes).values({
        postId,
        userId,
        createdAt: new Date(),
      });

      // Increment likesCount
      updatedPost = await db
        .update(posts)
        .set({
          likesCount: sql`${posts.likesCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId))
        .returning();

      liked = true;
    }

    return NextResponse.json(
      {
        liked,
        likesCount: updatedPost[0].likesCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/posts/[id]/like error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}