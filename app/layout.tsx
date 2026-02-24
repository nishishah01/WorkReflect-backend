"use client";

import { clearSession, getToken, getUser } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import UpgradeModal from "../components/UpgradeModal";
import "./globals.css";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [plan, setPlan] = useState<"free" | "pro" | "enterprise">("free");
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Load logged-in user from sessionStorage (per-tab) or localStorage (fallback)
  useEffect(() => {
    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
    }

    // Fetch subscription plan
    const token = getToken();
    if (token) {
      fetch("http://localhost:5000/api/stripe/status", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setPlan(d.plan || "free"))
        .catch(() => setPlan("free"));
    }
  }, []);

  // Logout function — clears both sessionStorage and localStorage
  const logout = () => {
    clearSession();
    window.location.href = "/login";
  };

  const isPro = plan !== "free";

  return (
    <html lang="en">
      <body className="bg-void text-slate-100 antialiased">
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

        <div className="flex h-screen overflow-hidden">

          {/* ================= SIDEBAR ================= */}
          <aside className="w-64 bg-abyss border-r border-navy-800 flex flex-col">

            {/* Logo */}
            <div className="p-6 border-b border-navy-800">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-white">Reflect AI</h1>
                  <p className="text-[10px] text-slate-500">Internal Platform</p>
                </div>
                {isPro && (
                  <span style={{ background: "linear-gradient(135deg,#1e3464,#142040)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "20px", padding: "3px 9px", fontSize: "9px", color: "#93c5fd", fontFamily: "JetBrains Mono,monospace", letterSpacing: "0.08em", fontWeight: 700 }}>
                    PRO
                  </span>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
              {/* Admin */}
              {user?.role === "admin" && (
                <>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-navy-800 text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <span>📊</span>
                    <span>Admin Dashboard</span>
                  </Link>
                  <div className="my-2 border-t border-navy-800" />
                </>
              )}

              {/* Core */}
              <p className="px-3 pt-1 pb-2 text-[10px] font-mono text-slate-600 uppercase tracking-widest">Core</p>

              <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-navy-800 text-slate-300 hover:text-white transition-colors">
                <span>📰</span>
                <span>Feed</span>
              </Link>

              <Link href="/create" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-navy-800 text-slate-300 hover:text-white transition-colors">
                <span>✏️</span>
                <span>Write Reflection</span>
              </Link>

              {/* Divider */}
              <div className="my-3 border-t border-navy-800" />

              {/* Premium */}
              <p className="px-3 pt-1 pb-2 text-[10px] font-mono text-slate-600 uppercase tracking-widest">Premium</p>

              {/* Live Rooms */}
              {
                isPro ? (
                  <Link
                    href="/live-rooms"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-navy-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <span>🎙</span>
                    <span className="flex-1">Live Rooms</span>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", flexShrink: 0, display: "inline-block" }} />
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-navy-800 text-slate-500 hover:text-slate-300 transition-colors text-left"
                  >
                    <span>🎙</span>
                    <span className="flex-1">Live Rooms</span>
                    <span style={{ background: "linear-gradient(135deg,#d97706,#f59e0b)", borderRadius: "20px", padding: "2px 7px", fontSize: "9px", color: "#fff", fontWeight: 700, fontFamily: "JetBrains Mono,monospace", letterSpacing: "0.06em", flexShrink: 0 }}>
                      PRO
                    </span>
                  </button>
                )
              }

              {/* Upgrade CTA for free users */}
              {!isPro && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left"
                  style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.08),rgba(37,99,235,0.08))", border: "1px solid rgba(124,58,237,0.15)", color: "#a78bfa", borderRadius: "10px" }}
                >
                  <span>💎</span>
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>Upgrade to Pro</span>
                </button>
              )}

              <div className="my-3 border-t border-navy-800" />

              <p className="px-3 pt-1 pb-2 text-[10px] font-mono text-slate-600 uppercase tracking-widest">Other</p>

              <Link href="/podcast/create" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-navy-800 text-slate-300 hover:text-white transition-colors">
                <span>🎧</span>
                <span>Podcast Upload</span>
              </Link>
            </nav>

            {/* ================= USER FOOTER ================= */}
            <div
              className="p-4 border-t border-navy-800 relative"
              onMouseEnter={() => setShowMenu(true)}
              onMouseLeave={() => setShowMenu(false)}
            >
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-2 px-2 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize">
                        {user?.role || "Member"}
                      </p>
                    </div>
                  </div>

                  {/* Hover Logout Menu */}
                  {showMenu && (
                    <div className="absolute bottom-14 left-4 bg-navy-900 border border-navy-700 rounded-lg shadow-lg w-36 z-50">
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-navy-800 rounded-lg"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  <Link
                    href="/login"
                    className="text-xs text-blue-400"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="text-xs text-blue-400"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

          </aside>

          {/* ================= MAIN CONTENT ================= */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}
