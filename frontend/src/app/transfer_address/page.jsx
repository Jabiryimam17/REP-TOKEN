"use client";

import { useState } from "react";
import { isAddress } from "ethers";
import { transfer_address } from "@/services/freelancers.service";
import { 
  ArrowRightLeft, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Wallet,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export default function TransferAddressPage() {
  const [newAddress, setNewAddress] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();

    const target = newAddress.trim();
    if (!isAddress(target)) {
      setStatus({ type: "error", message: "Please enter a valid Ethereum address." });
      return;
    }

    setStatus({ type: "loading", message: "Initiating on-chain transfer..." });

    try {
      const previous = await transfer_address(target);
      setStatus({
        type: "success",
        message: `Successfully transferred from ${previous.substring(0, 6)}...${previous.substring(38)} to ${target.substring(0, 6)}...${target.substring(38)}.`,
      });
      setNewAddress("");
    } catch (error) {
      console.error("Transfer error:", error);
      const feedback = error?.info?.error?.message || error?.message || "Transfer failed. Please ensure you are the registered freelancer and have no ongoing jobs.";
      setStatus({ type: "error", message: feedback });
    }
  };

  const isBusy = status.type === "loading";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none mb-6">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Transfer Address</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Move your freelancer profile and reputation to a new wallet address.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                New Ethereum Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(event) => setNewAddress(event.target.value)}
                  placeholder="0x..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  disabled={isBusy}
                  required
                />
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Important:</strong> You must not have any ongoing jobs to perform this transfer. This action is permanent and moves your entire history to the new address.
              </p>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full group relative flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white font-bold text-lg hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Transfer Profile</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Status Feedback */}
          {status.type !== "idle" && (
            <div
              className={`mt-6 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                status.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50"
                  : status.type === "error"
                  ? "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-900/50"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : status.type === "error" ? (
                <AlertCircle className="h-5 w-5 shrink-0" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin shrink-0" />
              )}
              <span className="text-sm font-medium">{status.message}</span>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-500">
          Powered by REP TOKEN Protocol
        </p>
      </div>
    </div>
  );
}
