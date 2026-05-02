"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Lock, 
  Key,
  ArrowRight, 
  Shield, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from "lucide-react";
import axios from "axios";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, set_email] = useState("");
  const [code, set_code] = useState("");
  const [password, set_password] = useState("");
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");
  const [success, set_success] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) set_email(emailParam);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    set_loading(true);
    set_error("");

    // Password validation: 6 characters with mixed alphabets (at least one uppercase and one lowercase)
    const has_upper = /[A-Z]/.test(password);
    const has_lower = /[a-z]/.test(password);
    
    if (password.length !== 6) {
      set_error("Password must be exactly 6 characters long.");
      set_loading(false);
      return;
    }
    
    if (!has_upper || !has_lower) {
      set_error("Password must contain mixed alphabet (both uppercase and lowercase).");
      set_loading(false);
      return;
    }

    try {
      await axios.post("http://localhost:3333/api/auth/reset_password", { 
        email, 
        code, 
        password 
      });
      set_success(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (e) {
      console.error("Reset password failed:", e);
      set_error(e.response?.data?.message || "Invalid code or failed to reset password.");
      set_loading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md mx-auto w-full relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Reset Password</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter the code sent to your email and choose a new password
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-8">
            {success ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Success!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your password has been reset successfully. Redirecting to login...
                </p>
                <div className="pt-4">
                   <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                  </div>
                )}

                {!searchParams.get("email") && (
                   <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                     Email Address
                   </label>
                   <input
                     type="email"
                     required
                     value={email}
                     onChange={(e) => set_email(e.target.value)}
                     className="block w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                   />
                 </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Reset Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => set_code(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                      placeholder="Enter 6-digit code"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => set_password(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">6 characters, mixed case</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center group disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Reset Password <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <a href="/login" className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
