"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { buildApiUrl, API_ROUTES, API_CONFIG } from "@/app/utils/properties";

function PaymentCancelContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const orderId = params.get("orderId") || params.get("order_id") || "";

  const [statusMsg, setStatusMsg] = useState("Updating order status…");
  const [updated,   setUpdated]   = useState(false);

  /* ── Mark order FAILED as soon as page loads ── */
  useEffect(() => {
    if (!orderId) {
      setStatusMsg("No order ID found.");
      return;
    }

    const markFailed = async () => {
      try {
        const res = await fetch(buildApiUrl(API_ROUTES.ORDER.CANCEL), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
          signal: AbortSignal.timeout(API_CONFIG.timeout),
        });

        if (res.ok) {
          const data = await res.json();
          setStatusMsg(`Order status updated to: ${data.status}`);
        } else {
          setStatusMsg("Could not update order status.");
        }
      } catch {
        setStatusMsg("Could not reach server.");
      } finally {
        setUpdated(true);
      }
    };

    markFailed();
  }, [orderId]);

  /* ── Auto-redirect to summary after 5 s ── */
  useEffect(() => {
    if (!orderId) return;
    const t = setTimeout(() => router.push(`/summary?orderId=${orderId}`), 5000);
    return () => clearTimeout(t);
  }, [orderId, router]);

  return (
    <main className="reg-root">
      <section className="reg-card">
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="26" cy="26" r="26" fill="rgba(248,113,113,0.1)"/>
            <path d="M34 18L18 34M18 18l16 16" stroke="#f87171" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="reg-title" style={{ textAlign: "center", color: "#f87171" }}>
          PAYMENT FAILED
        </h1>

        <p className="reg-subtitle" style={{ textAlign: "center" }}>
          The payment was cancelled or failed.
        </p>

        {/* Live status indicator */}
        <p style={{
          marginTop: 12,
          padding: "10px 14px",
          borderRadius: 10,
          background: updated ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)",
          border: `1px solid ${updated ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}`,
          color: updated ? "#34d399" : "#fbbf24",
          fontSize: 13,
          fontWeight: 600,
          textAlign: "center"
        }}>
          {updated ? "✓" : "⏳"} {statusMsg}
        </p>

        {orderId && (
          <p style={{ marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
            <b>Order ID:</b> {orderId}
          </p>
        )}

        <p style={{ marginTop: 16, color: "#f87171", fontWeight: 600, fontSize: 13, textAlign: "center" }}>
          You will be redirected to the payment summary page in 5 seconds.
        </p>

        <div className="form-actions">
          <Link
            href="/"
            className="form-btn form-btn-secondary"
            style={{ textDecoration: "none", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            Go Home
          </Link>

          {orderId && (
            <Link
              href={`/summary?orderId=${orderId}`}
              className="form-btn form-btn-primary"
              style={{ textDecoration: "none", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              Summary
            </Link>
          )}
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .reg-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0c29 0%, #1a1042 40%, #24243e 100%);
          font-family: 'Inter', sans-serif;
          padding: 24px;
        }

        .reg-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 24px;
          padding: 40px 36px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.4);
          animation: fadeUp 0.4s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .reg-title {
          font-size: 26px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 6px;
        }

        .reg-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 28px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .form-btn {
          flex: 1;
          padding: 13px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          border: none;
          transition: all 0.2s ease;
        }

        .form-btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          box-shadow: 0 4px 16px rgba(99,102,241,0.35);
        }
        .form-btn-primary:hover {
          box-shadow: 0 8px 24px rgba(99,102,241,0.5);
          transform: translateY(-1px);
        }

        .form-btn-secondary {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .form-btn-secondary:hover {
          background: rgba(255,255,255,0.14);
          transform: translateY(-1px);
        }
      `}</style>
    </main>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: "center", marginTop: 50 }}>Loading...</p>}>
      <PaymentCancelContent />
    </Suspense>
  );
}
