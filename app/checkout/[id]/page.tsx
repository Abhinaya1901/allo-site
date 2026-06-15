"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../../ThemeToggle";

type Reservation = {
  id: string;
  stockId: string;
  quantity: number;
  status: "pending" | "confirmed" | "released";
  expiresAt: string;
  createdAt: string;
};

const TTL_MS = 10 * 60 * 1000;

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/reservations/${id}/peek`)
      .then((r) => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((d) => { if (d) setReservation(d); })
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const goBack = () => router.push("/");

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)", background: "color-mix(in srgb, var(--bg) 80%, transparent)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={goBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Back to store
          </button>
          <ThemeToggle />
        </div>
      </header>
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "48px 20px 80px" }}>{children}</main>
    </div>
  );

  if (notFound) {
    return shell(
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 15 }}>This reservation could not be found.</p>
        <button onClick={goBack} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Browse products</button>
      </div>
    );
  }

  if (!reservation) {
    return shell(
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "40px 0" }}>
        <div className="skeleton" style={{ width: 180, height: 180, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: 200, height: 48, borderRadius: 12 }} />
      </div>
    );
  }

  const expiryMs = new Date(reservation.expiresAt).getTime();
  const remainingMs = expiryMs - now;
  const isExpired = remainingMs <= 0;
  const mins = Math.max(0, Math.floor(remainingMs / 60000));
  const secs = Math.max(0, Math.floor((remainingMs % 60000) / 1000));
  const fraction = Math.max(0, Math.min(1, remainingMs / TTL_MS));

  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);
  const ringColor = fraction > 0.5 ? "var(--accent)" : fraction > 0.2 ? "var(--warning)" : "var(--danger)";

  const confirm = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/reservations/${id}/confirm`, { method: "POST" });
    if (res.status === 410) {
      setError("Your hold expired before payment. Please start over.");
      setReservation((r) => r ? { ...r, status: "released" } : r);
    } else if (res.ok) {
      setReservation(await res.json());
    } else {
      setError(`Something went wrong (error ${res.status}).`);
    }
    setBusy(false);
  };

  const cancel = async () => {
    setBusy(true);
    const res = await fetch(`/api/reservations/${id}/release`, { method: "POST" });
    if (res.ok) setReservation(await res.json());
    setBusy(false);
  };

  const isActive = reservation.status === "pending" && !isExpired;

  return shell(
    <div className="animate-fade-up">
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 4px" }}>Checkout</h1>
      <p style={{ color: "var(--text-faint)", fontSize: 12, fontFamily: "ui-monospace, monospace", margin: "0 0 36px" }}>Reservation {id.slice(0, 8)}</p>

      {isActive && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <div style={{ position: "relative", width: 200, height: 200 }}>
            <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--surface-muted)" strokeWidth="10" />
              <circle cx="100" cy="100" r={radius} fill="none" stroke={ringColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)", fontWeight: 600, marginBottom: 4 }}>Expires in</span>
              <span style={{ fontSize: 40, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: ringColor }}>
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
            </div>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 16 }}>
            {reservation.quantity} unit{reservation.quantity > 1 ? "s" : ""} held for you
          </p>
        </div>
      )}

      {reservation.status === "confirmed" && (
        <div style={{ textAlign: "center", padding: "32px 24px", borderRadius: 16, background: "var(--success-soft)", border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--success)", margin: "0 0 6px" }}>Order confirmed</h2>
          <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--success) 80%, var(--text))", margin: 0 }}>
            Payment accepted. Your {reservation.quantity} unit{reservation.quantity > 1 ? "s are" : " is"} on the way.
          </p>
        </div>
      )}

      {(reservation.status === "released" || (reservation.status === "pending" && isExpired)) && (
        <div style={{ textAlign: "center", padding: "32px 24px", borderRadius: 16, background: "var(--surface-muted)", border: "1px solid var(--border)", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>Hold released</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 16px" }}>The units have been returned to available stock.</p>
          <button onClick={goBack} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 600, cursor: "pointer" }}>Browse products</button>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 12, background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)", color: "var(--danger)", fontSize: 14, fontWeight: 500 }}>
          {error}
        </div>
      )}

      {isActive && (
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={confirm}
            disabled={busy}
            style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.7 : 1, transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = "var(--accent-hover)"; }}
            onMouseLeave={(e) => { if (!busy) e.currentTarget.style.background = "var(--accent)"; }}
          >
            {busy ? "Processing…" : "Confirm purchase"}
          </button>
          <button
            onClick={cancel}
            disabled={busy}
            style={{ padding: "14px 22px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: busy ? 0.5 : 1, transition: "all 0.2s ease" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}