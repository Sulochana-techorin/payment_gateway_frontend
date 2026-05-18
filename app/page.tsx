"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="landing-root">
      <div className="landing-card">
        {/* Logo / Icon area */}
        <div className="landing-icon">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="28" fill="url(#grad)" />
            <path d="M17 28C17 21.925 21.925 17 28 17C34.075 17 39 21.925 39 28C39 34.075 34.075 39 28 39C21.925 39 17 34.075 17 28Z" fill="white" fillOpacity="0.15" />
            <path d="M22 28.5L26.5 33L34 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="landing-title">Payment Gateway</h1>
        <p className="landing-subtitle">
          Manage your subscriptions and payments with ease.
        </p>

        <div className="landing-divider" />

        <p className="landing-prompt">Please select how you&apos;d like to continue:</p>

        <div className="landing-buttons">
          {/* User button */}
          <button
            id="btn-user-portal"
            className="landing-btn landing-btn-user"
            onClick={() => router.push("/register")}
          >
            <span className="btn-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span className="btn-text">
              <span className="btn-label">User Portal</span>
              <span className="btn-desc">Register &amp; pay for your subscription</span>
            </span>
            <span className="btn-arrow">→</span>
          </button>

          {/* Active User Login button */}
          <button
            id="btn-active-user-login"
            className="landing-btn landing-btn-login"
            onClick={() => router.push("/login")}
          >
            <span className="btn-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </span>
            <span className="btn-text">
              <span className="btn-label">Active User Login</span>
              <span className="btn-desc">Access your dashboard &amp; manage subscription</span>
            </span>
            <span className="btn-arrow">→</span>
          </button>

          {/* Admin button */}
          <button
            id="btn-admin-portal"
            className="landing-btn landing-btn-admin"
            onClick={() => router.push("/admin")}
          >
            <span className="btn-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <span className="btn-text">
              <span className="btn-label">Admin Panel</span>
              <span className="btn-desc">View payments, users &amp; invoices</span>
            </span>
            <span className="btn-arrow">→</span>
          </button>
        </div>

        <p className="landing-footer">
          Payment Subscription System &mdash; Secure &amp; Reliable
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .landing-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0c29 0%, #1a1042 40%, #24243e 100%);
          font-family: 'Inter', sans-serif;
          padding: 24px;
        }

        .landing-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 24px;
          padding: 48px 40px 40px;
          width: 100%;
          max-width: 480px;
          text-align: center;
          box-shadow: 0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset;
          animation: fadeUp 0.5s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .landing-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
          filter: drop-shadow(0 8px 24px rgba(99,102,241,0.45));
        }

        .landing-title {
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }

        .landing-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 28px;
          line-height: 1.5;
        }

        .landing-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          margin-bottom: 24px;
        }

        .landing-prompt {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
        }

        .landing-buttons {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 32px;
        }

        .landing-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 22px;
          border-radius: 16px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .landing-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.22s ease;
        }

        .landing-btn:hover::before { opacity: 1; }

        .landing-btn:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }

        .landing-btn:active {
          transform: translateY(0) scale(0.99);
        }

        .landing-btn-user {
          background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18));
          border-color: rgba(99,102,241,0.35);
          color: #fff;
        }

        .landing-btn-user:hover {
          background: linear-gradient(135deg, rgba(99,102,241,0.30), rgba(139,92,246,0.30));
          border-color: rgba(99,102,241,0.6);
        }

        .landing-btn-user::before {
          background: radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.15) 0%, transparent 70%);
        }

        .landing-btn-admin {
          background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15));
          border-color: rgba(16,185,129,0.30);
          color: #fff;
        }

        .landing-btn-admin:hover {
          background: linear-gradient(135deg, rgba(16,185,129,0.28), rgba(5,150,105,0.28));
          border-color: rgba(16,185,129,0.55);
        }

        .landing-btn-admin::before {
          background: radial-gradient(ellipse at 30% 50%, rgba(16,185,129,0.12) 0%, transparent 70%);
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .landing-btn-user .btn-icon {
          background: rgba(99,102,241,0.22);
          color: #818cf8;
        }

        .landing-btn-admin .btn-icon {
          background: rgba(16,185,129,0.18);
          color: #34d399;
        }

        .landing-btn-login {
          background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.15));
          border-color: rgba(245,158,11,0.30);
          color: #fff;
        }

        .landing-btn-login:hover {
          background: linear-gradient(135deg, rgba(245,158,11,0.28), rgba(217,119,6,0.28));
          border-color: rgba(245,158,11,0.55);
        }

        .landing-btn-login::before {
          background: radial-gradient(ellipse at 30% 50%, rgba(245,158,11,0.12) 0%, transparent 70%);
        }

        .landing-btn-login .btn-icon {
          background: rgba(245,158,11,0.18);
          color: #fbbf24;
        }

        .btn-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
        }

        .btn-label {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
        }

        .btn-desc {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          font-weight: 400;
        }

        .btn-arrow {
          font-size: 18px;
          color: rgba(255,255,255,0.3);
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .landing-btn:hover .btn-arrow {
          transform: translateX(4px);
          color: rgba(255,255,255,0.7);
        }

        .landing-footer {
          font-size: 11px;
          color: rgba(255,255,255,0.22);
          letter-spacing: 0.3px;
        }
      `}</style>
    </div>
  );
}