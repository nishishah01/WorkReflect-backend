"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Reusable icon-prefixed input ─────────────────────────────────────────
function Field({
  label, type = "text", placeholder, value, onChange, icon, suffix,
}: {
  label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  icon: React.ReactNode; suffix?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">{icon}</div>
        <input
          type={type}
          className="w-full rounded-xl pl-9 pr-10 py-3 text-sm placeholder:text-slate-600 focus:ring-0"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
        {suffix && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
    </div>
  );
}

// ─── SVG icons ────────────────────────────────────────────────────────────
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconEmail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconBuilding = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconKey = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);
const IconEye = ({ closed }: { closed?: boolean }) => closed ? (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconSpinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

// ─── Password field with show/hide ─────────────────────────────────────────
function PasswordField({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field
      label={label}
      type={show ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      icon={<IconLock />}
      suffix={
        <button type="button" onClick={() => setShow(!show)} className="text-slate-500 hover:text-slate-300 transition-colors">
          <IconEye closed={show} />
        </button>
      }
    />
  );
}

// ─── Error banner ──────────────────────────────────────────────────────────
function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mt-4">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 flex-shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-xs text-red-400">{msg}</p>
    </div>
  );
}

// ─── Success banner ────────────────────────────────────────────────────────
function SuccessBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-4">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 flex-shrink-0 mt-0.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <p className="text-xs text-emerald-400">{msg}</p>
    </div>
  );
}

