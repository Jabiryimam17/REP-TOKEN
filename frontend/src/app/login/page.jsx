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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock User Logic based on email prefix or just a random mock
    // In a real app, this would come from the backend API
    let user = null;
    
    if (email.includes("freelancer")) {
      user = { name: "Alex Rivera", role: "freelancer" };
    } else if (email.includes("employer")) {
      user = { name: "Nexus Finance", role: "employer" };
    } else if (email.includes("verifier")) {
      user = { name: "Marcus Aurelius", role: "verifier" };
    } else {
      // Default mock for demo
      user = { name: "Demo User", role: "freelancer" };
    }

    if (password === "password" || email.length > 5) {
      console.log("Logged in as:", user);
      
      // Redirect based on role
      if (user.role === "freelancer") {
        router.push("/freelancer/dashboard");
      } else if (user.role === "employer") {
        router.push("/employer");
      } else if (user.role === "verifier") {
        router.push("/verifier");
      }
    } else {
      setError("Invalid email or password. Hint: use 'freelancer@demo.com' and any password.");
      setLoading(false);
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
                    onChange={(e) => setEmail(e.target.value)}
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
                  <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
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
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded transition-all"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-400">
                  Remember me for 30 days
                </label>
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
                  Join Platform
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
