"use client";

import { getToken, getUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────
interface Overview {
    totalPosts: number;
    totalComments: number;
    totalMembers: number;
    recentPosts: number;
    totalReactions: number;
}

interface TopTopic {
    tag: string;
    count: number;
}

interface Member {
    name: string;
    email: string;
    role: string;
    posts: number;
    comments: number;
    total: number;
}

interface SentimentPoint {
    week: string;
    agree: number;
    insightful: number;
    idea: number;
    posts: number;
}

interface GrowthPoint {
    date: string;
    posts: number;
    cumulative: number;
}

// ─── Colour palette ───────────────────────────────────────────────────────
const TOPIC_COLORS = [
    "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
    "#ef4444", "#ec4899", "#84cc16", "#f97316", "#6366f1",
];

// ─── Custom tooltip wrapper ───────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-navy-900 border border-navy-700 rounded-xl px-4 py-3 shadow-xl text-xs">
            {label && <p className="text-slate-400 mb-1 font-mono">{label}</p>}
            {payload.map((entry: any) => (
                <p key={entry.name} style={{ color: entry.color }} className="font-medium">
                    {entry.name}: <span className="text-white">{entry.value}</span>
                </p>
            ))}
        </div>
    );
};

// ─── Stat card ────────────────────────────────────────────────────────────
function StatCard({
    label,
    value,
    icon,
    accent,
    sub,
}: {
    label: string;
    value: number | string;
    icon: string;
    accent: string;
    sub?: string;
}) {
    return (
        <div
            className="relative bg-abyss border border-navy-800 rounded-2xl p-5 overflow-hidden"
            style={{ boxShadow: `0 0 40px ${accent}10` }}
        >
            {/* glow blob */}
            <div
                className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20"
                style={{ background: accent }}
            />
            <div className="relative">
                <span className="text-2xl">{icon}</span>
                <p className="mt-3 text-3xl font-bold text-white tracking-tight">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{label}</p>
                {sub && <p className="mt-0.5 text-[10px] font-mono text-slate-500">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Section wrapper ─────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="bg-abyss border border-navy-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
                <span className="text-lg">{icon}</span>
                <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
            </div>
            {children}
        </div>
    );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────
function Skeleton({ h = "h-40" }: { h?: string }) {
    return <div className={`${h} bg-navy-800/50 rounded-xl animate-pulse`} />;
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [overview, setOverview] = useState<Overview | null>(null);
    const [topics, setTopics] = useState<TopTopic[]>([]);
    const [participation, setParticipation] = useState<Member[]>([]);
    const [sentiment, setSentiment] = useState<SentimentPoint[]>([]);
    const [growth, setGrowth] = useState<GrowthPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Invite code state
    const [inviteCode, setInviteCode] = useState("");
    const [orgName, setOrgName] = useState("");
    const [copied, setCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    useEffect(() => {
        const token = getToken();
        const user = getUser();

        if (!token) { window.location.href = "/login"; return; }
        if (user?.role !== "admin") { window.location.href = "/"; return; }

        const headers = { Authorization: `Bearer ${token}` };
        const base = "http://localhost:5000/api/analytics";

        // Fetch analytics + org info in parallel
        Promise.all([
            fetch(`${base}/overview`, { headers }).then((r) => r.json()),
            fetch(`${base}/top-topics`, { headers }).then((r) => r.json()),
            fetch(`${base}/participation`, { headers }).then((r) => r.json()),
            fetch(`${base}/sentiment`, { headers }).then((r) => r.json()),
            fetch(`${base}/growth`, { headers }).then((r) => r.json()),
            fetch("http://localhost:5000/api/org/my", { headers }).then((r) => r.json()),
        ])
            .then(([ov, tp, pt, sn, gr, org]) => {
                setOverview(ov);
                setTopics(Array.isArray(tp) ? tp : []);
                setParticipation(Array.isArray(pt) ? pt : []);
                setSentiment(Array.isArray(sn) ? sn : []);
                setGrowth(Array.isArray(gr) ? gr : []);
                if (org?.inviteCode) setInviteCode(org.inviteCode);
                if (org?.name) setOrgName(org.name);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load analytics. Make sure the backend is running.");
                setLoading(false);
            });
    }, []);

    const copyCode = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const regenerateCode = async () => {
        if (!confirm("Regenerate invite code? The old code will stop working immediately.")) return;
        setRegenerating(true);
        try {
            const token = getToken();
            const res = await fetch("http://localhost:5000/api/org/regenerate-invite", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.inviteCode) setInviteCode(data.inviteCode);
        } catch { /* silent */ } finally {
            setRegenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-void p-8 lg:p-12">
                <div className="mb-10">
                    <div className="h-8 w-48 bg-navy-800/50 rounded-xl animate-pulse mb-3" />
                    <div className="h-4 w-64 bg-navy-800/30 rounded-xl animate-pulse" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h="h-28" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h="h-64" />)}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-400 text-sm">
                {error}
            </div>
        );
    }

    const engagementRate =
        overview && overview.totalMembers > 0
            ? Math.round((participation.filter((m) => m.total > 0).length / overview.totalMembers) * 100)
            : 0;

    return (
        <div className="min-h-screen bg-void p-8 lg:p-12">

            {/* ── Header ── */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-px w-14 bg-gradient-to-r from-violet-500/40 to-transparent" />
                    <span className="text-[11px] font-mono text-violet-400/70 uppercase tracking-widest">Admin</span>
                </div>
                <h1 className="font-display text-4xl lg:text-5xl text-white leading-tight">
                    Analytics Dashboard
                </h1>
                <p className="mt-2 text-slate-400 text-sm max-w-lg">
                    Monitor engagement, sentiment, and knowledge growth across your organisation.
                </p>
            </div>

            {/* ── Overview stat cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <StatCard label="Total Reflections" value={overview?.totalPosts ?? 0} icon="📝" accent="#3b82f6" sub="All time" />
                <StatCard label="Comments" value={overview?.totalComments ?? 0} icon="💬" accent="#8b5cf6" sub="All time" />
                <StatCard label="Team Members" value={overview?.totalMembers ?? 0} icon="👥" accent="#06b6d4" sub="Organisation" />
                <StatCard label="This Month" value={overview?.recentPosts ?? 0} icon="📅" accent="#10b981" sub="New posts (30d)" />
                <StatCard label="Reactions" value={overview?.totalReactions ?? 0} icon="⚡" accent="#f59e0b" sub="All time" />
            </div>

            {/* ── Invite Code card ── */}
            {inviteCode && (
                <div className="relative bg-abyss border border-violet-500/20 rounded-2xl p-6 mb-8 overflow-hidden"
                    style={{ boxShadow: "0 0 60px #8b5cf610" }}>
                    {/* background glow */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-violet-400 text-lg">🔑</span>
                                <h2 className="text-sm font-semibold text-white">Team Invite Code</h2>
                            </div>
                            <p className="text-xs text-slate-400 mb-4">
                                Share this code with your employees so they can join <span className="text-white font-medium">{orgName}</span>.
                                Keep it private — anyone with this code can register.
                            </p>
                            {/* Code display */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 px-4 py-2.5 bg-navy-800 border border-violet-500/30 rounded-xl">
                                    {inviteCode.split("").map((char, i) => (
                                        <span key={i} className="font-mono text-xl font-bold tracking-widest text-violet-300">
                                            {char}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    onClick={copyCode}
                                    className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all"
                                    style={copied
                                        ? { background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.3)", color: "#34d399" }
                                        : { background: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.3)", color: "#a78bfa" }
                                    }
                                >
                                    {copied ? (
                                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>Copied!</>
                                    ) : (
                                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copy</>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-2">
                            <button
                                onClick={regenerateCode}
                                disabled={regenerating}
                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
                            >
                                {regenerating ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin"><circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                                ) : (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                                )}
                                Regenerate Code
                            </button>
                            <p className="text-[10px] text-slate-600 font-mono">Old code will be invalidated</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

                {/* 📈 Knowledge growth */}
                <Section title="Knowledge Growth Over Time" icon="📈">
                    {growth.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-10">No data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={growth}>
                                <defs>
                                    <linearGradient id="gradCumulative" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradPosts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#142040" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "#475569", fontSize: 10 }}
                                    tickFormatter={(v) => {
                                        const d = new Date(v);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                                <Area
                                    type="monotone"
                                    dataKey="cumulative"
                                    name="Total Posts"
                                    stroke="#3b82f6"
                                    fill="url(#gradCumulative)"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="posts"
                                    name="New Posts/Day"
                                    stroke="#8b5cf6"
                                    fill="url(#gradPosts)"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Section>

                {/* 😊 Sentiment trends */}
                <Section title="Sentiment Trend Analysis" icon="😊">
                    {sentiment.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-10">No data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={sentiment}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#142040" />
                                <XAxis
                                    dataKey="week"
                                    tick={{ fill: "#475569", fontSize: 10 }}
                                    tickFormatter={(v) => {
                                        const d = new Date(v);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                                <Line type="monotone" dataKey="agree" name="✅ Agree" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="insightful" name="💡 Insightful" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="idea" name="🚀 Idea" stroke="#f59e0b" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </Section>

                {/* 🔥 Top topics */}
                <Section title="Most Discussed Topics" icon="🔥">
                    {topics.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-10">No tags found yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={topics} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#142040" horizontal={false} />
                                <XAxis type="number" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis
                                    dataKey="tag"
                                    type="category"
                                    tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                                    width={90}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `#${v}`}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="count" name="Posts" radius={[0, 6, 6, 0]} barSize={14}>
                                    {topics.map((_, index) => (
                                        <Cell key={index} fill={TOPIC_COLORS[index % TOPIC_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Section>

                {/* 👥 Team participation */}
                <Section title="Team Participation Rate" icon="👥">
                    {/* Engagement rate banner */}
                    <div className="mb-5 flex items-center gap-4 p-4 rounded-xl bg-navy-800/50 border border-navy-700">
                        <div className="relative w-14 h-14">
                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                <circle cx="28" cy="28" r="22" fill="none" stroke="#142040" strokeWidth="6" />
                                <circle
                                    cx="28" cy="28" r="22" fill="none"
                                    stroke="#3b82f6" strokeWidth="6"
                                    strokeDasharray={`${2 * Math.PI * 22}`}
                                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - engagementRate / 100)}`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                {engagementRate}%
                            </span>
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">Active Engagement</p>
                            <p className="text-slate-400 text-xs mt-0.5">
                                {participation.filter((m) => m.total > 0).length} of {overview?.totalMembers ?? 0} members contributed
                            </p>
                        </div>
                    </div>

                    {/* Member table */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {participation.map((member, i) => (
                            <div
                                key={member.email}
                                className="flex items-center justify-between py-2 px-3 rounded-lg bg-navy-800/30 border border-navy-800 hover:border-navy-700 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                        style={{ background: TOPIC_COLORS[i % TOPIC_COLORS.length] + "22", color: TOPIC_COLORS[i % TOPIC_COLORS.length] }}
                                    >
                                        {member.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-white truncate">{member.name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono capitalize">{member.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-400 flex-shrink-0">
                                    <span title="Posts">📝 {member.posts}</span>
                                    <span title="Comments">💬 {member.comments}</span>
                                </div>
                            </div>
                        ))}
                        {participation.length === 0 && (
                            <p className="text-slate-500 text-sm text-center py-6">No members yet</p>
                        )}
                    </div>
                </Section>
            </div>

            {/* ── Footer note ── */}
            <p className="text-center text-[11px] font-mono text-slate-600 mt-8">
                Analytics scoped to your organisation · Updated in real-time
            </p>
        </div>
    );
}