// ─── Submit button ─────────────────────────────────────────────────────────
function SubmitButton({ loading, disabled, label, loadingLabel, accent = "blue" }: {
  loading: boolean; disabled: boolean; label: string; loadingLabel: string; accent?: "blue" | "violet";
}) {
  const bg = accent === "violet"
    ? "bg-violet-600 hover:bg-violet-500 shadow-violet-900/30 hover:shadow-violet-900/50"
    : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30 hover:shadow-blue-900/50";

  return (
    <button
      onClick={() => { }} // handled by parent
      type="submit"
      disabled={loading || disabled}
      className={`mt-6 w-full flex items-center justify-center gap-2 py-3 ${bg} disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg`}
    >
      {loading ? <><IconSpinner />{loadingLabel}</> : label}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function RegisterPage() {
  const router = useRouter();

  // Tab: "create" | "join"
  const [tab, setTab] = useState<"create" | "join">("join");

  // Shared fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Create-org specific
  const [company, setCompany] = useState("");

  // Join specific
  const [inviteCode, setInviteCode] = useState("");
  const [resolvedOrg, setResolvedOrg] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ── Live invite-code lookup ──────────────────────────────────────────────
  useEffect(() => {
    setResolvedOrg(null);
    setLookupError("");
    if (inviteCode.trim().length < 8) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/org/lookup/${inviteCode.trim().toUpperCase()}`
        );
        if (res.ok) {
          const data = await res.json();
          setResolvedOrg(data.name);
          setLookupError("");
        } else {
          setResolvedOrg(null);
          setLookupError("Invalid invite code");
        }
      } catch {
        setLookupError("Could not verify code");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inviteCode]);

  // ── Reset state on tab switch ────────────────────────────────────────────
  const switchTab = (t: "create" | "join") => {
    setTab(t);
    setError("");
    setSuccess("");
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const baseValid = name.trim() && email.trim() && password.trim() && confirmPassword.trim() && password === confirmPassword;
  const createValid = !!(baseValid && company.trim());
  const joinValid = !!(baseValid && inviteCode.trim() && resolvedOrg);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createValid) return;
    setError(""); setSuccess(""); setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register/create-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, company }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Registration failed"); return; }
      setSuccess(data.message + " Redirecting to login…");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinValid) return;
    setError(""); setSuccess(""); setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Registration failed"); return; }
      setSuccess(data.message + " Redirecting to login…");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-900/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-900/50 mb-4">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L10.5 6H15L11 9.5L12.5 14.5L8 11.5L3.5 14.5L5 9.5L1 6H5.5L8 1Z" fill="white" fillOpacity="0.95" />
            </svg>
          </div>
          <h1 className="font-display text-2xl text-white leading-none tracking-tight">Reflect AI</h1>
          <p className="text-[11px] font-mono text-blue-400/60 uppercase tracking-widest mt-1">Internal Platform</p>
        </div>

        {/* Card */}
        <div className="bg-abyss border border-navy-800 rounded-2xl p-8 shadow-2xl shadow-black/50">

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-navy-900 border border-navy-800 p-1 mb-7 gap-1">
            <button
              onClick={() => switchTab("join")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === "join"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              🔑 Join with Invite
            </button>
            <button
              onClick={() => switchTab("create")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === "create"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              🏢 Create Organisation
            </button>
          </div>

          {/* Header */}
          <div className="mb-6">
            {tab === "join" ? (
              <>
                <h2 className="font-display text-2xl text-white">Join your team</h2>
                <p className="mt-1 text-slate-400 text-sm">
                  Enter the invite code shared by your admin to get access.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl text-white">Create organisation</h2>
                <p className="mt-1 text-slate-400 text-sm">
                  Set up a new workspace. You'll become the admin and receive an invite code.
                </p>
              </>
            )}
          </div>

          {/* ── JOIN FORM ── */}
          {tab === "join" && (
            <form onSubmit={handleJoin} className="space-y-4">

              {/* Invite Code — top, most important */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">Invite Code</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <IconKey />
                  </div>
                  <input
                    className="w-full rounded-xl pl-9 pr-4 py-3 text-sm placeholder:text-slate-600 focus:ring-0 font-mono tracking-widest uppercase"
                    placeholder="e.g. A3F9B2C1"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    maxLength={8}
                    autoComplete="off"
                  />
                </div>
                {/* Live resolved org name */}
                {resolvedOrg && (
                  <div className="flex items-center gap-2 mt-1.5 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs text-emerald-400 font-medium">
                      Joining <span className="text-white">{resolvedOrg}</span>
                    </p>
                  </div>
                )}
                {lookupError && (
                  <p className="text-xs text-red-400 mt-1.5 px-1">{lookupError}</p>
                )}
              </div>

              <Field label="Full Name" placeholder="Jane Doe" value={name} onChange={setName} icon={<IconUser />} />
              <Field label="Work Email" type="email" placeholder="you@company.com" value={email} onChange={setEmail} icon={<IconEmail />} />
              <PasswordField label="Password" placeholder="••••••••" value={password} onChange={setPassword} />
              <PasswordField label="Confirm Password" placeholder="••••••••" value={confirmPassword} onChange={setConfirmPassword} />

              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 -mt-2">Passwords do not match</p>
              )}

              {error && <ErrorBanner msg={error} />}
              {success && <SuccessBanner msg={success} />}

              <SubmitButton
                loading={isLoading}
                disabled={!joinValid}
                label="Join workspace →"
                loadingLabel="Joining…"
                accent="blue"
              />
            </form>
          )}

          {/* ── CREATE ORG FORM ── */}
          {tab === "create" && (
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <Field label="Organisation Name" placeholder="Acme Inc." value={company} onChange={setCompany} icon={<IconBuilding />} />

              {/* Info callout */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <span className="text-violet-400 text-sm flex-shrink-0 mt-0.5">ℹ️</span>
                <p className="text-xs text-violet-300">
                  You'll receive a unique invite code after registration. Share it with your team so they can join.
                </p>
              </div>

              <Field label="Your Full Name" placeholder="Jane Doe" value={name} onChange={setName} icon={<IconUser />} />
              <Field label="Work Email" type="email" placeholder="you@company.com" value={email} onChange={setEmail} icon={<IconEmail />} />
              <PasswordField label="Password" placeholder="••••••••" value={password} onChange={setPassword} />
              <PasswordField label="Confirm Password" placeholder="••••••••" value={confirmPassword} onChange={setConfirmPassword} />

              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 -mt-2">Passwords do not match</p>
              )}

              {error && <ErrorBanner msg={error} />}
              {success && <SuccessBanner msg={success} />}

              <SubmitButton
                loading={isLoading}
                disabled={!createValid}
                label="Create organisation →"
                loadingLabel="Creating…"
                accent="violet"
              />
            </form>
          )}

          {/* Login link */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-navy-800" />
            <span className="text-xs text-slate-600 font-mono">or</span>
            <div className="h-px flex-1 bg-navy-800" />
          </div>
          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{" "}
            <a href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 font-mono mt-6">
          Internal use only · Reflect AI Platform
        </p>
      </div>
    </div>
  );
}
