/**
 * auth.ts — Centralized auth token helpers.
 *
 * Strategy:
 *   • sessionStorage is checked FIRST — per-tab isolation lets you test
 *     multiple users in different browser tabs simultaneously (each tab
 *     logs in independently and never touches another tab's session).
 *   • localStorage is ALWAYS written alongside sessionStorage — this keeps
 *     the session alive through Stripe redirects, page refreshes, and
 *     opening a new tab as the same user.
 *
 * How multi-user testing works:
 *   Tab 1: Login as User A → writes to sessionStorage(tab1) + localStorage
 *   Tab 2: Open login page → Login as User B → writes to sessionStorage(tab2) + localStorage
 *   getToken() in Tab 1 returns User A's token (from sessionStorage, ignoring localStorage).
 *   getToken() in Tab 2 returns User B's token (from its own sessionStorage).
 */

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("token") || localStorage.getItem("token") || null;
}

export function getUser(): any | null {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Save token + user after a successful login.
 *
 * Writes to BOTH storages so that:
 *  - sessionStorage (tab-scoped): Each open tab can independently hold
 *    a different user — great for multi-user testing in separate tabs.
 *  - localStorage (persistent): Session survives Stripe redirects,
 *    page refreshes, and opening the app in a fresh tab as the same user.
 *
 * getToken() always checks sessionStorage first, so if a tab has its own
 * session it takes priority over the shared localStorage value.
 */
export function saveSession(token: string, user: any): void {
    if (typeof window === "undefined") return;
    // Per-tab session (for multi-user testing)
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
    // Persistent session (survives Stripe redirects, refreshes)
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
}

/** Clear both storage layers for full logout. */
export function clearSession(): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}
