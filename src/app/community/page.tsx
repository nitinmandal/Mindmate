"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, MessageCircle, TrendingUp, Users, Loader2, Plus, Send } from "lucide-react"
import BottomNav from "@/components/BottomNav"
import { useSession } from "@/lib/auth-client"
import { toast } from "sonner"

type Post = {
  id: number
  userId: string
  content: string
  category: string
  isAnonymous: boolean
  likesCount: number
  commentsCount: number
  createdAt: string
  updatedAt: string
  author: {
    name: string
    image: string | null
  } | null
}

type Comment = {
  id: number
  postId: number
  userId: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    image: string | null
  }
}

const categoryLabels: Record<string, string> = {
  share_feelings: "💭 Share Feelings",
  mental_growth: "🌱 Mental Growth",
  support_encouragement: "❤️ Support & Encouragement",
}

export default function CommunityPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  
  // New post dialog
  const [showNewPostDialog, setShowNewPostDialog] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostCategory, setNewPostCategory] = useState("share_feelings")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Comments dialog
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/community")
    }
  }, [session, isPending, router])

  useEffect(() => {
    const fetchPosts = async () => {
      if (!session?.user) return

      try {
        const token = localStorage.getItem("bearer_token")
        const url = selectedCategory === "all" 
          ? "/api/posts" 
          : `/api/posts?category=${selectedCategory}`
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setPosts(data)
        }
      } catch (error) {
        console.error("Error fetching posts:", error)
        toast.error("Failed to load posts")
      } finally {
        setIsLoadingPosts(false)
      }
    }

    if (!isPending) {
      fetchPosts()
    }
  }, [session, isPending, selectedCategory])

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error("Please write something before posting")
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newPostContent.trim(),
          category: newPostCategory,
          isAnonymous,
        }),
      })

      if (response.ok) {
        const newPost = await response.json()
        setPosts([newPost, ...posts])
        setNewPostContent("")
        setNewPostCategory("share_feelings")
        setIsAnonymous(false)
        setShowNewPostDialog(false)
        toast.success("Post created successfully!")
      } else {
        throw new Error("Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleLike = async (postId: number) => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const { liked, likesCount } = await response.json()
        
        // Update liked state
        setLikedPosts((prev) => {
          const newSet = new Set(prev)
          if (liked) {
            newSet.add(postId)
          } else {
            newSet.delete(postId)
          }
          return newSet
        })

        // Update post likes count
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, likesCount } : post
          )
        )
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      toast.error("Failed to update like")
    }
  }

  const loadComments = async (post: Post) => {
    setSelectedPost(post)
    setIsLoadingComments(true)

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error loading comments:", error)
      toast.error("Failed to load comments")
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return

    setIsSubmittingComment(true)

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/posts/${selectedPost.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        const newCommentData = await response.json()
        setComments([...comments, newCommentData])
        setNewComment("")
        
        // Update comment count
        setPosts((prev) =>
          prev.map((post) =>
            post.id === selectedPost.id
              ? { ...post, commentsCount: post.commentsCount + 1 }
              : post
          )
        )
        
        toast.success("Comment added!")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (isPending || isLoadingPosts) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl dark:bg-black/80">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Community</h1>
                <p className="text-sm text-muted-foreground">A safe space to share and connect</p>
              </div>
              <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
                <DialogTrigger asChild>
                  <Button className="rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Share Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create a Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                        <SelectTrigger className="rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="share_feelings">💭 Share Feelings</SelectItem>
                          <SelectItem value="mental_growth">🌱 Mental Growth</SelectItem>
                          <SelectItem value="support_encouragement">❤️ Support & Encouragement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Share your thoughts with the community..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="min-h-[150px] rounded-2xl"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="anonymous" className="text-sm">
                        Post anonymously
                      </label>
                    </div>
                    <Button
                      onClick={handleCreatePost}
                      disabled={isSubmitting || !newPostContent.trim()}
                      className="w-full rounded-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Share Post"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Feed */}
            <div className="space-y-4 lg:col-span-2">
              {/* Category Filter */}
              <Card className="rounded-3xl p-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="share_feelings">💭 Share Feelings</SelectItem>
                    <SelectItem value="mental_growth">🌱 Mental Growth</SelectItem>
                    <SelectItem value="support_encouragement">❤️ Support & Encouragement</SelectItem>
                  </SelectContent>
                </Select>
              </Card>

              {posts.length === 0 ? (
                <Card className="rounded-3xl p-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No posts yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Be the first to share your thoughts with the community!
                  </p>
                  <Button onClick={() => setShowNewPostDialog(true)} className="rounded-full">
                    Create First Post
                  </Button>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="rounded-3xl p-6">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">
                              {post.isAnonymous ? "Anonymous" : post.author?.name || "Unknown User"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()} at{" "}
                              {new Date(post.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Badge variant="secondary" className="rounded-full">
                            {categoryLabels[post.category]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <p className="mb-4 whitespace-pre-wrap text-muted-foreground">{post.content}</p>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={() => toggleLike(post.id)}
                      >
                        <Heart
                          className={`mr-2 h-4 w-4 ${
                            likedPosts.has(post.id) ? "fill-red-500 text-red-500" : ""
                          }`}
                        />
                        {post.likesCount}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() => loadComments(post)}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            {post.commentsCount}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Comments</DialogTitle>
                          </DialogHeader>
                          
                          {isLoadingComments ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : (
                            <>
                              <div className="space-y-4">
                                {comments.length === 0 ? (
                                  <p className="py-8 text-center text-sm text-muted-foreground">
                                    No comments yet. Be the first to comment!
                                  </p>
                                ) : (
                                  comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                      <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400" />
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold">{comment.user.name}</p>
                                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {new Date(comment.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              <div className="flex gap-2 border-t pt-4">
                                <Textarea
                                  placeholder="Write a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="min-h-[80px] rounded-2xl"
                                />
                                <Button
                                  onClick={handleAddComment}
                                  disabled={isSubmittingComment || !newComment.trim()}
                                  size="icon"
                                  className="h-10 w-10 shrink-0 rounded-full"
                                >
                                  {isSubmittingComment ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="rounded-3xl p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Community Guidelines</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Be kind and supportive</li>
                  <li>• Respect others' privacy</li>
                  <li>• No harmful content</li>
                  <li>• Share constructively</li>
                  <li>• Report inappropriate posts</li>
                </ul>
              </Card>

              <Card className="rounded-3xl p-6">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Popular Categories</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className="w-full rounded-2xl bg-muted p-3 text-left text-sm font-medium transition-colors hover:bg-muted/80"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  )
}