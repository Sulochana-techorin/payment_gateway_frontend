"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  API_CONFIG,
  API_ROUTES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  UI,
  buildApiUrl,
} from "@/app/utils/properties";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userCount, setUserCount] = useState(1);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [userId, setUserId] = useState<number | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔥 SUBMIT (create user)
  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!email || !password || !confirmPassword) {
      setError(ERROR_MESSAGES.REQUIRED_FIELD);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (userCount < 0) {
      setError(ERROR_MESSAGES.INVALID_USER_COUNT);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(buildApiUrl(API_ROUTES.AUTH.REGISTER), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "User",
          email,
          password,
          userCount,
        }),
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      });

      const data = await res.json();
      console.log("REGISTER RESPONSE:", data);

      if (!res.ok) {
        setError(data.message || ERROR_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      if (!data.userId) {
        setError("User ID not returned from backend");
        return;
      }

      setUserId(data.userId);
      setMessage(SUCCESS_MESSAGES.USER_REGISTERED);
      setIsRegistered(true);

    } catch (err) {
      console.error(err);
      setError(ERROR_MESSAGES.API_SERVER_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 NEXT BUTTON (create order then open summary)
  const handleNext = async () => {
    if (!isRegistered || !userId) {
      setError("Please register first");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // ✅ STEP 1: Create Order
      const res = await fetch(buildApiUrl(API_ROUTES.ORDER.CREATE), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
        }),
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      });

      const data = await res.json();
      console.log("ORDER RESPONSE:", data);

      if (!res.ok) {
        setError(data.message || ERROR_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      const orderId = data?.order?.id;

      if (!orderId) {
        setError("Order ID not returned from backend");
        return;
      }

      console.log("ORDER ID:", orderId);

      router.push(`/summary?orderId=${orderId}`);

    } catch (err) {
      console.error(err);
      setError(ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-root">
      <div className="reg-card">
        {/* Back button */}
        <button className="back-btn" onClick={() => router.push("/")}>
          ← Back
        </button>

        <h1 className="reg-title">Create Account</h1>
        <p className="reg-subtitle">Register to start your subscription</p>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            id="input-email"
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            id="input-password"
            className="form-input"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input
            id="input-confirm-password"
            className="form-input"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Number of Users</label>
          <input
            id="input-user-count"
            className="form-input"
            type="number"
            min={UI.INPUT.MIN_USERS}
            value={userCount}
            onChange={(e) => setUserCount(Number(e.target.value))}
          />
        </div>

        {message && <p className="form-success">{message}</p>}
        {userId && <p className="form-info">User ID: {userId}</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button
            id="btn-submit-register"
            className="form-btn form-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Processing…" : "Register"}
          </button>

          <button
            id="btn-next"
            className="form-btn form-btn-secondary"
            onClick={handleNext}
            disabled={!isRegistered || loading}
          >
            Next →
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

        .back-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          margin-bottom: 24px;
          font-family: 'Inter', sans-serif;
          transition: color 0.2s;
        }
        .back-btn:hover { color: rgba(255,255,255,0.8); }

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

        .form-group {
          margin-bottom: 18px;
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 7px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .form-input::placeholder { color: rgba(255,255,255,0.25); }
        .form-input:focus {
          border-color: rgba(99,102,241,0.6);
          background: rgba(99,102,241,0.08);
        }

        .form-input[type="number"]::-webkit-inner-spin-button { opacity: 0.4; }

        .form-success {
          font-size: 13px;
          color: #34d399;
          background: rgba(52,211,153,0.1);
          border: 1px solid rgba(52,211,153,0.2);
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 14px;
        }

        .form-info {
          font-size: 13px;
          color: #818cf8;
          margin-bottom: 10px;
        }

        .form-error {
          font-size: 13px;
          color: #f87171;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 14px;
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
