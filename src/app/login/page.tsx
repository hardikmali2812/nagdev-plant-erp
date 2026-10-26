"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Shield } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check URL error params
  const urlError = searchParams.get("error");
  const pendingError = urlError === "pending_approval";
  const sessionExpired = urlError === "session_expired";
  const deptForbidden = urlError === "access_denied_department_silo";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // If 'from' query param exists, navigate to it, otherwise data.redirectUrl
      const fromParam = searchParams.get("from");
      const destination =
        fromParam && fromParam.startsWith("/") && fromParam !== "/login"
          ? fromParam
          : data.redirectUrl || "/admin";

      // Full window location navigate to guarantee fresh cookie delivery to server
      window.location.href = destination;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Banner Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-amber-500 text-slate-950 font-black text-2xl shadow-lg mb-4">
          NP
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
          Nagdev Products
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-amber-400 font-semibold uppercase tracking-wider">
          Plant Operations Portal & Factory ERP
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Castor Oil Extraction, Refining & Analytical Quality Complex
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          {/* Error notifications */}
          {(error || pendingError || sessionExpired || deptForbidden) && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Authentication Notice:</strong>
                {error ||
                  (pendingError &&
                    "Your application is currently PENDING_APPROVAL by Super Admin. You cannot access plant consoles until Ramesh Nagdev or HR approves your account.") ||
                  (sessionExpired && "Your session has expired. Please log in again.") ||
                  (deptForbidden &&
                    "Department Isolation: You were redirected back because non-admin employees are strictly restricted from accessing other department silos.")}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Badge ID or Email Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. NGD-DIR-001 or admin@nagdev.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Accepts Badge ID (e.g. <span className="font-mono font-semibold text-slate-700">NGD-DIR-001</span> or <span className="font-mono font-semibold text-slate-700">NGD DIR 001</span>) or email.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Secure Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <span>{loading ? "Verifying Credentials..." : "Sign In to Operations Portal"}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </form>

          {/* Registration Link */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-600">
            <span>New plant employee or operator? </span>
            <Link
              href="/register"
              className="font-bold text-amber-700 hover:text-amber-800 underline ml-1"
            >
              Submit Registration for Admin Approval
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-sm font-semibold">
          Loading portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
