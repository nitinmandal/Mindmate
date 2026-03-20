import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, user, comments } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const VALID_CATEGORIES = ['share_feelings', 'mental_growth', 'support_encouragement'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const postId = parseInt(id);

    const post = await db
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
      .where(eq(posts.id, postId))
      .limit(1);

    if (post.length === 0) {
      return NextResponse.json(
        { error: 'Post not found', code: 'POST_NOT_FOUND' },
        { status: 404 }
      );
    }

    const postComments = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(comments)
      .leftJoin(user, eq(comments.userId, user.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    const postData = post[0];
    const result = {
      id: postData.id,
      userId: postData.userId,
      content: postData.content,
      category: postData.category,
      isAnonymous: postData.isAnonymous,
      likesCount: postData.likesCount,
      commentsCount: postData.commentsCount,
      createdAt: postData.createdAt,
      updatedAt: postData.updatedAt,
      author: postData.isAnonymous
        ? null
        : {
            name: postData.authorName,
            image: postData.authorImage,
          },
      comments: postComments.map((comment) => ({
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          name: comment.authorName,
          image: comment.authorImage,
        },
      })),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const postId = parseInt(id);
    const requestBody = await request.json();

    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    const { content, category, isAnonymous } = requestBody;

    if (content !== undefined && (!content || content.trim() === '')) {
      return NextResponse.json(
        { error: 'Content must not be empty', code: 'INVALID_CONTENT' },
        { status: 400 }
      );
    }

    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: 'INVALID_CATEGORY',
        },
        { status: 400 }
      );
    }

    const existingPost = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: 'Post not found', code: 'POST_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingPost[0].userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'You do not have permission to update this post',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (content !== undefined) {
      updates.content = content.trim();
    }

    if (category !== undefined) {
      updates.category = category;
    }

    if (isAnonymous !== undefined) {
      updates.isAnonymous = isAnonymous;
    }

    const updated = await db
      .update(posts)
      .set(updates)
      .where(and(eq(posts.id, postId), eq(posts.userId, session.user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update post', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const postId = parseInt(id);

    const existingPost = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: 'Post not found', code: 'POST_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingPost[0].userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'You do not have permission to delete this post',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, session.user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete post', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Post deleted successfully',
        deletedPost: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}