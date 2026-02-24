"use client";

import { getToken } from "@/lib/auth";
import { use, useEffect, useState } from "react";


type Post = {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  tags: string[];
  audioUrl?: string;
  aiFeedback?: {
    summary: string;
  };
  reactions?: {
    agree: number;
    insightful: number;
    idea: number;
  };
};

type Comment = {
  _id: string;
  text: string;
  createdAt: string;
};

export default function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // ✅ Fetch post
  useEffect(() => {
    fetch(`http://localhost:5000/api/posts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch post");
        return res.json();
      })
      .then((data) => setPost(data))
      .catch((err) => {
        console.error("Error fetching post:", err);
        setPost(null);
      });
  }, [id]);

  // ✅ Fetch comments
  useEffect(() => {
    fetch(`http://localhost:5000/api/comments/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch comments");
        return res.json();
      })
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error fetching comments:", err);
        setComments([]);
      });
  }, [id]);

  // ✅ Add comment
  const addComment = async () => {
    if (!newComment.trim()) return;

    const token = getToken();
    try {
      const res = await fetch("http://localhost:5000/api/comments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postId: id,
          text: newComment,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Failed to add comment: ${error.error}`);
        return;
      }

      setNewComment("");

      const updated = await fetch(
        `http://localhost:5000/api/comments/${id}`
      );
      if (updated.ok) {
        setComments(await updated.json());
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  // ✅ Reaction handler
  const react = async (type: string) => {
    const token = getToken();
    try {
      const res = await fetch(
        `http://localhost:5000/api/posts/react/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ type }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to add reaction");
      }

      const updatedReactions = await res.json();

      setPost((prev: any) => ({
        ...prev,
        reactions: updatedReactions,
      }));
    } catch (error) {
      console.error("Error adding reaction:", error);
      alert("Failed to add reaction. Please try again.");
    }
  };

  if (!post) return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        <p className="text-slate-500 text-sm font-mono">Loading reflection...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-void">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-void/80 backdrop-blur-xl border-b border-navy-800 px-8 py-3 flex items-center gap-4">
        <a href="/" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Feed
        </a>
        <div className="w-px h-4 bg-navy-700" />
        <span className="text-xs text-slate-500 truncate max-w-xs">{post.title}</span>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-4">
              {post.tags?.map((tag) => (
                <span key={tag} className="tag-pill">#{tag}</span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-display text-3xl lg:text-4xl text-white leading-tight mb-3">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {new Date(post.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-blue-500/30 via-navy-700 to-transparent mb-8" />

        {/* Content */}
        <div className="text-slate-300 leading-relaxed text-base whitespace-pre-wrap font-sans mb-8">
          {post.content}
        </div>

        {/* Audio */}
        {post.audioUrl && (
          <div className="mb-8 p-5 bg-abyss border border-navy-800 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Audio Discussion</h3>
                <p className="text-xs text-slate-500">Attached recording</p>
              </div>
            </div>
            <audio controls className="w-full">
              <source src={`http://localhost:5000${post.audioUrl}`} />
              Your browser does not support audio.
            </audio>
          </div>
        )}

        {/* AI Feedback */}
        {post.aiFeedback?.summary && (
          <div className="mb-8 relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-navy-800/30 pointer-events-none" />
            <div className="relative p-6 border border-blue-800/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-blue-300">AI Feedback</h2>
                  <p className="text-xs text-slate-500">Generated analysis</p>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed font-sans">
                {post.aiFeedback.summary}
              </pre>
            </div>
          </div>
        )}

        {/* Reactions */}
        <div className="mb-10">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Reactions</p>
          <div className="flex gap-2">
            <button
              onClick={() => react("agree")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-abyss border border-navy-800 hover:border-blue-500/30 hover:bg-navy-800/50 text-slate-300 hover:text-white transition-all group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">👍</span>
              <span className="text-xs font-mono text-slate-400">Agree</span>
              <span className="text-xs font-mono text-blue-400 bg-navy-800 px-1.5 py-0.5 rounded-md">{post.reactions?.agree || 0}</span>
            </button>

            <button
              onClick={() => react("insightful")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-abyss border border-navy-800 hover:border-blue-500/30 hover:bg-navy-800/50 text-slate-300 hover:text-white transition-all group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">💡</span>
              <span className="text-xs font-mono text-slate-400">Insightful</span>
              <span className="text-xs font-mono text-blue-400 bg-navy-800 px-1.5 py-0.5 rounded-md">{post.reactions?.insightful || 0}</span>
            </button>

            <button
              onClick={() => react("idea")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-abyss border border-navy-800 hover:border-blue-500/30 hover:bg-navy-800/50 text-slate-300 hover:text-white transition-all group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">🚀</span>
              <span className="text-xs font-mono text-slate-400">Good Idea</span>
              <span className="text-xs font-mono text-blue-400 bg-navy-800 px-1.5 py-0.5 rounded-md">{post.reactions?.idea || 0}</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-navy-700 to-transparent mb-8" />

        {/* Comments Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-lg font-semibold text-white">Discussion</h2>
            {comments.length > 0 && (
              <span className="text-xs font-mono text-slate-500 bg-navy-800 px-2 py-0.5 rounded-full border border-navy-700">
                {comments.length}
              </span>
            )}
          </div>

          {/* Comment input */}
          <div className="bg-abyss border border-navy-800 rounded-2xl p-4 mb-6">
            <textarea
              className="w-full min-h-[100px] text-sm leading-relaxed resize-none placeholder:text-slate-600 focus:ring-0 bg-transparent !border-0 !shadow-none p-0"
              placeholder="Share your thoughts on this reflection..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end pt-3 border-t border-navy-800">
              <button
                onClick={addComment}
                disabled={!newComment.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all"
              >
                Comment
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Comments list */}
          <div className="space-y-3">
            {comments.map((c, index) => (
              <div
                key={c._id}
                className="bg-abyss border border-navy-800 rounded-xl p-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-[10px] font-mono text-blue-200 flex-shrink-0">
                    U
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(c.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed pl-8">{c.text}</p>
              </div>
            ))}
          </div>

          {comments.length === 0 && (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm">No comments yet. Start the discussion!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
