"use client";
import { useState } from "react";

export default function CreatePodcast() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let uploadedAudioUrl = "";

    if (audioFile) {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const uploadRes = await fetch(
        "http://localhost:5000/api/posts/upload-audio",
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadData = await uploadRes.json();
      uploadedAudioUrl = uploadData.audioUrl;
    }

    await fetch("http://localhost:5000/api/posts/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content: description,
        tags: ["podcast"],
        audioUrl: uploadedAudioUrl,
      }),
    });

    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-void p-8 lg:p-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent max-w-[60px]" />
            <span className="text-[11px] font-mono text-blue-400/70 uppercase tracking-widest">Podcast</span>
          </div>
          <h1 className="font-display text-4xl text-white">Host Internal Podcast</h1>
          <p className="mt-2 text-slate-400 text-sm">Record your team discussions and share them with everyone.</p>
        </div>

        {/* Form card */}
        <div className="bg-abyss border border-navy-800 rounded-2xl p-8 space-y-6">

          {/* Podcast visual indicator */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-navy-800/30 border border-blue-800/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-700/30 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-200">Internal Podcast Episode</p>
              <p className="text-xs text-slate-500">Will be tagged as <span className="font-mono text-blue-400/80">#podcast</span> automatically</p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
              Episode Title <span className="text-blue-500">*</span>
            </label>
            <input
              className="w-full rounded-xl px-4 py-3 text-base font-sans placeholder:text-slate-600 focus:ring-0"
              placeholder="e.g. Engineering Sync — Week 12"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
              Description / Discussion Topic
            </label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-base font-sans placeholder:text-slate-600 min-h-[140px] resize-y leading-relaxed focus:ring-0"
              placeholder="What was discussed? Key takeaways, agenda, or summary..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Audio Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
              Audio File <span className="text-blue-500">*</span>
            </label>
            <label className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-navy-700 bg-navy-900/30 cursor-pointer hover:border-blue-500/40 hover:bg-navy-800/40 transition-all group text-center">
              <div className="w-12 h-12 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center group-hover:border-blue-500/30 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 group-hover:text-blue-400 transition-colors">
                  <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
              </div>
              {audioFile ? (
                <div>
                  <p className="text-sm font-medium text-blue-300">{audioFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(audioFile.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-400 font-medium">Drop your audio here or click to browse</p>
                  <p className="text-xs text-slate-600 mt-1">MP3, WAV, M4A, OGG supported</p>
                </div>
              )}
              <input
                type="file"
                accept="audio/*"
                className="sr-only"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-navy-700 to-transparent" />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Cancel
            </a>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30"
            >
              {isSubmitting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/>
                  </svg>
                  Publishing...
                </>
              ) : (
                <>
                  Publish Podcast
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
