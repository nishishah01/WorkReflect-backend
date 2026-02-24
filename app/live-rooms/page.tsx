"use client";

import { getToken } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import UpgradeModal from "../../components/UpgradeModal";


type Room = {
    id: string;
    title: string;
    type: "audio" | "video";
    hostName: string;
    participants: number;
    createdAt: string;
    live: boolean;
};

type Plan = "free" | "pro" | "enterprise";

export default function LiveRoomsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [plan, setPlan] = useState<Plan>("free");
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newType, setNewType] = useState<"audio" | "video">("audio");
    const [creating, setCreating] = useState(false);
    const [upgraded, setUpgraded] = useState(false);

    const token = getToken();

    // Check if just returned from Stripe — verify session & upgrade plan immediately
    useEffect(() => {
        if (searchParams.get("upgraded") === "true") {
            setUpgraded(true);
            const sessionId = searchParams.get("session_id");
            if (sessionId && token) {
                // Verify with Stripe and upgrade plan in DB
                fetch("http://localhost:5000/api/stripe/verify-session", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ sessionId }),
                })
                    .then((r) => r.json())
                    .then((d) => {
                        if (d.plan === "pro") {
                            setPlan("pro");
                        } else {
                            // Fallback: re-fetch status from DB
                            fetchPlan();
                        }
                    })
                    .catch(() => fetchPlan());
            } else {
                fetchPlan();
            }
        }
    }, []);

    const fetchPlan = async () => {
        if (!token) return;
        try {
            const res = await fetch("http://localhost:5000/api/stripe/status", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setPlan(data.plan || "free");
        } catch {
            setPlan("free");
        }
    };

    const fetchRooms = async () => {
        if (!token) return;
        try {
            const res = await fetch("http://localhost:5000/api/rooms/list", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setRooms(Array.isArray(data) ? data : []);
            }
        } catch {
            setRooms([]);
        }
    };

    useEffect(() => {
        if (!token) { router.push("/login"); return; }
        Promise.all([fetchPlan(), fetchRooms()]).finally(() => setLoading(false));

        // Poll rooms every 15s
        const interval = setInterval(fetchRooms, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateRoom = async () => {
        if (plan === "free") { setShowUpgrade(true); return; }
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            const res = await fetch("http://localhost:5000/api/rooms/create-room", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ title: newTitle.trim(), type: newType }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.error === "premium_required") { setShowUpgrade(true); return; }
                throw new Error(data.error);
            }
            setShowCreate(false);
            setNewTitle("");
            router.push(`/live-rooms/${data.id}`);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleJoinRoom = (room: Room) => {
        if (plan === "free") { setShowUpgrade(true); return; }
        router.push(`/live-rooms/${room.id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-void flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                    <p className="text-slate-500 text-sm font-mono">Loading rooms...</p>
                </div>
            </div>
        );
    }

    const isPro = plan !== "free";

    return (
        <div className="min-h-screen bg-void">
            {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

            {/* Create Room Modal */}
            {showCreate && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center p-4"
                    style={{ background: "rgba(3,5,15,0.85)", backdropFilter: "blur(8px)" }}
                    onClick={() => setShowCreate(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "#080e1e",
                            border: "1px solid #142040",
                            borderRadius: "20px",
                            padding: "32px",
                            width: "100%",
                            maxWidth: "400px",
                        }}
                    >
                        <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "20px", fontFamily: "DM Serif Display, serif" }}>
                            Create a Room
                        </h3>

                        <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                            Room Title
                        </label>
                        <input
                            autoFocus
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                            placeholder="e.g. Weekly Team Sync"
                            style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}
                        />

                        <label style={{ display: "block", fontSize: "11px", color: "#64748b", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                            Room Type
                        </label>
                        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                            {(["audio", "video"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setNewType(t)}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        borderRadius: "10px",
                                        border: newType === t ? "1px solid #3b82f6" : "1px solid #142040",
                                        background: newType === t ? "rgba(59,130,246,0.1)" : "transparent",
                                        color: newType === t ? "#93c5fd" : "#64748b",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {t === "audio" ? "🎙" : "🎥"} {t === "audio" ? "Audio Only" : "Video Room"}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleCreateRoom}
                            disabled={creating || !newTitle.trim()}
                            style={{
                                width: "100%",
                                padding: "13px",
                                borderRadius: "12px",
                                background: creating || !newTitle.trim() ? "#1e3464" : "linear-gradient(135deg, #2563eb, #3b82f6)",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "14px",
                                border: "none",
                                cursor: creating || !newTitle.trim() ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                            }}
                        >
                            {creating ? (
                                <>
                                    <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    Starting...
                                </>
                            ) : (
                                "🎙 Go Live"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Sticky top bar */}
            <div className="sticky top-0 z-10 bg-void/80 backdrop-blur-xl border-b border-navy-800 px-8 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <a href="/" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                        </svg>
                        Feed
                    </a>
                    <div className="w-px h-4 bg-navy-700" />
                    <span className="text-xs text-slate-500">Live Rooms</span>
                </div>

                {isPro ? (
                    <span style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", color: "#93c5fd", fontFamily: "JetBrains Mono, monospace", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", display: "inline-block", animation: "pulse 2s infinite" }} />
                        PRO
                    </span>
                ) : (
                    <button onClick={() => setShowUpgrade(true)} style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", border: "none", borderRadius: "20px", padding: "5px 14px", fontSize: "11px", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.05em" }}>
                        💎 UPGRADE
                    </button>
                )}
            </div>

            <div className="max-w-4xl mx-auto px-8 py-10">
                {/* Success banner if just upgraded */}
                {upgraded && (
                    <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "14px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "22px" }}>🎉</span>
                        <div>
                            <p style={{ color: "#4ade80", fontWeight: 600, fontSize: "14px", marginBottom: "2px" }}>Welcome to Pro!</p>
                            <p style={{ color: "#64748b", fontSize: "12px" }}>You now have full access to Live Rooms and all Pro features.</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent max-w-[60px]" />
                        <span className="text-[11px] font-mono text-blue-400/70 uppercase tracking-widest">Premium</span>
                    </div>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="font-display text-4xl text-white leading-tight mb-2">
                                🎙 Live Rooms
                            </h1>
                            <p className="text-slate-400 text-sm max-w-md">
                                Real-time audio &amp; video sessions for your team. Host a podcast, run a standup, or lead a townhall.
                            </p>
                        </div>
                        {isPro ? (
                            <button
                                onClick={() => setShowCreate(true)}
                                style={{
                                    padding: "12px 24px",
                                    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                                    border: "none",
                                    borderRadius: "14px",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    boxShadow: "0 8px 32px rgba(37,99,235,0.3)",
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                    marginTop: "4px",
                                }}
                            >
                                + Start a Room
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowUpgrade(true)}
                                style={{
                                    padding: "12px 24px",
                                    background: "linear-gradient(135deg, #d97706, #f59e0b)",
                                    border: "none",
                                    borderRadius: "14px",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    boxShadow: "0 8px 32px rgba(217,119,6,0.3)",
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                    marginTop: "4px",
                                }}
                            >
                                💎 Unlock Live Rooms
                            </button>
                        )}
                    </div>
                </div>

                {/* Free plan banner */}
                {!isPro && (
                    <div
                        onClick={() => setShowUpgrade(true)}
                        style={{
                            background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.1))",
                            border: "1px solid rgba(124,58,237,0.25)",
                            borderRadius: "20px",
                            padding: "32px",
                            marginBottom: "32px",
                            cursor: "pointer",
                            transition: "border-color 0.2s",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {/* Blur circles */}
                        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(124,58,237,0.15)", filter: "blur(40px)", pointerEvents: "none" }} />
                        <div style={{ position: "absolute", bottom: -30, left: 60, width: 120, height: 120, borderRadius: "50%", background: "rgba(37,99,235,0.12)", filter: "blur(30px)", pointerEvents: "none" }} />

                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                <span style={{ fontSize: "32px" }}>🔒</span>
                                <div>
                                    <p style={{ color: "#c4b5fd", fontWeight: 700, fontSize: "18px", fontFamily: "DM Serif Display, serif" }}>Live Rooms — Pro Only</p>
                                    <p style={{ color: "#64748b", fontSize: "13px" }}>Upgrade to host and join real-time sessions</p>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
                                {["🎙 Host live audio sessions", "🤖 AI-powered summaries", "✋ Raise hand to speak", "💾 Record & replay sessions", "🎥 Video rooms support", "📊 Team analytics"].map((f) => (
                                    <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "linear-gradient(135deg, #7c3aed, #2563eb)", borderRadius: "12px", color: "#fff", fontWeight: 700, fontSize: "14px" }}>
                                💎 Upgrade to Pro — ₹499/month
                            </div>
                        </div>
                    </div>
                )}

                {/* Live rooms list */}
                {isPro && (
                    <>
                        {/* Live indicator */}
                        <div className="flex items-center gap-3 mb-6">
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }} />
                                <span style={{ fontSize: "12px", color: "#f87171", fontFamily: "JetBrains Mono, monospace", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Live Now</span>
                            </div>
                            <span style={{ fontSize: "12px", color: "#475569" }}>{rooms.length} {rooms.length === 1 ? "room" : "rooms"} active</span>
                        </div>

                        {rooms.length === 0 ? (
                            <div style={{ border: "1px dashed #142040", borderRadius: "20px", padding: "64px 32px", textAlign: "center" }}>
                                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎙</div>
                                <p style={{ color: "#e2e8f0", fontWeight: 600, marginBottom: "8px" }}>No active rooms right now</p>
                                <p style={{ color: "#475569", fontSize: "14px", marginBottom: "24px" }}>Be the first to start a live session for your team.</p>
                                <button
                                    onClick={() => setShowCreate(true)}
                                    style={{ padding: "12px 28px", background: "linear-gradient(135deg, #2563eb, #3b82f6)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
                                >
                                    + Start a Room
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {rooms.map((room) => (
                                    <div
                                        key={room.id}
                                        style={{
                                            background: "#080e1e",
                                            border: "1px solid #142040",
                                            borderRadius: "16px",
                                            padding: "20px 24px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "16px",
                                            transition: "border-color 0.2s, box-shadow 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.3)";
                                            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(59,130,246,0.08)";
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.borderColor = "#142040";
                                            (e.currentTarget as HTMLElement).style.boxShadow = "none";
                                        }}
                                    >
                                        {/* Room type icon */}
                                        <div style={{ width: 48, height: 48, borderRadius: "14px", background: room.type === "video" ? "rgba(124,58,237,0.15)" : "rgba(59,130,246,0.1)", border: room.type === "video" ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                                            {room.type === "video" ? "🎥" : "🎙"}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite", flexShrink: 0 }} />
                                                <h3 style={{ color: "#fff", fontWeight: 600, fontSize: "16px", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.title}</h3>
                                            </div>
                                            <p style={{ color: "#64748b", fontSize: "12px", fontFamily: "JetBrains Mono, monospace" }}>
                                                Hosted by <span style={{ color: "#94a3b8" }}>{room.hostName}</span>
                                                {" · "}
                                                {new Date(room.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleJoinRoom(room)}
                                            style={{ padding: "10px 20px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "10px", color: "#93c5fd", fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.2)"; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.1)"; }}
                                        >
                                            Join →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
        </div>
    );
}
