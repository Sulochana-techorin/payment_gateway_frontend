"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl, formatPrice } from "@/app/utils/properties";

/* ─── Types ──────────────────────────────────────────────── */
type Payment = {
  id: string; orderId: string; user_id: number; userName: string; userEmail: string;
  total_amount: number; user_count: number; status: string; invoice_path?: string | null; currency?: string;
  paymentId?: string; charge_type?: string; date?: string;
};
type User = { id: number; name: string; email: string; userCount: number; };
type Meta = { total: number; page: number; totalPages: number; limit: number; };
type Tab = "payments" | "users";

/* ─── Constants ──────────────────────────────────────────── */
const LIMIT_OPTIONS = [5, 10, 20, 50];

/* ─── Status badge ───────────────────────────────────────── */
const STATUS_CLR: Record<string, [string, string]> = {
  ACTIVE: ["rgba(52,211,153,0.15)", "#34d399"],
  PENDING: ["rgba(251,191,36,0.15)", "#fbbf24"],
  FAILED: ["rgba(248,113,113,0.15)", "#f87171"],
  CANCELLED: ["rgba(239,68,68,0.15)", "#ef4444"], // Premium deep red/rose badge for cancelled states
};
function Badge({ s }: { s: string }) {
  const [bg, col] = STATUS_CLR[s] ?? ["rgba(148,163,184,0.15)", "#94a3b8"];
  return <span style={{ background: bg, color: col, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{s}</span>;
}

/* ─── Pagination ─────────────────────────────────────────── */
function Pagination({ meta, onPage, onLimit }: {
  meta: Meta; onPage: (p: number) => void; onLimit: (l: number) => void;
}) {
  const { page, totalPages, total, limit } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build visible page numbers (window of 4 around current)
  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 1, totalPages - 3));
  const end = Math.min(totalPages, start + 3);
  for (let i = start; i <= end; i++) pages.push(i);

  if (totalPages <= 1 && total === 0) return null;

  return (
    <div className="pg-bar">
      <div className="pg-left">
        <span className="pg-info">Showing {from}–{to} of {total}</span>
        <span className="pg-sep">|</span>
        <select className="pg-limit" value={limit} onChange={(e) => onLimit(Number(e.target.value))}>
          {LIMIT_OPTIONS.map((l) => <option key={l} value={l}>{l} per page</option>)}
        </select>
      </div>

      <div className="pg-btns">
        <button className="pg-btn" onClick={() => onPage(1)} disabled={page === 1} title="First">⟪</button>
        <button className="pg-btn" onClick={() => onPage(page - 1)} disabled={page === 1} title="Prev">‹</button>
        {pages.map((p) => (
          <button key={p} className={`pg-btn ${p === page ? "pg-active" : ""}`} onClick={() => onPage(p)}>{p}</button>
        ))}
        <button className="pg-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages} title="Next">›</button>
        <button className="pg-btn" onClick={() => onPage(totalPages)} disabled={page === totalPages} title="Last">⟫</button>
      </div>
    </div>
  );
}

/* ─── Date Formatter Helper ─── */
function formatDateTime(val: any) {
  if (!val || val === "N/A") return "N/A";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString();
  } catch {
    return String(val);
  }
}

