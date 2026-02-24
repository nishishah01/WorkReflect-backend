"use client";

import { getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";


type ChatMsg = { id: string; user: string; text: string; time: string };

export default function LiveRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: roomId } = use(params);
    const router = useRouter();

    const containerRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false); // prevents double-init in React StrictMode
    const zegoRef = useRef<any>(null);    // stable ref so cleanup always works

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joined, setJoined] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [userName, setUserName] = useState("You");

    // Chat state
    const [chatMsg, setChatMsg] = useState("");
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Raise hand state
    const [handRaised, setHandRaised] = useState(false);
    const [muted, setMuted] = useState(false);

    const token = getToken();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!token) { router.push("/login"); return; }
        // Prevent React StrictMode double-invoke
        if (initializedRef.current) return;
        initializedRef.current = true;

        const initRoom = async () => {
            try {
                // Get ZEGOCLOUD token from backend
                const res = await fetch("http://localhost:5000/api/rooms/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ roomId }),
                });

                const data = await res.json();

                if (!res.ok) {
                    if (data.error === "premium_required") {
                        setError("This is a Pro feature. Upgrade to join Live Rooms.");
                        setLoading(false);
                        return;
                    }
                    throw new Error(data.error || "Failed to get room token");
                }

                setUserName(data.userName || "You");
                setIsHost(!!data.isHost);

                // If ZEGOCLOUD not configured, run in demo mode
                if (data.demo) {
                    setIsDemo(true);
                    setJoined(true);
                    setLoading(false);
                    setMessages([
                        { id: "1", user: "System", text: "🛠 Demo mode — ZEGOCLOUD keys not configured yet. Live audio is disabled.", time: new Date().toLocaleTimeString() },
                        { id: "2", user: "System", text: "Your ZEGO_APP_ID and ZEGO_SERVER_SECRET are already set in .env. Restart the backend to activate them.", time: new Date().toLocaleTimeString() },
                    ]);
                    return;
                }

                // Dynamically import ZEGOCLOUD SDK (client-side only)
                const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

                // Generate kit token using server-generated Token04
                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                    data.appId,
                    data.token,
                    roomId,
                    data.userId,
                    data.userName
                );

                const zp = ZegoUIKitPrebuilt.create(kitToken);
                zegoRef.current = zp;

                zp.joinRoom({
                    container: containerRef.current!,
                    // VideoConference mode supports: host, raise hand, live chat,
                    // mute/unmute, participant list, admin moderation — all built-in
                    scenario: {
                        mode: ZegoUIKitPrebuilt.VideoConference,
                    },
                    showRoomTimer: true,
                    showLeaveRoomConfirmDialog: false,
                    turnOnCameraWhenJoining: false,   // start with camera off (user can enable)
                    turnOnMicrophoneWhenJoining: !!data.isHost, // host starts unmuted
                    showMyCameraToggleButton: true,
                    showMyMicrophoneToggleButton: true,
                    showAudioVideoSettingsButton: true,
                    showScreenSharingButton: true,
                    showTextChat: true,
                    showUserList: true,
                    maxUsers: 50,
                    layout: "Auto",
                    onLeaveRoom: () => {
                        router.push("/live-rooms");
                    },
                    onUserAvatarSetter: (userList: any[]) => {
                        userList.forEach((u) => {
                            u.setUserAvatar(
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(u.userName)}&background=1e3464&color=93c5fd&bold=true&size=128`
                            );
                        });
                    },
                });

                setJoined(true);
                setLoading(false);
            } catch (err: any) {
                setError(err.message || "Failed to join room");
                setLoading(false);
            }
        };

        initRoom();

        return () => {
            if (zegoRef.current) {
                try { zegoRef.current.destroy(); } catch { /* ignore */ }
                zegoRef.current = null;
            }
        };
    }, []);

    // Chat (used only in demo mode; ZEGO has built-in chat in real mode)
    const sendChat = () => {
        if (!chatMsg.trim()) return;
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                user: userName,
                text: chatMsg.trim(),
                time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            },
        ]);
        setChatMsg("");
    };

    const handleLeave = () => {
        if (zegoRef.current) {
            try { zegoRef.current.destroy(); } catch { /* ignore */ }
            zegoRef.current = null;
        }
        router.push("/live-rooms");
    };

    const toggleMute = () => setMuted((m) => !m);
    const toggleHand = () => setHandRaised((h) => !h);

    return (
        <div style={{ height: "100vh", background: "#050810", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* ── Top bar ── */}
            <div style={{
                height: 56,
                background: "#080e1e",
                borderBottom: "1px solid #0d1733",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                flexShrink: 0,
                zIndex: 10,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }} />
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: "15px" }}>🎙 Live Room</span>
                    <span style={{ fontSize: "11px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{roomId}</span>
                    {isHost && (
                        <span style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "20px", padding: "2px 10px", fontSize: "10px", color: "#4ade80", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                            HOST
                        </span>
                    )}
                </div>
                <button
                    onClick={handleLeave}
                    style={{
                        padding: "8px 16px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: "8px",
                        color: "#f87171",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    ← Leave Room
                </button>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                {/* ── ZEGOCLOUD container ── */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

                    {/* Loading overlay */}
                    {loading && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", zIndex: 5, background: "#050810" }}>
                            <div style={{ width: 48, height: 48, border: "3px solid rgba(59,130,246,0.2)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                            <p style={{ color: "#64748b", fontSize: "14px", fontFamily: "JetBrains Mono, monospace" }}>Connecting to room...</p>
                        </div>
                    )}

                    {/* Error overlay */}
                    {error && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", padding: "32px", textAlign: "center", background: "#050810" }}>
                            <div style={{ fontSize: "48px" }}>🔒</div>
                            <p style={{ color: "#f87171", fontWeight: 600, fontSize: "18px" }}>{error}</p>
                            <button
                                onClick={() => router.push("/live-rooms")}
                                style={{ padding: "12px 28px", background: "linear-gradient(135deg, #7c3aed, #2563eb)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                            >
                                View Plans & Upgrade
                            </button>
                        </div>
                    )}

                    {/* ZEGOCLOUD mounts here (fills the div in real mode) */}
                    <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

                    {/* Demo mode overlay */}
                    {isDemo && joined && !loading && !error && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "24px", padding: "32px", background: "#050810" }}>
                            {/* Animated waveform */}
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", height: "60px" }}>
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: "6px",
                                            background: "linear-gradient(to top, #3b82f6, #8b5cf6)",
                                            borderRadius: "3px",
                                            animation: `wave 1.2s ease-in-out ${i * 0.1}s infinite alternate`,
                                            minHeight: "8px",
                                        }}
                                    />
                                ))}
                            </div>

                            <div style={{ textAlign: "center" }}>
                                <p style={{ color: "#93c5fd", fontWeight: 700, fontSize: "22px", marginBottom: "8px" }}>
                                    🎙 Demo Mode Active
                                </p>
                                <p style={{ color: "#475569", fontSize: "14px", maxWidth: "420px", lineHeight: 1.7 }}>
                                    ZEGOCLOUD is configured in your <code style={{ color: "#67e8f9", fontFamily: "JetBrains Mono, monospace" }}>.env</code>. Restart the backend server to activate real-time audio & video.
                                </p>
                            </div>

                            {/* Pro features list */}
                            <div style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "16px", padding: "24px", maxWidth: "440px", width: "100%" }}>
                                <p style={{ color: "#3b82f6", fontSize: "11px", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Pro Features Active</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {[
                                        { icon: "🎙", text: "Host can start & manage a live session" },
                                        { icon: "👥", text: "Team members can join instantly" },
                                        { icon: "✋", text: "Raise hand to request to speak" },
                                        { icon: "💬", text: "Live chat during session" },
                                        { icon: "🔇", text: "Mute / unmute controls for all" },
                                        { icon: "🛡", text: "Admin moderation & participant control" },
                                    ].map((f) => (
                                        <div key={f.text} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontSize: "16px" }}>{f.icon}</span>
                                            <span style={{ color: "#94a3b8", fontSize: "13px" }}>{f.text}</span>
                                            <span style={{ marginLeft: "auto", color: "#22d3ee", fontSize: "11px" }}>✓</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Demo controls */}
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    onClick={toggleMute}
                                    style={{
                                        padding: "10px 20px",
                                        background: muted ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.1)",
                                        border: muted ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(59,130,246,0.3)",
                                        borderRadius: "10px",
                                        color: muted ? "#f87171" : "#93c5fd",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {muted ? "🔇 Unmute" : "🎤 Mute"}
                                </button>
                                <button
                                    onClick={toggleHand}
                                    style={{
                                        padding: "10px 20px",
                                        background: handRaised ? "rgba(234,179,8,0.15)" : "rgba(59,130,246,0.05)",
                                        border: handRaised ? "1px solid rgba(234,179,8,0.4)" : "1px solid rgba(59,130,246,0.15)",
                                        borderRadius: "10px",
                                        color: handRaised ? "#fbbf24" : "#64748b",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    ✋ {handRaised ? "Lower Hand" : "Raise Hand"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Chat Sidebar (demo mode only; ZEGO has built-in chat in real mode) ── */}
                {isDemo && joined && (
                    <div style={{
                        width: "300px",
                        background: "#080e1e",
                        borderLeft: "1px solid #0d1733",
                        display: "flex",
                        flexDirection: "column",
                        flexShrink: 0,
                    }}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #0d1733", display: "flex", alignItems: "center", gap: "8px" }}>
                            <p style={{ color: "#94a3b8", fontWeight: 600, fontSize: "13px" }}>💬 Live Chat</p>
                            <span style={{ marginLeft: "auto", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "20px", padding: "2px 8px", fontSize: "9px", color: "#4ade80", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>DEMO</span>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {messages.length === 0 && (
                                <p style={{ color: "#334155", fontSize: "12px", textAlign: "center", marginTop: "20px" }}>Chat will appear here...</p>
                            )}
                            {messages.map((m) => (
                                <div key={m.id}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #1e3464, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#93c5fd", fontWeight: 700, flexShrink: 0 }}>
                                            {m.user[0]?.toUpperCase()}
                                        </div>
                                        <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 600 }}>{m.user}</span>
                                        <span style={{ color: "#334155", fontSize: "10px", fontFamily: "JetBrains Mono, monospace", marginLeft: "auto" }}>{m.time}</span>
                                    </div>
                                    <p style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.5, paddingLeft: "26px" }}>{m.text}</p>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div style={{ padding: "12px 16px", borderTop: "1px solid #0d1733" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                    value={chatMsg}
                                    onChange={(e) => setChatMsg(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                                    placeholder="Say something..."
                                    style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", fontSize: "13px", background: "#0d1733", border: "1px solid #142040", color: "#e2e8f0", outline: "none" }}
                                />
                                <button
                                    onClick={sendChat}
                                    disabled={!chatMsg.trim()}
                                    style={{ padding: "8px 12px", background: chatMsg.trim() ? "#2563eb" : "#1e3464", border: "none", borderRadius: "8px", color: "#fff", cursor: chatMsg.trim() ? "pointer" : "default", fontSize: "14px", flexShrink: 0, transition: "background 0.15s" }}
                                >
                                    ↩
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin  { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @keyframes wave  { from { height: 8px; } to { height: 52px; } }
            `}</style>
        </div>
    );
}
