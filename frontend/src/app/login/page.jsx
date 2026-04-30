"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Shield, 
  Briefcase, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from "lucide-react";
import axios from "axios";
import { useApp } from "@/context/AppContext";

export default function LoginPage() {
  const { login: setAuth } = useApp();
  const router = useRouter();
  const [email, set_email] = useState("");
  const [password, set_password] = useState("");
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    set_loading(true);
    set_error("");

    // Email validation
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      set_error("Email is required.");
      set_loading(false);
      return;
    }
    if (!email_regex.test(email)) {
      set_error("Please enter a valid email address.");
      set_loading(false);
      return;
    }

    // Password validation: 6 characters with mixed alphabets (at least one uppercase and one lowercase)
    if (!password) {
      set_error("Password is required.");
      set_loading(false);
      return;
    }
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
      const response = await axios.post("http://localhost:3333/api/auth/login", {password:password, email:email},{withCredentials:true});
      
      const { role } = response.data;
      
      setAuth(); // Update global auth state immediately

      // Redirect based on role
      if (role === "freelancer") {
        router.push("/freelancer/dashboard");
      } else if (role === "employer") {
        router.push("/employer");
      } else if (role === "verifier") {
        router.push("/verifier");
      } else {
        router.push("/");
      }
      
    } catch(e){
      console.error("Login failed:", e);
      set_error(e.response?.data?.message || "Invalid email or password. Please try again.");
      set_loading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md mx-auto w-full relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Log in to manage your decentralized work and payments
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-indigo-100/20 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => set_email(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <a href="/forget-password" title="Reset your password" className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => set_password(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>


              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Don't have an account?{" "}
                <a href="/register" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                  Sign Up
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Info Blocks for Demo */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <Briefcase className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Freelancer</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <User className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employer</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <Shield className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verifier</p>
          </div>
        </div>
      </div>
    </div>
  );
}
