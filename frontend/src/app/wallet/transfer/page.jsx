"use client";

import React, { useState, useEffect } from "react";
import { 
  Send, 
  User, 
  ArrowRight, 
  Coins, 
  Wallet, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Info,
  ChevronLeft,
  ShieldCheck,
  Briefcase
} from "lucide-react";
import { ethers } from "ethers";
import Link from "next/link";
import {get_contracts} from "@/services/compose_contracts.service";
import {get_user_balance as rpt_balance, transfer as transfer_rpt, approve as approve_rpt, get_allowance as allowance_rpt} from "@/services/rpt.service.js";
import {get_user_balance as eth_balance, transfer as transfer_eth, approve as approve_eth, get_allowance as allowance_eth} from "@/services/eth_coin.service.js";

export default function TransferPage() {
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [balances, setBalances] = useState({ ETH: "0", RPT: "0" });
  const [allowance, setAllowance] = useState("0");
  const [formData, setFormData] = useState({
    recipient: "",
    amount: "",
    token: "ETH", 
    spender: "",
    approveAmount: ""
  });
  const [txStatus, setTxStatus] = useState({ type: "", message: "" });
  const [address, setAddress] = useState("");

  useEffect(()=>{
        const set_contracts=async()=>{
              await get_contracts();
        }
        set_contracts();
  }, [])
  useEffect(() => {
    fetchBalances();
  }, []);

  useEffect(() => {
    if (formData.spender && ethers.isAddress(formData.spender)) {
      fetchAllowance();
    } else {
      setAllowance("0");
    }
  }, [formData.spender, formData.token]);

  const fetchAllowance = async () => {
    try {
      const { eth_contract } = await get_contracts();
      const address = await eth_contract.runner.getAddress();
      let currentAllowance;
      if (formData.token === "ETH") {
        currentAllowance = await allowance_eth(address, formData.spender);
      } else {
        currentAllowance = await allowance_rpt(address, formData.spender);
      }
      setAllowance(ethers.formatEther(currentAllowance));
    } catch (error) {
      console.error("Error fetching allowance:", error);
    }
  };

  const fetchBalances = async () => {
    try {


      const ethBalance = await eth_balance();
      const rptBalance = await rpt_balance();

      setBalances({
        ETH: ethers.formatEther(ethBalance),
        RPT: ethers.formatEther(rptBalance),
      });
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTxStatus({ type: "info", message: "Processing transfer..." });

    try {
      // Use 18 decimals (10^18)
      const amountWei = ethers.parseUnits(formData.amount, 18);
      let tx;

      if (formData.token === "ETH") {
            tx = await transfer_eth(formData.recipient, amountWei);
      } else {
        tx = await transfer_rpt(formData.recipient, amountWei);
      }

      setTxStatus({ type: "info", message: "Transfer submitted. Waiting for confirmation..." });
      await tx.wait();

      setTxStatus({ type: "success", message: `Successfully transferred ${formData.amount} ${formData.token}!` });
      setFormData({ ...formData, amount: "", recipient: "" });
      fetchBalances();
    } catch (error) {
      console.error("Transfer error:", error);
      setTxStatus({ type: "error", message: error.reason || error.message || "Transfer failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!formData.spender || !formData.approveAmount) return;
    
    setApproving(true);
    setTxStatus({ type: "info", message: "Processing approval..." });

    try {
      const amountWei = ethers.parseUnits(formData.approveAmount, 18);
      let tx;

      if (formData.token === "ETH") {
        tx = await approve_eth(formData.spender, amountWei);
      } else {
        tx = await approve_rpt(formData.spender, amountWei);
      }

      setTxStatus({ type: "info", message: "Approval submitted. Waiting for confirmation..." });
      await tx.wait();

      setTxStatus({ type: "success", message: `Successfully approved ${formData.approveAmount} ${formData.token} for ${formData.spender.substring(0,6)}...${formData.spender.substring(38)}` });
      setFormData({ ...formData, approveAmount: "" });
      fetchAllowance();
    } catch (error) {
      console.error("Approval error:", error);
      setTxStatus({ type: "error", message: error.reason || error.message || "Approval failed" });
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        <Link href="/wallet" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-8">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Wallet Hub
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-indigo-600 px-8 py-10 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md mb-4">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold mb-2">Transfer Assets</h1>
              <p className="text-indigo-100 max-w-md mx-auto">
                Send RPT or EthioCoin securely to any address on the network.
              </p>
            </div>
          </div>

          <div className="p-8 md:p-10">
            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">EthioCoin (ETH)</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">{parseFloat(balances.ETH).toFixed(4)}</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reputation (RPT)</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">{parseFloat(balances.RPT).toFixed(4)}</div>
              </div>
            </div>

            {/* Form Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 mb-8">
              <button 
                onClick={() => setTxStatus({type: "", message: ""})}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${!formData.spender && !formData.approveAmount ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Direct Transfer
              </button>
              <button 
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${formData.spender || formData.approveAmount ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Token Approval
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Transfer Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                    <Send className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Send Assets</h3>
                </div>
                
                <form onSubmit={handleTransfer} className="space-y-5">
                  {/* Token Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Asset</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["ETH", "RPT"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({ ...formData, token: t })}
                          className={`py-3 rounded-xl font-bold transition-all border text-sm ${
                            formData.token === t 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {t === "ETH" ? "EthioCoin" : "Reputation"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recipient */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Recipient Address</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={formData.recipient}
                        onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-900 dark:text-white"
                        placeholder="0x..."
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</label>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, amount: balances[formData.token]})}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase"
                      >
                        Max: {parseFloat(balances[formData.token]).toFixed(4)}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">{formData.token}</div>
                      <input 
                        type="number" 
                        step="any"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full pl-4 pr-14 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-900 dark:text-white font-bold"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 ml-1 italic">
                      * Working with 18 decimals (1.0 {formData.token} = 10^18 units)
                    </p>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || !formData.amount || !formData.recipient}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center group disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Confirm Transfer"} 
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>

              {/* Approval Section */}
              <div className="space-y-6 pt-10 lg:pt-0 lg:pl-12 lg:border-l border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Token Approval</h3>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50 mb-4">
                  <div className="flex gap-3">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-tight">
                      Use this to allow a smart contract (e.g., Job Escrow) to spend tokens on your behalf.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleApprove} className="space-y-5">
                  {/* Spender */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Spender Address</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={formData.spender}
                        onChange={(e) => setFormData({...formData, spender: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm text-slate-900 dark:text-white"
                        placeholder="Contract address 0x..."
                      />
                    </div>
                    {formData.spender && ethers.isAddress(formData.spender) && (
                      <p className="text-[10px] text-emerald-600 font-bold ml-1">
                        Current Allowance: {parseFloat(allowance).toFixed(4)} {formData.token}
                      </p>
                    )}
                  </div>

                  {/* Approve Amount */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Amount to Approve</label>
                    <div className="relative">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">{formData.token}</div>
                      <input 
                        type="number" 
                        step="any"
                        required
                        value={formData.approveAmount}
                        onChange={(e) => setFormData({...formData, approveAmount: e.target.value})}
                        className="w-full pl-4 pr-14 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm text-slate-900 dark:text-white font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={approving || !formData.approveAmount || !formData.spender || !ethers.isAddress(formData.spender)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center group disabled:opacity-50"
                  >
                    {approving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Approve Spender"} 
                    <ShieldCheck className="ml-2 w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Global Status Message */}
            {txStatus.message && (
              <div className={`mt-8 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                txStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50' :
                txStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50' :
                'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50'
              }`}>
                {txStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : 
                 txStatus.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : 
                 <Loader2 className="w-5 h-5 animate-spin shrink-0" />}
                {txStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
