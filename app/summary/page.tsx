"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  API_CONFIG,
  API_ROUTES,
  ERROR_MESSAGES,
  formatPrice,
  buildApiUrl,
} from "@/app/utils/properties";

type Order = {
  id: string;
  user_id: number; // 🔥 IMPORTANT (you need this later)
  base_price: number;
  user_count: number;
  price_per_user: number;
  subscription_amount: number;
  total_amount: number;
  status: string;
  currency?: string;
};

function SummaryContent() {
  const params = useSearchParams();
  const router = useRouter();

  const orderId = params.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const handleProceedToPayment = async () => {
    if (!orderId) {
      setError(ERROR_MESSAGES.REQUIRED_FIELD);
      return;
    }

    try {
      setIsPaying(true);
      setError("");

      const res = await fetch(buildApiUrl(API_ROUTES.PAYMENT.INITIATE), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || ERROR_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      // 🔥 PayHere redirect (one-time payment)
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.checkoutUrl;

      Object.entries(data.fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("❌ PAYMENT INIT ERROR:", err);
      setError("Payment initialization failed");
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const url = buildApiUrl(`${API_ROUTES.ORDER.GET_BY_ID}/${orderId}`);

        const res = await fetch(url, {
          signal: AbortSignal.timeout(API_CONFIG.timeout),
        });

        if (!res.ok) throw new Error("Fetch failed");

        const data = (await res.json()) as Order;
        setOrder(data);
      } catch (err) {
        console.error("❌ FETCH ERROR:", err);
        setError(ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (!orderId) {
    return <p style={{ color: "red", textAlign: "center", marginTop: 50 }}>
      {ERROR_MESSAGES.REQUIRED_FIELD}
    </p>;
  }

  if (error) {
    return <p style={{ color: "red", textAlign: "center", marginTop: 50 }}>{error}</p>;
  }

  if (!order) {
    return <p style={{ textAlign: "center", marginTop: 50 }}>Loading...</p>;
  }

  return (
    <div className="reg-root">
      <div className="reg-card">
        <h1 className="reg-title" style={{ textAlign: "center" }}>Subscription Summary</h1>
        <p className="reg-subtitle" style={{ textAlign: "center" }}>Review your subscription details</p>

        <div className="summary-details" style={{ marginTop: 20, marginBottom: 30 }}>
          <div className="summary-row">
            <span className="summary-label">Registration Fee</span>
            <span className="summary-value">{formatPrice(order.base_price, order.currency)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">User Count</span>
            <span className="summary-value">{order.user_count}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Per User / Month</span>
            <span className="summary-value">{formatPrice(order.price_per_user, order.currency)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Monthly</span>
            <span className="summary-value">{formatPrice(order.subscription_amount, order.currency)}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row" style={{ marginTop: 12 }}>
            <span className="summary-label" style={{ color: "#fff", fontWeight: 700 }}>Pay Today</span>
            <span className="summary-value" style={{ color: "#34d399", fontWeight: 800, fontSize: 18 }}>{formatPrice(order.total_amount, order.currency)}</span>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="form-btn form-btn-secondary"
            onClick={() => router.back()}
          >
            ← Back
          </button>
          <button
            className="form-btn form-btn-primary"
            onClick={handleProceedToPayment}
            disabled={isPaying}
          >
            {isPaying ? "Redirecting…" : "Start Subscription"}
          </button>
        </div>
      </div>

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
        .form-btn-primary:hover:not(:disabled) {
          box-shadow: 0 8px 24px rgba(99,102,241,0.5);
          transform: translateY(-1px);
        }
        .form-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .form-btn-secondary {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .form-btn-secondary:hover:not(:disabled) {
          background: rgba(255,255,255,0.14);
          transform: translateY(-1px);
        }
        .form-btn-secondary:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: "center", marginTop: 50 }}>Loading summary...</p>}>
      <SummaryContent />
    </Suspense>
  );
}