/* ─── Main page ──────────────────────────────────────────── */
export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("payments");

  const [payments, setPay] = useState<Payment[]>([]);
  const [payMeta, setPayM] = useState<Meta>({ total: 0, page: 1, totalPages: 1, limit: 10 });

  const [users, setUsers] = useState<User[]>([]);
  const [userMeta, setUsrM] = useState<Meta>({ total: 0, page: 1, totalPages: 1, limit: 10 });

  const [loading, setLoad] = useState(false);
  const [error, setError] = useState("");

  // Filter controls (applied immediately on status change, apply btn for search)
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [payLimit, setPayLimit] = useState(10);
  const [usrLimit, setUsrLimit] = useState(10);

  // Tracking Details Modal States
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const handleRowClick = useCallback(async (userId: number, orderId?: string) => {
    setTrackingLoading(true);
    setTrackingError("");
    setTrackingData(null);
    try {
      const url = orderId 
        ? buildApiUrl(`/api/admin/user-tracking/0`, { orderId })
        : buildApiUrl(`/api/admin/user-tracking/${userId}`);
      const r = await fetch(url);
      if (!r.ok) throw new Error("Failed to fetch tracking details");
      const j = await r.json();
      if (!j.success) throw new Error(j.error || "Failed to fetch");
      setTrackingData(j);
    } catch (err: any) {
      setTrackingError(err.message || "An error occurred fetching tracking details");
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  const closeTrackingModal = () => {
    setTrackingData(null);
    setTrackingError("");
  };

  /* ── Fetch payments ── */
  const fetchPay = useCallback(async (page: number, srch: string, stat: string, lim: number) => {
    setLoad(true); setError("");
    try {
      const p: Record<string, string> = { page: String(page), limit: String(lim) };
      if (srch) p.search = srch;
      if (stat !== "ALL") p.status = stat;
      const r = await fetch(buildApiUrl("/api/admin/payments", p));
      if (!r.ok) throw new Error();
      const j = await r.json();
      setPay(j.data);
      setPayM({ total: j.total, page: j.page, totalPages: j.totalPages, limit: j.limit });
    } catch { setError("Could not load payments. Is the backend running?"); }
    finally { setLoad(false); }
  }, []);

  /* ── Fetch users ── */
  const fetchUsr = useCallback(async (page: number, srch: string, lim: number) => {
    setLoad(true); setError("");
    try {
      const p: Record<string, string> = { page: String(page), limit: String(lim) };
      if (srch) p.search = srch;
      const r = await fetch(buildApiUrl("/api/admin/users", p));
      if (!r.ok) throw new Error();
      const j = await r.json();
      setUsers(j.data);
      setUsrM({ total: j.total, page: j.page, totalPages: j.totalPages, limit: j.limit });
    } catch { setError("Could not load users. Is the backend running?"); }
    finally { setLoad(false); }
  }, []);

  // Load on mount / tab switch
  useEffect(() => {
    if (tab === "payments") fetchPay(1, search, status, payLimit);
    else fetchUsr(1, search, usrLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Auto-fetch when status dropdown changes
  const handleStatusChange = (val: string) => {
    setStatus(val);
    fetchPay(1, search, val, payLimit);
  };

  const applySearch = () => {
    if (tab === "payments") fetchPay(1, search, status, payLimit);
    else fetchUsr(1, search, usrLimit);
  };

  const resetAll = () => {
    setSearch(""); setStatus("ALL");
    if (tab === "payments") fetchPay(1, "", "ALL", payLimit);
    else fetchUsr(1, "", usrLimit);
  };

  const switchTab = (t: Tab) => {
    setTab(t); setSearch(""); setStatus("ALL"); setError("");
  };

  /* ── Invoice download ── */
  const dlInvoice = (id: string) =>
    window.open(buildApiUrl(`/api/payment/invoice/${id}`), "_blank");

  return (
    <div className="root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="s-logo">
          <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="28" fill="url(#g1)" />
            <path d="M22 28.5L26.5 33L34 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs><linearGradient id="g1" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" />
            </linearGradient></defs>
          </svg>
          <span className="s-brand">AdminPanel</span>
        </div>
        <nav className="s-nav">
          {(["payments", "users"] as Tab[]).map((t) => (
            <button key={t} className={`nav-btn ${tab === t ? "nav-on" : ""}`} onClick={() => switchTab(t)}>
              {t === "payments"
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <button className="s-back" onClick={() => router.push("/")}>← Back to Home</button>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Header */}
        <header className="hdr">
          <div>
            <h1 className="hdr-title">{tab === "payments" ? "Payments" : "Users"}</h1>
            <p className="hdr-sub">{tab === "payments" ? payMeta.total : userMeta.total} total records</p>
          </div>

          <div className="filters">
            <div className="srch-wrap">
              <svg className="srch-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input id="admin-search" className="f-input srch-inp" placeholder="Search…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()} />
            </div>

            {tab === "payments" && (
              <select id="admin-status" className="f-input" value={status} onChange={(e) => handleStatusChange(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            )}

            <button id="admin-apply" className="f-btn" onClick={applySearch}>Apply</button>
            <button className="f-btn f-ghost" onClick={resetAll}>Reset</button>
          </div>
        </header>

        {/* Content */}
        <div className="content">
          {error && <div className="err">{error}</div>}

          {loading ? (
            <div className="loading"><div className="spin" /><p>Loading…</p></div>
          ) : tab === "payments" ? (
            <>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr>
                    <th>Payment ID</th><th>User Name</th><th>Email</th>
                    <th>Users</th><th>Amount</th><th>Status</th><th>Invoice</th>
                  </tr></thead>
                  <tbody>
                    {payments.length === 0
                      ? <tr><td colSpan={7} className="empty">No payments found</td></tr>
                      : payments.map((p) => (
                        <tr key={p.id} onClick={() => handleRowClick(p.user_id, p.orderId)} style={{ cursor: "pointer" }}>
                          <td className="mono" title={p.paymentId !== "N/A" ? p.paymentId : p.orderId}>
                            <div style={{ fontWeight: 600, color: p.paymentId !== "N/A" ? "#38bdf8" : "#cbd5e1" }}>
                              {p.paymentId !== "N/A" ? p.paymentId : p.orderId.slice(0, 8) + "…"}
                            </div>
                            <div style={{ fontSize: 10, color: p.charge_type === "INITIAL" ? "#38bdf8" : "#a855f7", fontWeight: 700, marginTop: 3 }}>
                              {p.charge_type}
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                              {p.date ? formatDateTime(p.date) : ""}
                            </div>
                          </td>
                          <td>{p.userName}</td>
                          <td className="dim">{p.userEmail}</td>
                          <td>{p.user_count}</td>
                          <td className="amt">{formatPrice(Number(p.total_amount), p.currency)}</td>
                          <td><Badge s={p.status} /></td>
                          <td>{p.invoice_path
                            ? <button className="dl" onClick={(e) => { e.stopPropagation(); dlInvoice(p.orderId); }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              Download
                            </button>
                            : <span className="na">—</span>}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                meta={payMeta}
                onPage={(p) => fetchPay(p, search, status, payLimit)}
                onLimit={(l) => { setPayLimit(l); fetchPay(1, search, status, l); }}
              />
            </>
          ) : (
            <>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr>
                    <th>User ID</th><th>Name</th><th>Email</th><th>User Seats</th>
                  </tr></thead>
                  <tbody>
                    {users.length === 0
                      ? <tr><td colSpan={4} className="empty">No users found</td></tr>
                      : users.map((u) => (
                        <tr key={u.id} onClick={() => handleRowClick(u.id)} style={{ cursor: "pointer" }}>
                          <td className="mono">U{String(u.id).padStart(4, "0")}</td>
                          <td>{u.name}</td>
                          <td className="dim">{u.email}</td>
                          <td>{u.userCount}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                meta={userMeta}
                onPage={(p) => fetchUsr(p, search, usrLimit)}
                onLimit={(l) => { setUsrLimit(l); fetchUsr(1, search, l); }}
              />
            </>
          )}

          {/* Tracking Details Premium Modal Overlay */}
          {(trackingLoading || trackingError || trackingData) && (
            <div className="modal-backdrop" onClick={closeTrackingModal}>
              <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <header className="m-hdr">
                  <div>
                    <h2 className="m-title">Comprehensive User & Payment Tracking</h2>
                    <p className="m-sub">Live PayHere App Verification & Real-time Timeline Logs</p>
                  </div>
                  <button className="m-close" onClick={closeTrackingModal}>✕</button>
                </header>

                <div className="m-body">
                  {trackingLoading ? (
                    <div className="loading" style={{ paddingTop: 40, paddingBottom: 40 }}>
                      <div className="spin" />
                      <p>Querying real-time tracking from server & PayHere app API…</p>
                    </div>
                  ) : trackingError ? (
                    <div className="err" style={{ margin: 20 }}>{trackingError}</div>
                  ) : trackingData ? (
                    <div className="track-grid">
                      {/* User Top Stats Panel */}
                      <div className="t-panel t-user-panel">
                        <div className="t-card">
                          <span className="t-lbl">Customer Name</span>
                          <span className="t-val">{trackingData.user?.name || "Unknown"}</span>
                        </div>
                        <div className="t-card">
                          <span className="t-lbl">Account Email</span>
                          <span className="t-val dim">{trackingData.user?.email || "Unknown"}</span>
                        </div>
                        <div className="t-card">
                          <span className="t-lbl">Total Seat Allocations</span>
                          <span className="t-val amt">{trackingData.user?.userCount || 0} Seats</span>
                        </div>
                        <div className="t-card">
                          <span className="t-lbl">Active Subscription</span>
                          <span className="t-val">
                            <Badge s={trackingData.activeSubscription?.status || "NONE"} />
                          </span>
                        </div>
                      </div>

                      {/* Summary Banner */}
                      <div className="t-banner">
                        <div className="t-b-item">
                          <span>Total Payments Tracked:</span>
                          <strong>{trackingData.summary?.totalPaymentsTracked || 0}</strong>
                        </div>
                        <div className="t-b-sep">•</div>
                        <div className="t-b-item">
                          <span>Latest Next Payment Date:</span>
                          <strong style={{ color: "#34d399" }}>{formatDateTime(trackingData.summary?.latestNextPaymentDate)}</strong>
                        </div>
                        <div className="t-b-sep">•</div>
                        <div className="t-b-item">
                          <span>Live PayHere Connection:</span>
                          <strong style={{ color: trackingData.fetchedFromPayhereAppLive ? "#a5b4fc" : "#f87171" }}>
                            {trackingData.fetchedFromPayhereAppLive ? "Connected & Verified" : "Sandbox Database Fallback"}
                          </strong>
                        </div>
                      </div>

                      {/* Comprehensive Payments Table */}
                      <h3 className="t-section-title">Tracked Payments & PayHere App Sync Logs</h3>
                      <div className="tbl-wrap" style={{ maxHeight: 360, overflowY: "auto" }}>
                        <table className="tbl">
                          <thead>
                            <tr>
                              <th>Payment & Order Details</th>
                              <th>Amount & Charge Type</th>
                              <th>Next Payment Date</th>
                              <th>Card Update Logs</th>
                              <th>PayHere App Linkage</th>
                              <th>Failed Alerts & Email Tracking</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trackingData.trackingRecords?.length === 0 ? (
                              <tr><td colSpan={6} className="empty">No tracking timeline recorded for this account.</td></tr>
                            ) : (
                              trackingData.trackingRecords?.map((tr: any) => (
                                <tr key={tr.id}>
                                  <td className="mono" style={{ fontSize: 11, color: "#cbd5e1" }}>
                                    <div>{tr.orderId}</div>
                                    <div style={{ color: "#38bdf8", fontWeight: 600, fontSize: 10, marginTop: 4 }}>
                                      Pay ID: {tr.paymentId}
                                    </div>
                                    <div style={{ marginTop: 6 }}>
                                      <Badge s={tr.status} />
                                    </div>
                                  </td>
                                  <td>
                                    <div className="amt" style={{ fontWeight: 700, fontSize: 14 }}>
                                      {formatPrice(tr.totalAmount, tr.currency)}
                                    </div>
                                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                                      Type: <span style={{ color: tr.type === "INITIAL" ? "#38bdf8" : "#a855f7", fontWeight: 700 }}>{tr.type}</span>
                                    </div>
                                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                                      Date: {formatDateTime(tr.date)}
                                    </div>
                                  </td>
                                  <td style={{ color: tr.nextPaymentDateTime !== "N/A" ? "#34d399" : "inherit", fontWeight: 600 }}>
                                    {formatDateTime(tr.nextPaymentDateTime)}
                                  </td>
                                  <td>
                                    {tr.cardTracking?.updated ? (
                                      <div className="card-log">
                                        <span className="c-dot success"></span>
                                        <div>
                                          <div style={{ fontWeight: 600, color: "#38bdf8" }}>Updated ({tr.cardTracking.method})</div>
                                          <div className="dim" style={{ fontSize: 10 }}>{formatDateTime(tr.cardTracking.updatedAt)}</div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="dim" style={{ fontSize: 11 }}>Original Setup / Default</div>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ fontSize: 11, background: "rgba(255,255,255,0.04)", padding: "4px 8px", borderRadius: 6 }}>
                                      <span style={{ color: "#a5b4fc", fontWeight: 600 }}>Status:</span> {tr.livePayhereAppDetails?.status || "Unknown"}
                                      {tr.livePayhereAppDetails?.next_payment_date && (
                                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Sync: {formatDateTime(tr.livePayhereAppDetails.next_payment_date)}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    {tr.isFailed ? (
                                      <div style={{ background: "rgba(248,113,113,0.1)", padding: "5px 9px", borderRadius: 6, border: "1px solid rgba(248,113,113,0.2)" }}>
                                        <div style={{ color: "#f87171", fontWeight: 700, fontSize: 11 }}>⚠️ Subscription Failed</div>
                                        <div style={{ fontSize: 10, color: "#e2e8f0", marginTop: 2 }}>Mail: <strong style={{ color: tr.emailTracking?.sent ? "#34d399" : "#fbbf24" }}>{tr.emailTracking?.status}</strong></div>
                                        <div className="dim" style={{ fontSize: 9 }}>To: {tr.emailTracking?.recipient}</div>
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                        <span style={{ color: "#34d399" }}>✓ Successful</span>
                                        <div style={{ fontSize: 10, marginTop: 2 }}>Mail: {tr.emailTracking?.status}</div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .root{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#0d0d1a;color:#e2e8f0}

        /* Sidebar */
        .sidebar{width:216px;flex-shrink:0;background:rgba(255,255,255,0.03);border-right:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;padding:26px 14px 22px}
        .s-logo{display:flex;align-items:center;gap:10px;margin-bottom:32px;padding:0 6px}
        .s-brand{font-size:15px;font-weight:800;color:#fff}
        .s-nav{display:flex;flex-direction:column;gap:3px;flex:1}
        .nav-btn{display:flex;align-items:center;gap:9px;padding:10px 13px;border-radius:10px;border:none;background:none;color:rgba(255,255,255,0.45);font-size:13px;font-weight:500;font-family:'Inter',sans-serif;cursor:pointer;transition:all 0.18s ease;text-align:left}
        .nav-btn:hover{background:rgba(255,255,255,0.06);color:#fff}
        .nav-on{background:rgba(99,102,241,0.18)!important;color:#a5b4fc!important;font-weight:700}
        .s-back{margin-top:20px;padding:10px 13px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:none;color:rgba(255,255,255,0.35);font-size:12px;font-family:'Inter',sans-serif;cursor:pointer;transition:all 0.18s;text-align:left}
        .s-back:hover{background:rgba(255,255,255,0.06);color:#fff}

        /* Main */
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
        .hdr{padding:24px 28px 18px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:20px;flex-wrap:wrap}
        .hdr-title{font-size:20px;font-weight:800;color:#fff;margin-bottom:2px}
        .hdr-sub{font-size:12px;color:rgba(255,255,255,0.35)}

        /* Filters */
        .filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-left:auto}
        .srch-wrap{position:relative}
        .srch-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.3);pointer-events:none}
        .f-input{height:36px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);border-radius:9px;color:#e2e8f0;font-size:13px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.18s;padding:0 11px}
        .f-input:focus{border-color:rgba(99,102,241,0.5)}
        .srch-inp{padding-left:32px;width:190px}
        select.f-input{cursor:pointer}
        select.f-input option{background:#1e1e30}
        .f-btn{height:36px;padding:0 16px;border-radius:9px;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;transition:all 0.18s ease}
        .f-btn:hover{opacity:0.88;transform:translateY(-1px)}
        .f-ghost{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.10)}
        .f-ghost:hover{background:rgba(255,255,255,0.12)}

        /* Content */
        .content{flex:1;padding:24px 28px;overflow-y:auto;display:flex;flex-direction:column;gap:14px}
        .err{background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.25);color:#f87171;border-radius:10px;padding:12px 16px;font-size:13px}
        .loading{display:flex;flex-direction:column;align-items:center;gap:14px;padding-top:60px;color:rgba(255,255,255,0.35);font-size:14px}
        .spin{width:34px;height:34px;border:3px solid rgba(99,102,241,0.2);border-top-color:#6366f1;border-radius:50%;animation:spin 0.7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* Table */
        .tbl-wrap{overflow-x:auto;border-radius:14px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02)}
        .tbl{width:100%;border-collapse:collapse;font-size:13px}
        .tbl thead tr{border-bottom:1px solid rgba(255,255,255,0.07)}
        .tbl th{padding:13px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:rgba(255,255,255,0.35);white-space:nowrap}
        .tbl td{padding:13px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#e2e8f0;vertical-align:middle}
        .tbl tbody tr:last-child td{border-bottom:none}
        .tbl tbody tr{transition:background 0.15s}
        .tbl tbody tr:hover{background:rgba(255,255,255,0.03)}
        .mono{font-family:monospace;font-size:12px;color:rgba(255,255,255,0.6)}
        .dim{color:rgba(255,255,255,0.45)}
        .amt{font-weight:600;color:#a5b4fc}
        .empty{text-align:center;padding:48px 0!important;color:rgba(255,255,255,0.25)!important;font-size:14px!important}
        .dl{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:7px;border:1px solid rgba(52,211,153,0.3);background:rgba(52,211,153,0.1);color:#34d399;font-size:12px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;transition:all 0.18s}
        .dl:hover{background:rgba(52,211,153,0.2);transform:translateY(-1px)}
        .na{color:rgba(255,255,255,0.2)}

        /* Pagination */
        .pg-bar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px 0}
        .pg-left{display:flex;align-items:center;gap:10px}
        .pg-info{font-size:12px;color:rgba(255,255,255,0.4)}
        .pg-sep{color:rgba(255,255,255,0.2);font-size:12px}
        .pg-limit{height:30px;padding:0 8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);border-radius:7px;color:#e2e8f0;font-size:12px;font-family:'Inter',sans-serif;outline:none;cursor:pointer}
        .pg-limit option{background:#1e1e30}
        .pg-btns{display:flex;align-items:center;gap:3px}
        .pg-btn{min-width:32px;height:32px;padding:0 6px;border-radius:7px;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);font-size:13px;font-family:'Inter',sans-serif;cursor:pointer;transition:all 0.15s ease;display:flex;align-items:center;justify-content:center}
        .pg-btn:hover:not(:disabled){background:rgba(99,102,241,0.2);color:#fff;border-color:rgba(99,102,241,0.4)}
        .pg-btn:disabled{opacity:0.3;cursor:not-allowed}
        .pg-active{background:linear-gradient(135deg,#6366f1,#8b5cf6)!important;color:#fff!important;border-color:transparent!important;font-weight:700}

        /* Tracking Modal Overlay */
        .modal-backdrop{position:fixed;inset:0;background:rgba(5,5,12,0.85);backdrop-filter:blur(6px);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .modal-box{width:100%;max-width:1100px;max-height:90vh;background:#121226;border:1px solid rgba(255,255,255,0.12);border-radius:18px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);display:flex;flex-direction:column;overflow:hidden;animation:scaleUp 0.25s cubic-bezier(0.16,1,0.3,1)}
        @keyframes scaleUp{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        .m-hdr{padding:20px 26px;background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between}
        .m-title{font-size:18px;font-weight:800;color:#fff}
        .m-sub{font-size:12px;color:#a5b4fc;margin-top:2px}
        .m-close{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.06);border:none;color:rgba(255,255,255,0.6);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.18s}
        .m-close:hover{background:rgba(255,255,255,0.15);color:#fff}
        .m-body{padding:24px 28px;overflow-y:auto;display:flex;flex-direction:column;gap:20px}
        .track-grid{display:flex;flex-direction:column;gap:18px}
        .t-user-panel{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;background:rgba(255,255,255,0.02);padding:16px 20px;border-radius:12px;border:1px solid rgba(255,255,255,0.05)}
        .t-card{display:flex;flex-direction:column;gap:4px}
        .t-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:rgba(255,255,255,0.35)}
        .t-val{font-size:14px;font-weight:600;color:#f8fafc}
        .t-banner{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:10px 16px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1));border-radius:10px;border:1px solid rgba(99,102,241,0.2);font-size:13px}
        .t-b-item{display:flex;align-items:center;gap:6px;color:#cbd5e1}
        .t-b-sep{color:rgba(255,255,255,0.2)}
        .t-section-title{font-size:14px;font-weight:700;color:#e2e8f0;margin-top:4px}
        .card-log{display:flex;align-items:center;gap:7px}
        .c-dot{width:8px;height:8px;border-radius:50%}
        .c-dot.success{background:#38bdf8;box-shadow:0 0 8px rgba(56,189,248,0.5)}
      `}</style>
    </div>
  );
}
