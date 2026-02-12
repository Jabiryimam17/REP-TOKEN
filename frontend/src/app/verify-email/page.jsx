"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  Lock
} from "lucide-react";
import axios from "axios";

export default function VerifyEmailPage() {
  const [code, set_code] = useState(["", "", "", "", "", ""]);
  const [is_verifying, set_is_verifying] = useState(false);
  const [is_resending, set_is_resending] = useState(false);
  const [status, set_status] = useState("idle"); // idle, success, error
  const [timer, set_timer] = useState(0);
  const input_refs = useRef([]);
  const [email, set_email] = useState("");
  const email_input_ref = useRef(null);




  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        set_timer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handle_code_resend = async () => {
    if (!email) {
      console.error("Email is required to resend verification code");
      return;
    }
    set_is_resending(true);
    set_timer(60);
    try {
      const res = await axios.post("http://localhost:3333/api/auth/send_code", { email });
      if (res.status === 200) {
        console.log("Verification code resent successfully");
      } else {
        console.error("Failed to resend verification code");
      }
    } catch (error) {
      console.error("Failed to resend verification code", error);
    } finally {
      set_is_resending(false);
    }
  }

  const handle_verify_email = async () => {
    if (!email || code.join("").length !== 6) {
      console.error("Invalid email or code");
      return;
    }
    set_is_verifying(true);
    set_status("idle");
    try {
      const res = await axios.post("http://localhost:3333/api/auth/verify_email", { email, code: code.join("") });
      if (res.status === 200) {
        console.log("Email verified successfully");
        set_status("success");
      } else {
        console.error("Failed to verify email");
        set_status("error");
      }
    } catch (error) {
      console.error("Failed to verify email", error);
      set_status("error");
    } finally {
      set_is_verifying(false);
    }
  }
  const handle_change = (index, value) => {
    const new_code = [...code];
    new_code[index] = value.substring(value.length - 1);
    set_code(new_code);

    // Move to next input
    if (value && index < 5) {
      input_refs.current[index + 1].focus();
    }
  };

  const handle_key_down = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      input_refs.current[index - 1].focus();
    }
  };

  const handle_verify = async (e) => {
    e.preventDefault();
    await handle_verify_email();
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none mb-6">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Verify Your Email</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Enter your email and the 6-character verification code
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-indigo-100/20 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 sm:p-10">
          {status === "success" ? (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Email Verified!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                Your account is now fully verified. You can now access all platform features.
              </p>
              <a 
                href="/login"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center group"
              >
                Go to Log In <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          ) : (
            <form onSubmit={handle_verify}>
              {/* Email Input */}
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    ref={email_input_ref}
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => set_email(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-12 pr-4 py-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Verification Code Input */}
              <div className="mb-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Verification Code
                </label>
              </div>
              <div className="flex justify-between gap-2 mb-8">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (input_refs.current[index] = el)}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handle_change(index, e.target.value)}
                    onKeyDown={(e) => handle_key_down(index, e)}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-2xl border bg-slate-50 dark:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      status === "error" 
                      ? "border-red-500 text-red-600 dark:text-red-400 ring-red-100" 
                      : "border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white"
                    }`}
                  />
                ))}
              </div>

              {status === "error" && (
                <div className="flex items-center justify-center text-red-600 dark:text-red-400 text-sm font-bold mb-6 animate-shake">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  The code you entered is incorrect. Please try again.
                </div>
              )}

              <button
                type="submit"
                disabled={is_verifying || code.some(d => d === "") || !email}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center group"
              >
                {is_verifying ? (
                  <>
                    <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                    Verifying Email...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Verify Email
                  </>
                )}
              </button>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={handle_code_resend}
                  disabled={timer > 0 || is_resending || !email}
                  className="inline-flex items-center justify-center px-6 py-3 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {is_resending ? (
                    <>
                      <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      {timer > 0 ? `Resend Code in ${timer}s` : "Resend Verification Code"}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center space-y-6">
          <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
            <Lock className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Secure Verification Protocol</span>
          </div>
          
          <button className="flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
