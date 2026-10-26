"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Building,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    badgeId: "",
    password: "",
    confirmPassword: "",
    departmentId: "",
    preferredShift: "SHIFT_1_MORNING",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Load departments
  useEffect(() => {
    fetch("/api/public/departments")
      .then((res) => res.json())
      .then((data) => {
        if (data.departments && data.departments.length > 0) {
          setDepartments(data.departments);
          if (!formData.departmentId) {
            setFormData((prev) => ({ ...prev, departmentId: data.departments[0].id }));
          }
        }
      })
      .catch(() => {
        setDepartments([
          { id: "MANDI_PROCUREMENT", code: "MANDI_PROCUREMENT", name: "Mandi Procurement & Weighbridge" },
          { id: "EXPELLER_CRUSHING", code: "EXPELLER_CRUSHING", name: "Mechanical Expeller Crushing" },
          { id: "REFINERY_SEP", code: "REFINERY_SEP", name: "Refinery & Solvent Extraction Plant (SEP)" },
          { id: "QC_LAB", code: "QC_LAB", name: "Quality Control & Analytical Lab" },
          { id: "TANK_FARM_WAREHOUSE", code: "TANK_FARM_WAREHOUSE", name: "Tank Farm & Finished Warehouse" },
          { id: "DISPATCH_LOGISTICS", code: "DISPATCH_LOGISTICS", name: "Sales Dispatch & Weighbridge Exit" },
          { id: "UTILITIES_MAINTENANCE", code: "UTILITIES_MAINTENANCE", name: "Utilities, Boilers & Maintenance" },
          { id: "ADMIN_ACCOUNTS", code: "ADMIN_ACCOUNTS", name: "Executive Admin & Accounts" },
        ]);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Find actual database department id
      const resDept = await fetch("/api/auth/me");
      // Send register
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          badgeId: formData.badgeId,
          password: formData.password,
          departmentId: formData.departmentId,
          preferredShift: formData.preferredShift,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit registration.");
      }

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black text-xl shadow-lg mb-3">
          NP
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          Plant Employee Registration
        </h2>
        <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mt-1">
          State Machine: PENDING_APPROVAL Queue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          {successData ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Registration Submitted Successfully</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your profile has entered the <span className="font-mono font-bold text-amber-700">PENDING_APPROVAL</span> state.
                Super Admin (Ramesh Nagdev) will verify your Badge ID and assign your exact operational role before login is granted.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition"
                >
                  Return to Portal Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Plant Badge ID <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="badgeId"
                    value={formData.badgeId}
                    onChange={handleChange}
                    placeholder="e.g. NGD-EXP-088"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Corporate Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@nagdev.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="+91 98250 00000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Department <span className="text-rose-600">*</span>
                  </label>
                  <select
                    required
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="">Select Division...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Preferred Shift
                  </label>
                  <select
                    name="preferredShift"
                    value={formData.preferredShift}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="SHIFT_1_MORNING">Shift 1 (06:00 – 14:00)</option>
                    <option value="SHIFT_2_EVENING">Shift 2 (14:00 – 22:00)</option>
                    <option value="SHIFT_3_NIGHT">Shift 3 (22:00 – 06:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>{loading ? "Submitting Registration..." : "Submit for Super Admin Approval"}</span>
                </button>
              </div>

              <div className="text-center pt-2 text-xs text-slate-500">
                Already approved?{" "}
                <Link href="/login" className="font-semibold text-amber-700 hover:underline">
                  Sign in here
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
