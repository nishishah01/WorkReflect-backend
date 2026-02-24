"use client";
import { getToken } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useState } from "react";


export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    let url = "http://localhost:5000/api/posts";
    if (selectedTag) {
      url += `?tag=${selectedTag}`;
    }

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.status === 401) {
          sessionStorage.clear();
          localStorage.clear();
          window.location.href = "/login";
          return [];
        }
        if (!res.ok) {
          console.error("Failed to fetch posts", res.status);
          return [];
        }
        return res.json();
      })
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching posts:", error);
        setPosts([]);
        setLoading(false);
      });
  }, [selectedTag]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void p-8 lg:p-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent max-w-[60px]" />
          <span className="text-[11px] font-mono text-blue-400/70 uppercase tracking-widest">
            Internal
          </span>
        </div>

        <h1 className="font-display text-4xl lg:text-5xl text-white leading-tight">
          Reflections
        </h1>

        <p className="mt-2 text-slate-400 text-sm font-sans max-w-lg">
          A space for your team&apos;s thoughts, learnings, and conversations.
        </p>
      </div>

      {/* Active Tag Filter */}
      {selectedTag && (
        <div className="mb-6 flex items-center gap-3 p-3 rounded-xl bg-navy-800/50 border border-navy-700 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs text-slate-400">Filtering by</span>

          <span className="tag-pill">#{selectedTag}</span>

          <button
            onClick={() => setSelectedTag(null)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors ml-1"
          >
            Clear
          </button>
        </div>
      )}

      {/* Post Count */}
      {posts.length > 0 && (
        <p className="text-xs font-mono text-slate-500 mb-5">
          {posts.length} {posts.length === 1 ? "entry" : "entries"} found
        </p>
      )}

      {/* Post Grid */}
      <div className="space-y-4">
        {posts.map((post: any, index: number) => (
          <Link key={post._id} href={`/post/${post._id}`}>
            <div
              className="group relative bg-abyss border border-navy-800 rounded-2xl p-6 card-hover cursor-pointer overflow-hidden"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white group-hover:text-blue-100 transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Posted by {post.createdBy?.name || "Unknown"}
                  </p>
                </div>

                <div className="text-xs text-slate-500 font-mono whitespace-nowrap">
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedTag(tag);
                      }}
                      className="tag-pill cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Content preview */}
              <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                {post.content}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-slate-400 font-medium mb-1">
            No reflections yet
          </p>
          <p className="text-slate-600 text-sm">
            Be the first to share your thoughts.
          </p>

          <Link href="/create">
            <button className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors">
              Write a reflection
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
