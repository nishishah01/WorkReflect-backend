"use client";

import { getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";


export default function CreateReflection() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Add a tag on Enter or comma
    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const trimmed = tagInput.trim().toLowerCase().replace(/^#/, "");
            if (trimmed && !tags.includes(trimmed)) {
                setTags([...tags, trimmed]);
            }
            setTagInput("");
        } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

    // Upload audio to backend, get back a URL
    const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAudioFile(file);
        setIsUploadingAudio(true);

        try {
            const formData = new FormData();
            formData.append("audio", file);

            const res = await fetch("http://localhost:5000/api/posts/upload-audio", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Audio upload failed");
            const data = await res.json();
            setAudioUrl(data.audioUrl);
        } catch (err) {
            console.error(err);
            setError("Failed to upload audio. You can still submit without it.");
        } finally {
            setIsUploadingAudio(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim() || !content.trim()) {
            setError("Title and content are required.");
            return;
        }

        setIsSubmitting(true);

        try {
            const token = getToken();
            if (!token) {
                router.push("/login");
                return;
            }

            const res = await fetch("http://localhost:5000/api/posts/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    tags,
                    ...(audioUrl ? { audioUrl } : {}),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create reflection");
            }

            const data = await res.json();
            router.push(`/post/${data.post._id}`);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    return (
        <div className="min-h-screen bg-void">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-void/80 backdrop-blur-xl border-b border-navy-800 px-8 py-3 flex items-center gap-4">
                <a
                    href="/"
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Feed
                </a>
                <div className="w-px h-4 bg-navy-700" />
                <span className="text-xs text-slate-500">New Reflection</span>
            </div>

            <div className="max-w-3xl mx-auto px-8 py-10">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent max-w-[60px]" />
                        <span className="text-[11px] font-mono text-blue-400/70 uppercase tracking-widest">
                            New Entry
                        </span>
                    </div>
                    <h1 className="font-display text-4xl text-white leading-tight">
                        Write a Reflection
                    </h1>
                    <p className="mt-2 text-slate-400 text-sm max-w-md">
                        Share your thoughts, learnings, or insights with your team.
                    </p>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div className="group">
                        <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">
                            Title <span className="text-blue-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="reflection-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full text-lg font-medium rounded-xl px-4 py-3 bg-abyss border border-navy-800 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:outline-none transition-colors"
                            required
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider">
                                Reflection <span className="text-blue-500">*</span>
                            </label>
                            <span className="text-xs font-mono text-slate-600">
                                {wordCount} {wordCount === 1 ? "word" : "words"}
                            </span>
                        </div>
                        <textarea
                            id="reflection-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your thoughts, insights, or learnings here..."
                            rows={12}
                            className="w-full rounded-xl px-4 py-3 bg-abyss border border-navy-800 text-slate-200 placeholder:text-slate-700 focus:border-blue-500/50 focus:outline-none transition-colors resize-none leading-relaxed text-sm"
                            required
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">
                            Tags
                            <span className="ml-2 text-slate-600 normal-case font-sans">
                                — press Enter or , to add
                            </span>
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-abyss border border-navy-800 focus-within:border-blue-500/50 transition-colors min-h-[52px]">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="flex items-center gap-1.5 bg-blue-900/30 border border-blue-800/40 text-blue-300 text-xs font-mono px-2.5 py-1 rounded-full"
                                >
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="text-blue-400/60 hover:text-red-400 transition-colors leading-none"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                id="reflection-tags"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder={tags.length === 0 ? "e.g. learning, teamwork, product" : ""}
                                className="flex-1 min-w-[140px] bg-transparent border-0 shadow-none text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none p-0 !border-0 !shadow-none"
                                style={{ background: "transparent" }}
                            />
                        </div>
                    </div>

                    {/* Audio upload */}
                    <div>
                        <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">
                            Audio (optional)
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative flex items-center gap-4 p-4 rounded-xl border border-dashed cursor-pointer transition-all
                ${audioFile
                                    ? "border-blue-500/40 bg-blue-900/10"
                                    : "border-navy-700 bg-abyss hover:border-navy-600 hover:bg-navy-900/30"
                                }`}
                        >
                            <div className="w-10 h-10 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center flex-shrink-0">
                                {isUploadingAudio ? (
                                    <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                                        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                {audioFile ? (
                                    <>
                                        <p className="text-sm text-blue-300 font-medium truncate">{audioFile.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {isUploadingAudio ? "Uploading..." : audioUrl ? "✓ Uploaded successfully" : "Upload failed"}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-slate-400">Attach a voice note or recording</p>
                                        <p className="text-xs text-slate-600 mt-0.5">MP3, WAV, M4A up to 50MB</p>
                                    </>
                                )}
                            </div>
                            {audioFile && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAudioFile(null);
                                        setAudioUrl(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={handleAudioChange}
                            />
                        </div>
                    </div>

                    {/* AI note */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-900/10 border border-blue-800/20">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-blue-300 mb-0.5">AI Feedback</p>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                After you publish, our AI will automatically generate insights and a summary of your reflection.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                        <a
                            href="/"
                            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            id="submit-reflection-btn"
                            disabled={isSubmitting || isUploadingAudio || !title.trim() || !content.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    Publish Reflection
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}