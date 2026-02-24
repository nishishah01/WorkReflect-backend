"use client";

import { getToken } from "@/lib/auth";
import { useState } from "react";


interface UpgradeModalProps {
    onClose: () => void;
}

const FEATURES = [
    { icon: "🎙", label: "Start & host Live Audio Rooms" },
    { icon: "🎥", label: "Optional Video Rooms (townhalls, Q&A)" },
    { icon: "✋", label: "Raise hand to speak + live chat" },
    { icon: "🤖", label: "AI transcription & session summaries" },
    { icon: "🎯", label: "Auto-extract decisions & action items" },
    { icon: "💾", label: "Save & replay past sessions" },
    { icon: "📊", label: "Advanced analytics dashboard" },
];

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpgrade = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            if (!token) {
                window.location.href = "/login";
                return;
            }
            const res = await fetch("http://localhost:5000/api/stripe/create-checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create checkout");
            window.location.href = data.url;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(3,5,15,0.85)", backdropFilter: "blur(12px)" }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "linear-gradient(135deg, #080e1e 60%, #0d1733 100%)",
                    border: "1px solid #142040",
                    borderRadius: "24px",
                    boxShadow: "0 32px 80px rgba(59,130,246,0.15), 0 0 0 1px rgba(59,130,246,0.08)",
                }}
            >
                {/* Glow accent */}
                <div
                    style={{
                        position: "absolute",
                        top: -1,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "60%",
                        height: "2px",
                        background: "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent)",
                        borderRadius: "999px",
                    }}
                />

                <div className="p-8">
                    {/* Badge */}
                    <div className="flex items-center gap-2 mb-6">
                        <div
                            style={{
                                background: "linear-gradient(135deg, #d97706, #f59e0b)",
                                borderRadius: "8px",
                                padding: "6px 10px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <span style={{ fontSize: "14px" }}>💎</span>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "0.08em", fontFamily: "JetBrains Mono, monospace" }}>
                                PRO FEATURE
                            </span>
                        </div>
                    </div>

                    {/* Heading */}
                    <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", marginBottom: "8px", lineHeight: 1.2, fontFamily: "DM Serif Display, serif" }}>
                        Unlock Live Rooms 🎙
                    </h2>
                    <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "28px", lineHeight: 1.6 }}>
                        Host real-time audio &amp; video sessions for your team with AI-powered transcription and summaries.
                    </p>

                    {/* Price */}
                    <div
                        style={{
                            background: "rgba(59,130,246,0.06)",
                            border: "1px solid rgba(59,130,246,0.15)",
                            borderRadius: "16px",
                            padding: "20px",
                            marginBottom: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <div>
                            <p style={{ fontSize: "11px", color: "#3b82f6", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>
                                Pro Plan
                            </p>
                            <p style={{ fontSize: "32px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                                ₹499
                                <span style={{ fontSize: "14px", fontWeight: 400, color: "#64748b" }}>/month</span>
                            </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "12px", color: "#22d3ee", fontWeight: 600 }}>✓ Cancel anytime</p>
                            <p style={{ fontSize: "11px", color: "#475569" }}>No contracts</p>
                        </div>
                    </div>

                    {/* Features */}
                    <ul style={{ marginBottom: "28px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {FEATURES.map((f) => (
                            <li key={f.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "16px", flexShrink: 0 }}>{f.icon}</span>
                                <span style={{ fontSize: "13px", color: "#94a3b8" }}>{f.label}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Error */}
                    {error && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px", marginBottom: "16px", color: "#f87171", fontSize: "13px" }}>
                            {error}
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "12px",
                            background: loading ? "#1e3464" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "15px",
                            border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "opacity 0.2s",
                            boxShadow: loading ? "none" : "0 8px 32px rgba(124,58,237,0.3)",
                        }}
                    >
                        {loading ? (
                            <>
                                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                Redirecting to checkout...
                            </>
                        ) : (
                            <>💎 Upgrade to Pro — ₹499/mo</>
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        style={{ width: "100%", marginTop: "12px", padding: "10px", background: "transparent", border: "none", color: "#475569", fontSize: "13px", cursor: "pointer" }}
                    >
                        Maybe later
                    </button>
                </div>

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}
