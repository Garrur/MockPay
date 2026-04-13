"use client";

import { useAuth, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Flame, Loader2 } from "lucide-react";

export default function SignInPage() {
  const { isLoaded, userId } = useAuth();
  const { signIn } = useSignIn();
  const router = useRouter();

  // Redirect users who are already signed in
  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [isLoaded, userId, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await signIn.password({
        identifier: email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (signIn.status === "complete") {
        await signIn.finalize();
        router.push("/dashboard");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (strategy: "oauth_google" | "oauth_github") => {
    if (!isLoaded || !signIn) return;
    setOauthLoading(strategy);
    try {
      const { error } = await signIn.sso({
        strategy,
        redirectUrl: "/sso-callback",
        redirectCallbackUrl: "/dashboard",
      });
      if (error) throw error;
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || "OAuth sign-in failed. Please try again.";
      setError(msg);
      setOauthLoading(null);
    }
  };

  return (
    <div className="auth-page">
      {/* Ambient background orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Flame size={18} strokeWidth={2.5} />
          </div>
          <span className="auth-logo-text">MockPay</span>
        </div>

        {/* Heading */}
        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your merchant dashboard</p>
        </div>

        {/* OAuth buttons */}
        <div className="auth-oauth">
          <button
            id="google-signin-btn"
            className="auth-oauth-btn auth-oauth-google"
            onClick={() => handleOAuth("oauth_google")}
            disabled={!!oauthLoading}
            type="button"
          >
            {oauthLoading === "oauth_google" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or</span>
          <div className="auth-divider-line" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="signin-email" className="auth-label">Email</label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="auth-input"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-row">
              <label htmlFor="signin-password" className="auth-label">Password</label>
              <Link href="/forgot-password" className="auth-forgot">Forgot password?</Link>
            </div>
            <div className="auth-input-wrapper">
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input auth-input-icon"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          
          <div id="clerk-captcha"></div>

          <button
            id="signin-submit-btn"
            type="submit"
            className="auth-btn-primary"
            disabled={loading || !!oauthLoading}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>Sign In <span>→</span></>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="auth-footer-text">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="auth-link">Sign up</Link>
        </p>

        <div className="auth-trust-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Protected by Clerk
        </div>
      </div>

      <style>{authStyles}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

const authStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff8f1;
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
    overflow: hidden;
    padding: 24px;
  }

  .auth-orb {
    position: absolute;
    border-radius: 9999px;
    filter: blur(80px);
    pointer-events: none;
    animation: float 8s ease-in-out infinite;
  }

  .auth-orb-1 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(204,85,0,0.12) 0%, transparent 70%);
    top: -100px;
    right: -80px;
    animation-delay: 0s;
  }

  .auth-orb-2 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255,180,100,0.10) 0%, transparent 70%);
    bottom: -80px;
    left: -60px;
    animation-delay: -4s;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-20px) scale(1.05); }
  }

  .auth-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 40px;
    width: 100%;
    max-width: 420px;
    box-shadow:
      -8px -8px 20px rgba(255, 248, 241, 0.95),
      8px 8px 24px rgba(180, 130, 80, 0.18),
      0 0 0 1px rgba(224, 192, 178, 0.12);
    animation: fadeInUp 0.4s ease-out both;
    position: relative;
    z-index: 1;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .auth-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 28px;
  }

  .auth-logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #CC5500, #e06820);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(204, 85, 0, 0.3);
  }

  .auth-logo-text {
    font-family: 'Manrope', sans-serif;
    font-weight: 800;
    font-size: 20px;
    color: #221b0a;
    letter-spacing: -0.5px;
  }

  .auth-header {
    margin-bottom: 24px;
  }

  .auth-title {
    font-family: 'Manrope', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #221b0a;
    letter-spacing: -0.8px;
    margin: 0 0 6px;
    line-height: 1.2;
  }

  .auth-subtitle {
    font-size: 14px;
    color: #755a4a;
    margin: 0;
    font-weight: 400;
    line-height: 1.5;
  }

  .auth-oauth {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .auth-oauth-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px 20px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: -0.1px;
  }

  .auth-oauth-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .auth-oauth-google {
    background: #ffffff;
    color: #221b0a;
    box-shadow: 0 2px 8px rgba(180, 130, 80, 0.15), 0 0 0 1px rgba(224, 192, 178, 0.3);
  }

  .auth-oauth-google:hover:not(:disabled) {
    background: #fff8f1;
    box-shadow: 0 4px 16px rgba(180, 130, 80, 0.2), 0 0 0 1px rgba(224, 192, 178, 0.4);
    transform: translateY(-1px);
  }

  .auth-oauth-github {
    background: #1a1a2e;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(26, 26, 46, 0.25);
  }

  .auth-oauth-github:hover:not(:disabled) {
    background: #252540;
    box-shadow: 0 4px 16px rgba(26, 26, 46, 0.35);
    transform: translateY(-1px);
  }

  .auth-oauth-btn:active:not(:disabled) {
    transform: translateY(0px) scale(0.99);
  }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .auth-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(224, 192, 178, 0.4);
  }

  .auth-divider-text {
    font-size: 12px;
    color: #8c7166;
    font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .auth-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .auth-field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .auth-label {
    font-size: 13px;
    font-weight: 600;
    color: #221b0a;
    font-family: 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -0.1px;
  }

  .auth-forgot {
    font-size: 12px;
    color: #CC5500;
    font-weight: 500;
    text-decoration: none;
    transition: opacity 0.2s;
  }

  .auth-forgot:hover {
    opacity: 0.75;
  }

  .auth-input-wrapper {
    position: relative;
  }

  .auth-input {
    width: 100%;
    padding: 12px 16px;
    background: #fdf4ea;
    border: none;
    border-radius: 14px;
    font-size: 14px;
    color: #221b0a;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 400;
    box-shadow:
      inset 3px 3px 8px rgba(180, 130, 80, 0.14),
      inset -2px -2px 6px rgba(255, 255, 255, 0.7);
    outline: none;
    transition: all 0.2s ease;
    box-sizing: border-box;
    letter-spacing: 0.01em;
  }

  .auth-input::placeholder {
    color: #b8967a;
    font-weight: 400;
  }

  .auth-input:focus {
    background: #fef7ee;
    box-shadow:
      inset 4px 4px 10px rgba(180, 130, 80, 0.18),
      inset -2px -2px 6px rgba(255, 255, 255, 0.8),
      0 0 0 2px rgba(204, 85, 0, 0.15);
  }

  .auth-input-icon {
    padding-right: 44px;
  }

  .auth-input-toggle {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #8c7166;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .auth-input-toggle:hover {
    color: #CC5500;
  }

  .auth-error {
    background: rgba(186, 26, 26, 0.07);
    border-radius: 12px;
    padding: 10px 14px;
    font-size: 13px;
    color: #ba1a1a;
    font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    line-height: 1.4;
  }

  .auth-btn-primary {
    width: 100%;
    padding: 14px 24px;
    background: linear-gradient(135deg, #CC5500, #e06820);
    color: white;
    border: none;
    border-radius: 9999px;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Manrope', sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    letter-spacing: -0.2px;
    box-shadow:
      0 4px 16px rgba(204, 85, 0, 0.35),
      0 1px 4px rgba(204, 85, 0, 0.2);
    transition: all 0.2s ease;
    margin-top: 4px;
  }

  .auth-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #b84b00, #cc5f10);
    box-shadow:
      0 6px 22px rgba(204, 85, 0, 0.45),
      0 2px 6px rgba(204, 85, 0, 0.25);
    transform: translateY(-1px);
  }

  .auth-btn-primary:active:not(:disabled) {
    transform: translateY(0px) scale(0.99);
    box-shadow: 0 2px 10px rgba(204, 85, 0, 0.3);
  }

  .auth-btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .auth-footer-text {
    text-align: center;
    font-size: 13.5px;
    color: #755a4a;
    margin: 20px 0 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 400;
  }

  .auth-link {
    color: #CC5500;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.2s;
  }

  .auth-link:hover {
    opacity: 0.75;
  }

  .auth-trust-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-size: 11px;
    color: #b8967a;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 500;
  }

  .auth-helper-text {
    font-size: 11.5px;
    color: #8c7166;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 400;
    line-height: 1.5;
    margin-top: 2px;
  }

  .auth-helper-text a {
    color: #CC5500;
    text-decoration: none;
    font-weight: 500;
  }

  .auth-helper-text a:hover {
    opacity: 0.75;
  }

  @media (max-width: 480px) {
    .auth-card {
      padding: 28px 24px;
      border-radius: 20px;
    }
    .auth-title {
      font-size: 24px;
    }
  }
`;
