"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

type StockEntry = {
  stockId: string;
  warehouseName: string;
  available: number;
};
type Product = {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  stocks: StockEntry[];
};

function StockBadge({ available }: { available: number }) {
  let bg = "var(--success-soft)";
  let fg = "var(--success)";
  let label = `${available} in stock`;
  if (available === 0) {
    bg = "var(--danger-soft)";
    fg = "var(--danger)";
    label = "Out of stock";
  } else if (available <= 2) {
    bg = "var(--warning-soft)";
    fg = "var(--warning)";
    label = available === 1 ? "Last one left" : `Only ${available} left`;
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: bg, color: fg, fontSize: 13, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: fg, display: "inline-block" }} />
      {label}
    </span>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 16, padding: 24, background: "var(--surface)" }}>
          <div className="skeleton" style={{ height: 22, width: "40%", borderRadius: 6, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: "20%", borderRadius: 6, marginBottom: 20 }} />
          <div className="skeleton" style={{ height: 56, width: "100%", borderRadius: 12 }} />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const load = async () => {
    const res = await fetch("/api/products");
    setProducts(await res.json());
    setLoaded(true);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const reserve = async (stockId: string) => {
    setToast(null);
    setLoadingId(stockId);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockId, quantity: 1 }),
      });
      if (res.status === 409) {
        setToast("That item just sold out — stock updated below.");
        await load();
        return;
      }
      if (!res.ok) {
        setToast(`Something went wrong (error ${res.status}). Please try again.`);
        return;
      }
      const r = await res.json();
      router.push(`/checkout/${r.id}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)", background: "color-mix(in srgb, var(--bg) 80%, transparent)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>A</div>
            <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em" }}>Allo</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px" }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 8px" }}>Inventory store</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 15, margin: 0 }}>
            Reserve stock across warehouses. Each hold lasts 10 minutes before it's released.
          </p>
        </div>

        {toast && (
          <div style={{ marginBottom: 24, padding: "14px 16px", borderRadius: 12, background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)", color: "var(--danger)", fontSize: 14, fontWeight: 500, animation: "toastIn 0.3s ease both", display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {toast}
          </div>
        )}

        {!loaded ? (
          <Skeleton />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {products.map((p, idx) => (
              <article
                key={p.id}
                className="animate-fade-up"
                style={{ animationDelay: `${idx * 80}ms`, border: "1px solid var(--border)", borderRadius: 16, background: "var(--surface)", boxShadow: "var(--shadow-sm)", overflow: "hidden", transition: "box-shadow 0.25s ease, transform 0.25s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px", letterSpacing: "-0.01em" }}>{p.name}</h2>
                    <span style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", color: "var(--text-faint)", letterSpacing: "0.02em" }}>{p.sku}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>₹{(p.priceCents / 100).toLocaleString("en-IN")}</div>
                </div>
                <div style={{ padding: "8px 24px 20px" }}>
                  {p.stocks.map((s) => (
                    <div key={s.stockId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{s.warehouseName}</span>
                        <StockBadge available={s.available} />
                      </div>
                      <button
                        onClick={() => reserve(s.stockId)}
                        disabled={s.available < 1 || loadingId === s.stockId}
                        style={{
                          padding: "9px 18px",
                          borderRadius: 10,
                          border: "none",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: s.available < 1 ? "not-allowed" : "pointer",
                          background: s.available < 1 ? "var(--surface-muted)" : "var(--accent)",
                          color: s.available < 1 ? "var(--text-faint)" : "#fff",
                          opacity: loadingId === s.stockId ? 0.7 : 1,
                          transition: "all 0.2s ease",
                          minWidth: 96,
                        }}
                        onMouseEnter={(e) => { if (s.available >= 1) e.currentTarget.style.background = "var(--accent-hover)"; }}
                        onMouseLeave={(e) => { if (s.available >= 1) e.currentTarget.style.background = "var(--accent)"; }}
                      >
                        {loadingId === s.stockId ? "Reserving…" : "Reserve"}
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}