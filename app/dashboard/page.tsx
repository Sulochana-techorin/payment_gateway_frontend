"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  API_CONFIG,
  API_ROUTES,
  buildApiUrl,
  formatPrice,
} from "@/app/utils/properties";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  userCount: number;
};

type SubscriptionData = {
  hasSubscription: boolean;
  order: {
    id: string;
    user_count: number;
    base_price: number;
    price_per_user: number;
    subscription_amount: number;
    total_amount: number;
    status: string;
    currency: string;
    payhere_subscription_id: string | null;
  } | null;
  subscription: {
    id: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cardUpdateMsg, setCardUpdateMsg] = useState("");

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Card update
  const [isUpdatingCard, setIsUpdatingCard] = useState(false);

  // Cancel subscription
  const [isCancelling, setIsCancelling] = useState(false);

  // New subscription
  const [newUserCount, setNewUserCount] = useState(1);

  // Detect card update return from PayHere and confirm with backend
  useEffect(() => {
    const cardUpdated = searchParams.get("cardUpdated");
    if (cardUpdated === "true") {
      setCardUpdateMsg("Card details updated successfully! Your new card will be used for future charges.");

      // Call backend to send confirmation email
      // (PayHere webhook may not reach localhost, so we trigger the email directly)
      const token = localStorage.getItem("auth_token");
      if (token) {
        fetch(buildApiUrl(API_ROUTES.USER.CONFIRM_CARD_UPDATE), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(API_CONFIG.timeout),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              console.log("✅ Card update email sent to:", data.emailSentTo);
            } else {
              console.warn("⚠️ Card update confirmed but email failed:", data.message);
            }
          })
          .catch((err) => {
            console.error("Failed to confirm card update:", err);
          });
      }
    } else if (cardUpdated === "false") {
      setCardUpdateMsg("Card update was cancelled.");
    }
  }, [searchParams]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const [profileRes, subRes] = await Promise.all([
          fetch(buildApiUrl(API_ROUTES.USER.PROFILE), {
            headers: getAuthHeaders(),
            signal: AbortSignal.timeout(API_CONFIG.timeout),
          }),
          fetch(buildApiUrl(API_ROUTES.USER.SUBSCRIPTION), {
            headers: getAuthHeaders(),
            signal: AbortSignal.timeout(API_CONFIG.timeout),
          }),
        ]);

        if (profileRes.status === 401 || subRes.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          router.push("/login");
          return;
        }

        if (!profileRes.ok) throw new Error("Failed to load profile");

        const profileData = await profileRes.json();
        setProfile(profileData);
        setEditName(profileData.name);
        setEditEmail(profileData.email);

        if (subRes.ok) {
          const subDataRes = await subRes.json();
          setSubData(subDataRes);
        }

        if (profileData.userCount) {
          setNewUserCount(profileData.userCount);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg("");

    try {
      const res = await fetch(buildApiUrl(API_ROUTES.USER.PROFILE), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: editName, email: editEmail }),
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveMsg(data.message || "Update failed");
        return;
      }

      setProfile(data);
      setEditMode(false);
      setSaveMsg("Profile updated successfully");

      // Update local storage
      localStorage.setItem("auth_user", JSON.stringify({
        userId: data.id,
        name: data.name,
        email: data.email,
      }));
    } catch {
      setSaveMsg("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCard = async () => {
    if (!subData?.order) return;

    setIsUpdatingCard(true);
    setError("");

    try {
      // Call the card update preapproval endpoint (NOT payment initiation!)
      const res = await fetch(buildApiUrl(API_ROUTES.USER.UPDATE_CARD), {
        method: "POST",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to initiate card update");
        setIsUpdatingCard(false);
        return;
      }

      // Redirect to PayHere preapproval (card entry only, no payment!)
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
      console.error(err);
      setError("Card update failed");
      setIsUpdatingCard(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? This action cannot be undone.")) return;

    setIsCancelling(true);
    setError("");

    try {
      const res = await fetch(buildApiUrl(API_ROUTES.USER.CANCEL_SUBSCRIPTION), {
        method: "POST",
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to cancel subscription");
        return;
      }

      setSaveMsg("Subscription cancelled successfully.");
      // Reload sub data
      const subRes = await fetch(buildApiUrl(API_ROUTES.USER.SUBSCRIPTION), {
        headers: getAuthHeaders(),
      });
      if (subRes.ok) {
        setSubData(await subRes.json());
      }
    } catch (err) {
      console.error(err);
      setError("Failed to cancel subscription");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleStartNewSubscription = async () => {
    if (!profile?.id) return;
    
    try {
      const res = await fetch(buildApiUrl(API_ROUTES.ORDER.CREATE), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: profile.id, user_count: newUserCount }),
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      });

      const data = await res.json();
      if (res.ok && data?.order?.id) {
        router.push(`/summary?orderId=${data.order.id}`);
      } else {
        setError(data.message || "Failed to create new subscription order");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to create new subscription order");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="dash-root">
        <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}>Loading dashboard...</p>
        <style>{dashStyles}</style>
      </div>
    );
  }

  return (
    <div className="dash-root">
      <div className="dash-container">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">My Dashboard</h1>
            <p className="dash-subtitle">Manage your profile and subscription</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
        {saveMsg && <p className={saveMsg.includes("success") ? "form-success" : "form-error"}>{saveMsg}</p>}
        {cardUpdateMsg && (
          <p className={cardUpdateMsg.includes("successfully") ? "form-success" : "form-warning"}>
            {cardUpdateMsg}
          </p>
        )}

        {/* Profile Section */}
        <div className="dash-card">
          <div className="card-header">
            <div className="card-icon card-icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="card-title">Profile Information</h2>
            {!editMode && (
              <button className="edit-btn" onClick={() => setEditMode(true)}>Edit</button>
            )}
          </div>

          {editMode ? (
            <div className="card-body">
              <div className="form-group-sm">
                <label className="form-label-sm">Name</label>
                <input className="form-input-sm" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="form-group-sm">
                <label className="form-label-sm">Email</label>
                <input className="form-input-sm" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="edit-actions">
                <button className="action-btn action-btn-cancel" onClick={() => { setEditMode(false); setEditName(profile?.name || ""); setEditEmail(profile?.email || ""); }}>Cancel</button>
                <button className="action-btn action-btn-save" onClick={handleSaveProfile} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </div>
          ) : (
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Customer ID</span>
                <span className="info-value">{profile?.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Name</span>
                <span className="info-value">{profile?.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value">{profile?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">User Count</span>
                <span className="info-value">{profile?.userCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Section */}
        <div className="dash-card">
          <div className="card-header">
            <div className="card-icon card-icon-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <h2 className="card-title">Subscription Details</h2>
          </div>

          {subData?.hasSubscription && subData.subscription && subData.order ? (
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className={`status-badge ${subData.subscription.status === "ACTIVE" ? "status-active" : "status-inactive"}`}>
                  {subData.subscription.status}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Order ID</span>
                <span className="info-value info-mono">{subData.order.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Registration Fee</span>
                <span className="info-value">{formatPrice(subData.order.base_price, subData.order.currency)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Subscription Amount</span>
                <span className="info-value">{formatPrice(subData.order.subscription_amount, subData.order.currency)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Total Amount</span>
                <span className="info-value info-highlight">{formatPrice(subData.order.total_amount, subData.order.currency)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Start Date</span>
                <span className="info-value">{new Date(subData.subscription.start_date).toLocaleDateString()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">End Date</span>
                <span className="info-value">{new Date(subData.subscription.end_date).toLocaleDateString()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Users</span>
                <span className="info-value">{subData.order.user_count}</span>
              </div>
              
            </div>
          ) : (
            <div className="card-body">
              <p className="no-data">No active subscription found.</p>
            </div>
          )}
        </div>

        {/* Card Management Section */}
        <div className="dash-card">
          <div className="card-header">
            <div className="card-icon card-icon-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <h2 className="card-title">Payment Method</h2>
          </div>

          <div className="card-body">
            {subData?.hasSubscription && subData.order?.status === "ACTIVE" ? (
              <>
                <div className="card-visual">
                  <div className="credit-card-mock">
                    <div className="cc-chip"></div>
                    <div className="cc-number">•••• •••• •••• ••••</div>
                    <div className="cc-details">
                      <div>
                        <div className="cc-label">CARD HOLDER</div>
                        <div className="cc-text">{profile?.name || "—"}</div>
                      </div>
                      <div>
                        <div className="cc-label">STATUS</div>
                        <div className="cc-text cc-active">Active</div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="card-note">
                  Update your payment card to change the card used for future subscription charges.
                  You will be redirected to PayHere to securely enter your new card details.
                </p>

                <button
                  className="action-btn action-btn-update"
                  onClick={handleUpdateCard}
                  disabled={isUpdatingCard}
                >
                  {isUpdatingCard ? "Redirecting to PayHere..." : "Update Card Details"}
                </button>
              </>
            ) : (
              <p className="no-data">No active payment method. Complete a subscription first.</p>
            )}
          </div>
        </div>
      </div>

      <style>{dashStyles}</style>
    </div>
  );
}

const dashStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .dash-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0c29 0%, #1a1042 40%, #24243e 100%);
    font-family: 'Inter', sans-serif;
    padding: 32px 24px;
    display: flex;
    justify-content: center;
  }

  .dash-container {
    width: 100%;
    max-width: 640px;
    animation: fadeUp 0.4s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
  }

  .dash-title {
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    margin-bottom: 4px;
  }

  .dash-subtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.4);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(248,113,113,0.12);
    border: 1px solid rgba(248,113,113,0.25);
    color: #f87171;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s;
  }
  .logout-btn:hover {
    background: rgba(248,113,113,0.2);
    border-color: rgba(248,113,113,0.4);
  }

  .dash-card {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 20px;
    padding: 0;
    margin-bottom: 20px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.3);
    overflow: hidden;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .card-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .card-icon-blue {
    background: rgba(99,102,241,0.18);
    color: #818cf8;
  }

  .card-icon-green {
    background: rgba(52,211,153,0.15);
    color: #34d399;
  }

  .card-icon-amber {
    background: rgba(251,191,36,0.15);
    color: #fbbf24;
  }

  .card-title {
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    flex: 1;
  }

  .edit-btn {
    background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.3);
    color: #818cf8;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s;
  }
  .edit-btn:hover {
    background: rgba(99,102,241,0.25);
  }

  .card-body {
    padding: 20px 24px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px dashed rgba(255,255,255,0.07);
  }
  .info-row:last-child { border-bottom: none; }

  .info-label {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    font-weight: 500;
  }

  .info-value {
    font-size: 13px;
    color: #fff;
    font-weight: 600;
    text-align: right;
  }

  .info-mono {
    font-family: monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.6);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info-highlight {
    color: #34d399;
    font-weight: 700;
  }

  .status-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-active {
    background: rgba(52,211,153,0.15);
    color: #34d399;
    border: 1px solid rgba(52,211,153,0.25);
  }

  .status-inactive {
    background: rgba(248,113,113,0.12);
    color: #f87171;
    border: 1px solid rgba(248,113,113,0.2);
  }

  .no-data {
    font-size: 13px;
    color: rgba(255,255,255,0.35);
    text-align: center;
    padding: 20px 0;
  }

  /* Edit form */
  .form-group-sm { margin-bottom: 14px; }

  .form-label-sm {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 5px;
  }

  .form-input-sm {
    width: 100%;
    padding: 10px 14px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    color: #fff;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }
  .form-input-sm:focus {
    border-color: rgba(99,102,241,0.5);
    background: rgba(99,102,241,0.06);
  }

  .edit-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }

  .action-btn {
    flex: 1;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    border: none;
    transition: all 0.2s;
  }

  .action-btn-cancel {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
    border: 1px solid rgba(255,255,255,0.12);
  }
  .action-btn-cancel:hover { background: rgba(255,255,255,0.14); }

  .action-btn-save {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    box-shadow: 0 3px 12px rgba(99,102,241,0.3);
  }
  .action-btn-save:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(99,102,241,0.45); transform: translateY(-1px); }
  .action-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

  .action-btn-update {
    width: 100%;
    padding: 12px 20px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(245,158,11,0.3);
    margin-top: 16px;
  }
  .action-btn-update:hover:not(:disabled) { box-shadow: 0 8px 24px rgba(245,158,11,0.45); transform: translateY(-1px); }
  .action-btn-update:disabled { opacity: 0.5; cursor: not-allowed; }

  .action-btn-cancel-sub {
    width: 100%;
    padding: 12px 20px;
    background: rgba(248,113,113,0.12);
    color: #f87171;
    border: 1px solid rgba(248,113,113,0.25);
    font-size: 14px;
    font-weight: 600;
    border-radius: 12px;
    margin-top: 10px;
  }
  .action-btn-cancel-sub:hover:not(:disabled) {
    background: rgba(248,113,113,0.2);
    border-color: rgba(248,113,113,0.4);
  }
  .action-btn-cancel-sub:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Credit card visual */
  .card-visual {
    margin-bottom: 16px;
  }

  .credit-card-mock {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .credit-card-mock::before {
    content: '';
    position: absolute;
    top: -30%;
    right: -20%;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(99,102,241,0.1);
  }

  .cc-chip {
    width: 36px;
    height: 26px;
    background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
    border-radius: 6px;
    margin-bottom: 20px;
  }

  .cc-number {
    font-size: 18px;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
    letter-spacing: 3px;
    font-family: 'Courier New', monospace;
    margin-bottom: 20px;
  }

  .cc-details {
    display: flex;
    justify-content: space-between;
  }

  .cc-label {
    font-size: 9px;
    color: rgba(255,255,255,0.35);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2px;
  }

  .cc-text {
    font-size: 12px;
    color: rgba(255,255,255,0.8);
    font-weight: 600;
  }

  .cc-active {
    color: #34d399;
  }

  .card-note {
    font-size: 12px;
    color: rgba(255,255,255,0.4);
    line-height: 1.6;
    margin-bottom: 4px;
  }

  .form-error {
    font-size: 13px;
    color: #f87171;
    background: rgba(248,113,113,0.1);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 16px;
  }

  .form-success {
    font-size: 13px;
    color: #34d399;
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.2);
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 16px;
  }
`;
