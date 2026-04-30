"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  AlertCircle, 
  ShieldAlert, 
  Coins, 
  User, 
  Briefcase, 
  FileText, 
  Send, 
  ChevronRight,
  Info,
  Scale,
  Hammer,
  Loader2
} from "lucide-react";
import { ethers } from "ethers";
import { 
  get_job_blockchain, 
  get_job_api,
  estimate_dispute_fee,
  raise_dispute,
  get_dispute_context,
  check_link_allowance,
  approve_link
} from "@/services/jobs.service";
import connect_wallet from "@/services/connect_wallet.service";

export default function PostDisputePage() {
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get("jobId");

  const [formData, setFormData] = useState({
    jobId: jobIdParam || "",
    requesterRole: "freelancer",
    reason: "",
    details: ""
  });

  const [jobDetails, setJobDetails] = useState(null);
  const [disputeContext, setDisputeContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState({ eth: 0n, link: 0n, loading: false });
  const [additionalFee, setAdditionalFee] = useState("0");
  const [payLink, setPayLink] = useState(false);

  const getFinalFee = () => {
    const baseFee = payLink ? fees.link : fees.eth;
    let finalFee = baseFee;
    if (additionalFee && additionalFee !== "0") {
      try {
        const additional = ethers.parseUnits(additionalFee, 18);
        finalFee = baseFee + additional;
      } catch (e) {
        console.error("Invalid additional fee format:", e);
      }
    }
    return finalFee;
  };

  useEffect(() => {
    const checkAllowance = async () => {
      if (payLink && formData.jobId) {
        const finalFee = getFinalFee();
        const status = await check_link_allowance(finalFee);
        if (status) setAllowance(status);
      } else {
        setAllowance({ allowed: 0n, sufficient: true });
      }
    };
    checkAllowance();
  }, [payLink, fees, additionalFee, formData.jobId]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const finalFee = getFinalFee();
      const success = await approve_link(finalFee);
      if (success) {
        const status = await check_link_allowance(finalFee);
        if (status) setAllowance(status);
      }
    } catch (err) {
      console.error("Approval error:", err);
    } finally {
      setApproving(false);
    }
  };
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [allowance, setAllowance] = useState({ allowed: 0n, sufficient: true });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (jobIdParam) {
      loadJobDetails(jobIdParam);
    }
  }, [jobIdParam]);

  const loadJobDetails = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const blockchain = await get_job_blockchain(id);
      const api = await get_job_api(id);
      
      if (!blockchain) {
        setError("Job not found on blockchain.");
        setLoading(false);
        return;
      }

      setJobDetails({ blockchain, api });
      
      const context = await get_dispute_context(id);
      setDisputeContext(context);
      
      // Estimate fees
      setFees(prev => ({ ...prev, loading: true }));
      const feeEth = await estimate_dispute_fee(id, false);
      const feeLink = await estimate_dispute_fee(id, true);
      setFees({ eth: feeEth, link: feeLink, loading: false });

      // Determine role based on current user address
      const { signer } = await connect_wallet();
      const address = await signer.getAddress();
      if (blockchain.client && blockchain.client.toLowerCase() === address.toLowerCase()) {
        setFormData(prev => ({ ...prev, requesterRole: "employer" }));
      } else if (blockchain.freelancer && blockchain.freelancer.toLowerCase() === address.toLowerCase()) {
        setFormData(prev => ({ ...prev, requesterRole: "freelancer" }));
      }

    } catch (err) {
      console.error("Error loading job details:", err);
      setError("Failed to load job details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.jobId || !formData.reason) {
      alert("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const baseFee = payLink ? fees.link : fees.eth;
      let finalFee = baseFee;
      
      if (additionalFee && additionalFee !== "0") {
        try {
          const additional = ethers.parseUnits(additionalFee, 18);
          finalFee = baseFee + additional;
        } catch (e) {
          console.error("Invalid additional fee format:", e);
          alert("Invalid additional fee format. Please enter a valid number.");
          setSubmitting(false);
          return;
        }
      }

      const success = await raise_dispute(
        formData.jobId, 
        payLink, 
        finalFee, 
        formData.reason, 
        formData.details
      );

      if (success) {
        alert("Dispute initiated successfully!");
        window.location.href = formData.requesterRole === 'employer' ? '/employer' : '/freelancer/dashboard';
      } else {
        alert("Failed to initiate dispute. Check console for details.");
      }
    } catch (err) {
      console.error("Dispute submission error:", err);
      alert("An error occurred while submitting the dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-100/30 dark:bg-red-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100/30 dark:bg-amber-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm font-medium text-slate-500 dark:text-slate-400">
          <a href="/" className="hover:text-indigo-600 transition-colors">Platform</a>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-slate-900 dark:text-white">Submit Dispute Request</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Column */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-red-100/20 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-amber-600 px-8 py-6 text-white">
                <div className="flex items-center space-x-3 mb-2">
                  <ShieldAlert className="w-8 h-8" />
                  <h1 className="text-2xl font-bold">Dispute Resolution</h1>
                </div>
                <p className="text-red-50 text-sm opacity-90">
                  Submit your case for community review. Our verifiers will analyze the evidence and reach a fair decision.
                </p>
              </div>

              {loading ? (
                <div className="p-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-500 font-bold">Fetching job information...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                  
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center text-red-600 dark:text-red-400 text-sm font-bold">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      {error}
                    </div>
                  )}

                  {/* Job Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold mb-2">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span>Job Details</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Job ID / Reference</label>
                        <input 
                          type="text" 
                          required
                          value={formData.jobId}
                          readOnly={!!jobIdParam}
                          onChange={(e) => setFormData({...formData, jobId: e.target.value})}
                          placeholder="e.g. 0x..."
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono"
                        />
                        {jobDetails && (
                          <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                             <p className="text-sm font-bold text-slate-900 dark:text-white">{jobDetails.api?.title || "Project"}</p>
                             <p className="text-xs text-slate-500 mt-1">
                               Budget: {(() => {
                                 try { return ethers.formatUnits(jobDetails.blockchain?.amount ?? 0n, 18); }
                                 catch (_) { return "0"; }
                               })()} USDC
                             </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role Selection (Read-only if detected) */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold mb-2">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span>Your Role in this Dispute</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        disabled={!!jobDetails}
                        onClick={() => setFormData({...formData, requesterRole: "freelancer"})}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                          formData.requesterRole === "freelancer"
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-slate-100 dark:border-slate-800 bg-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        } ${!!jobDetails ? 'cursor-default' : ''}`}
                      >
                        <Briefcase className={`w-8 h-8 mb-2 ${formData.requesterRole === "freelancer" ? "text-indigo-600" : "text-slate-400"}`} />
                        <span className={`font-bold ${formData.requesterRole === "freelancer" ? "text-indigo-900 dark:text-indigo-300" : "text-slate-500"}`}>Freelancer</span>
                      </button>
                      
                      <button
                        type="button"
                        disabled={!!jobDetails}
                        onClick={() => setFormData({...formData, requesterRole: "employer"})}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                          formData.requesterRole === "employer"
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-slate-100 dark:border-slate-800 bg-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        } ${!!jobDetails ? 'cursor-default' : ''}`}
                      >
                        <User className={`w-8 h-8 mb-2 ${formData.requesterRole === "employer" ? "text-emerald-600" : "text-slate-400"}`} />
                        <span className={`font-bold ${formData.requesterRole === "employer" ? "text-emerald-900 dark:text-emerald-300" : "text-slate-500"}`}>Employer</span>
                      </button>
                    </div>
                  </div>

                  {/* Monetary System Integration */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold mb-2">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Coins className="w-4 h-4 text-amber-500" />
                      </div>
                      <span>VRF Fee Selection</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <button
                         type="button"
                         disabled={fees.loading}
                         onClick={() => setPayLink(false)}
                         className={`p-4 rounded-2xl border-2 text-left transition-all ${!payLink ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800'}`}
                       >
                         <p className="text-xs font-bold text-slate-500 uppercase">Pay with ETH</p>
                         <div className="flex items-center justify-between mt-1">
                           <p className="text-lg font-black">
                             {fees.loading ? "..." : `${ethers.formatEther(fees.eth)} ETH`}
                           </p>
                           {!payLink && !fees.loading && (
                             <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 px-2 py-1 rounded-lg font-bold">Selected</span>
                           )}
                         </div>
                       </button>

                       <button
                         type="button"
                         disabled={fees.loading}
                         onClick={() => setPayLink(true)}
                         className={`p-4 rounded-2xl border-2 text-left transition-all ${payLink ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800'}`}
                       >
                         <p className="text-xs font-bold text-slate-500 uppercase">Pay with LINK</p>
                         <div className="flex items-center justify-between mt-1">
                           <p className="text-lg font-black">
                             {fees.loading ? "..." : `${ethers.formatEther(fees.link)} LINK`}
                           </p>
                           {payLink && !fees.loading && (
                             <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 px-2 py-1 rounded-lg font-bold">Selected</span>
                           )}
                         </div>
                       </button>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Additional Tip / Priority Fee</label>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{payLink ? 'LINK' : 'ETH'}</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.000000000000000001"
                          min="0"
                          value={additionalFee}
                          onChange={(e) => setAdditionalFee(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Coins className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3 italic">
                        The estimated fee is the minimum required by Chainlink VRF. You can add more to ensure faster processing or cover gas spikes.
                      </p>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic">
                      Final fee will be: {fees.loading ? "..." : (() => {
                        try {
                          const base = payLink ? fees.link : fees.eth;
                          const additional = additionalFee ? ethers.parseUnits(additionalFee || "0", 18) : 0n;
                          return ethers.formatEther(base + additional);
                        } catch (e) {
                          return ethers.formatEther(payLink ? fees.link : fees.eth);
                        }
                      })() } {payLink ? 'LINK' : 'ETH'} (Estimated + Additional)
                    </p>
                  </div>

                  {/* Conflict Description */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold mb-2">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <FileText className="w-4 h-4 text-red-600" />
                      </div>
                      <span>Dispute Information</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Short Reason</label>
                        <input 
                          type="text"
                          required
                          value={formData.reason}
                          onChange={(e) => setFormData({...formData, reason: e.target.value})}
                          placeholder="e.g. Work quality not as described"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Detailed Description</label>
                        <textarea 
                          rows={4}
                          value={formData.details}
                          onChange={(e) => setFormData({...formData, details: e.target.value})}
                          placeholder="Provide more details for the verifiers..."
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm leading-relaxed"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {payLink && !allowance.sufficient ? (
                    <button 
                      type="button"
                      disabled={approving || loading}
                      onClick={handleApprove}
                      className="w-full py-5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white rounded-2xl font-bold text-lg shadow-lg shadow-amber-200 dark:shadow-none transition-all flex items-center justify-center group"
                    >
                      {approving ? (
                        <>Approving LINK... <Loader2 className="ml-2 w-5 h-5 animate-spin" /></>
                      ) : (
                        <>Approve LINK Tokens <Coins className="ml-2 w-5 h-5" /></>
                      )}
                    </button>
                  ) : (
                    <button 
                      type="submit"
                      disabled={submitting || loading || !jobDetails}
                      className="w-full py-5 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-200 dark:shadow-none transition-all flex items-center justify-center group"
                    >
                      {submitting ? (
                        <>Processing... <Loader2 className="ml-2 w-5 h-5 animate-spin" /></>
                      ) : (
                        <>Initiate Dispute <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                      )}
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Guidelines Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Dispute Context Card */}
            {disputeContext && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-indigo-600" />
                  Dispute Context
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{disputeContext.category_name}</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Work Level</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Level {disputeContext.job.level}</p>
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full">
                        Max: {(() => {
                          try { return ethers.formatUnits(disputeContext.level?.max_amount ?? 0n, 18); }
                          catch (_) { return "0"; }
                        })()} USDC
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Verifier Selection Level</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Level {disputeContext.verifier_level}</p>
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full">
                        Stake: {ethers.formatUnits(disputeContext.total_stake, 18)} RPT
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Eligible Verifiers</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xl font-black text-slate-900 dark:text-white">{disputeContext.verifier_count}</p>
                      <p className="text-xs text-slate-500">at this level</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Client Stake</p>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {ethers.formatUnits(disputeContext.level.client_stake, 18)} RPT
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Freelancer Stake</p>
                      <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                        {ethers.formatUnits(disputeContext.level.freelancer_stake, 18)} RPT
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Initiates Verifier Selection</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                      Requires {disputeContext.level.verifiers_cnt / 100}% of the level's verifiers (min 3) to reach a consensus within {disputeContext.level.payment_duration / 86400} days.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <Scale className="w-5 h-5 mr-2 text-indigo-600" />
                Dispute Process
              </h3>
              
              <ul className="space-y-6">
                <li className="flex">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 mr-4 shrink-0">1</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Submission</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Submit your claim and pay VRF fees to initialize verifier selection.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 mr-4 shrink-0">2</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Verifier Selection</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Chainlink VRF selects independent verifiers from the pool.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 mr-4 shrink-0">3</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Evidence Review</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Verifiers review job details and provided descriptions.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 mr-4 shrink-0">4</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Final Ruling</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">A weighted average score determines the winner (Freelancer vs Client).</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-2">Important Notice</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    Once a dispute is initiated, the project funds are locked in the escrow contract and cannot be moved until a final resolution is reached.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 dark:bg-white rounded-3xl p-6 text-white dark:text-slate-900">
              <div className="flex items-center mb-4">
                <Hammer className="w-5 h-5 mr-2 text-indigo-400 dark:text-indigo-600" />
                <h4 className="font-bold">Decentralized Justice</h4>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
                Our platform uses Chainlink VRF and economic incentives to ensure fair and unbiased dispute resolution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
