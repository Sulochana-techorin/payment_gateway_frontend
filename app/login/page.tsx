"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  API_CONFIG,
  API_ROUTES,
  ERROR_MESSAGES,
  buildApiUrl,
} from "@/app/utils/properties";

export default function LoginPage() {
  const router = useRouter();

  const [customerId, setCustomerId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!customerId || !email || !password) {
      setError("All fields are required");
      return;
    }

    const parsedId = parseInt(customerId, 10);

    if (isNaN(parsedId) || parsedId <= 0) {
      setError("Customer ID must be a positive number");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(buildApiUrl(API_ROUTES.AUTH.LOGIN), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: parsedId,
          email,
          password,
        }),
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || ERROR_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      // Store auth data
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify({
        userId: data.userId,
        name: data.name,
        email: data.email,
      }));

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError(ERROR_MESSAGES.API_SERVER_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-root">
      <div className="reg-card">
        <button className="back-btn" onClick={() => router.push("/")}>
          ← Back
        </button>

        <div className="login-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="24" fill="rgba(251,191,36,0.15)" />
            <path d="M24 14C19.582 14 16 17.582 16 22V26C16 30.418 19.582 34 24 34C28.418 34 32 30.418 32 26V22C32 17.582 28.418 14 24 14Z" fill="rgba(251,191,36,0.2)" />
            <path d="M20 22V20C20 17.791 21.791 16 24 16C26.209 16 28 17.791 28 20V22" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <rect x="18" y="22" width="12" height="10" rx="2" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="24" cy="27" r="1.5" fill="#fbbf24" />
          </svg>
        </div>

        <h1 className="reg-title">Welcome Back</h1>
        <p className="reg-subtitle">Sign in to your account</p>

        <div className="form-group">
          <label className="form-label">Customer ID</label>
          <input
            id="input-customer-id"
            className="form-input"
            type="number"
            placeholder="Enter your Customer ID"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            min={1}
          />
        </div>

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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          id="btn-login"
          className="form-btn form-btn-login"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
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

        .login-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
          filter: drop-shadow(0 8px 24px rgba(251,191,36,0.3));
        }

        .reg-title {
          font-size: 26px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 6px;
          text-align: center;
        }

        .reg-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 28px;
          text-align: center;
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
          border-color: rgba(251,191,36,0.6);
          background: rgba(251,191,36,0.06);
        }

        .form-input[type="number"]::-webkit-inner-spin-button { opacity: 0.4; }

        .form-error {
          font-size: 13px;
          color: #f87171;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 14px;
        }

        .form-btn-login {
          width: 100%;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          border: none;
          transition: all 0.2s ease;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff;
          box-shadow: 0 4px 16px rgba(245,158,11,0.35);
          margin-top: 8px;
        }
        .form-btn-login:hover:not(:disabled) {
          box-shadow: 0 8px 24px rgba(245,158,11,0.5);
          transform: translateY(-1px);
        }
        .form-btn-login:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
