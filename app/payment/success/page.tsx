"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_CONFIG, API_ROUTES, buildApiUrl, formatPrice } from "@/app/utils/properties";

type Order = {
  id: string;
  base_price: number;
  user_count: number;
  price_per_user: number;
  subscription_amount: number;
  total_amount: number;
  status: string;
  currency?: string;
};

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isSyncing, setIsSyncing] = useState(true);

  const orderId = useMemo(
    () => params.get("orderId") || params.get("order_id") || "",
    [params],
  );
  const paymentId = params.get("payment_id") || "";
  const merchantId = params.get("merchant_id") || "";
  const payhereAmount = params.get("payhere_amount") || "";
  const payhereCurrency = params.get("payhere_currency") || "";
  const statusCode = params.get("status_code") || "";
  const md5sig = params.get("md5sig") || "";

  const hasReturnConfirmationPayload = Boolean(
    orderId && merchantId && payhereAmount && payhereCurrency && statusCode && md5sig,
  );

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const load = async () => {
      try {
        // Always try direct confirm-success first (reliable for localhost/sandbox)
        await fetch(buildApiUrl(API_ROUTES.PAYMENT.CONFIRM_SUCCESS), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            paymentId: paymentId || undefined,
          }),
          signal: AbortSignal.timeout(API_CONFIG.timeout),
        });

        // If we also have PayHere return params, try the full confirm as well
        // (this helps when the notify webhook hasn't reached us yet)
        if (hasReturnConfirmationPayload) {
          try {
            await fetch(buildApiUrl(API_ROUTES.PAYMENT.CONFIRM), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                merchant_id: merchantId,
                order_id: orderId,
                payment_id: paymentId || undefined,
                payhere_amount: payhereAmount,
                payhere_currency: payhereCurrency,
                status_code: statusCode,
                md5sig,
              }),
              signal: AbortSignal.timeout(API_CONFIG.timeout),
            });
          } catch {
            // confirm endpoint may fail in sandbox — that's OK, confirm-success handled it
          }
        }

        const url = buildApiUrl(`${API_ROUTES.ORDER.GET_BY_ID}/${orderId}`);
        const res = await fetch(url, {
          signal: AbortSignal.timeout(API_CONFIG.timeout),
        });

        if (!res.ok) {
          throw new Error("Unable to load order details");
        }

        const data = (await res.json()) as Order;
        setOrder(data);
        setIsSyncing(data.status !== "ACTIVE");
      } catch (err) {
        console.error(err);
        setError("Unable to load payment result");
        setIsSyncing(false);
      }
    };

    load();
  }, [
    hasReturnConfirmationPayload,
    md5sig,
    merchantId,
    orderId,
    payhereAmount,
    payhereCurrency,
    paymentId,
    statusCode,
  ]);

  useEffect(() => {
    if (!orderId || !isSyncing) {
      return;
    }

    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;

      try {
        // Retry confirm-success (simple and reliable)
        await fetch(buildApiUrl(API_ROUTES.PAYMENT.CONFIRM_SUCCESS), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            paymentId: paymentId || undefined,
          }),
          signal: AbortSignal.timeout(API_CONFIG.timeout),
        });

        const url = buildApiUrl(`${API_ROUTES.ORDER.GET_BY_ID}/${orderId}`);
        const res = await fetch(url, {
          signal: AbortSignal.timeout(API_CONFIG.timeout),
        });

        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as Order;
        setOrder(data);

        if (data.status === "ACTIVE" || attempts >= 6) {
          setIsSyncing(false);
          clearInterval(timer);
        }
      } catch {
        if (attempts >= 6) {
          setIsSyncing(false);
          clearInterval(timer);
        }
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [isSyncing, orderId, paymentId]);

  if (!orderId) {
    return <p style={{ color: "#d11", textAlign: "center", marginTop: 60 }}>Order ID is missing</p>;
  }

  if (error) {
    return <p style={{ color: "#d11", textAlign: "center", marginTop: 60 }}>{error}</p>;
  }

  if (!order) {
    return <p style={{ textAlign: "center", marginTop: 60 }}>Loading payment result...</p>;
  }

  return (
    <main className="reg-root">
      <section className="reg-card" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="28" fill="rgba(52,211,153,0.15)" />
            <path d="M38 20L24 36L18 30" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="reg-title" style={{ textAlign: "center", color: "#34d399", fontSize: 26 }}>
          PAYMENT SUCCESSFUL
        </h1>
        <p className="reg-subtitle" style={{ textAlign: "center", marginBottom: 16 }}>
          Your subscription setup payment has been completed successfully.
        </p>

        {isSyncing ? (
          <p style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: 13, fontWeight: 600, textAlign: "center", marginBottom: 16 }}>
            ⏳ Verifying payment status with gateway...
          </p>
        ) : order.status !== "ACTIVE" ? (
          <p style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: 13, fontWeight: 600, textAlign: "center", marginBottom: 16 }}>
            ⏳ We are still waiting for PayHere to confirm this subscription setup.
          </p>
        ) : null}

        <div className="summary-details" style={{ marginTop: 20, marginBottom: 24 }}>
          <div className="summary-row">
            <span className="summary-label">Order ID</span>
            <span className="summary-value" style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{order.id}</span>
          </div>
          {paymentId && (
            <div className="summary-row">
              <span className="summary-label">Payment ID</span>
              <span className="summary-value" style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{paymentId}</span>
            </div>
          )}
          <div className="summary-row">
            <span className="summary-label">Status</span>
            <span className="summary-value" style={{ color: order.status === "ACTIVE" ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
              {order.status}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Users</span>
            <span className="summary-value">{order.user_count}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Registration Fee</span>
            <span className="summary-value">{formatPrice(order.base_price, order.currency)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Per User / Month</span>
            <span className="summary-value">{formatPrice(order.price_per_user, order.currency)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Monthly Charge</span>
            <span className="summary-value">{formatPrice(order.subscription_amount, order.currency)}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row" style={{ marginTop: 12 }}>
            <span className="summary-label" style={{ color: "#fff", fontWeight: 700 }}>First Payment Today</span>
            <span className="summary-value" style={{ color: "#34d399", fontWeight: 800, fontSize: 16 }}>{formatPrice(order.total_amount, order.currency)}</span>
          </div>
        </div>

        <div className="form-actions">
          <Link
            href="/"
            className="form-btn form-btn-secondary"
            style={{ textDecoration: "none", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            Go Home
          </Link>

          <button
            className="form-btn form-btn-primary"
            onClick={() => window.open(`${API_CONFIG.baseUrl}/api/payment/invoice/${order.id}`, "_blank")}
          >
            Download Invoice
          </button>
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

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px dashed rgba(255,255,255,0.1);
        }
        
        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-label {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          font-weight: 500;
        }

        .summary-value {
          font-size: 14px;
          color: #fff;
          font-weight: 600;
          text-align: right;
        }

        .summary-divider {
          height: 1px;
          background: rgba(255,255,255,0.2);
          margin: 12px 0;
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
