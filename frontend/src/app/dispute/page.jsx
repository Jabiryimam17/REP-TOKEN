"use client";

import React, { useState } from "react";
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
  Hammer
} from "lucide-react";

export default function DisputePage() {
  const [formData, setFormData] = useState({
    jobId: "JOB-2025-042",
    requesterRole: "freelancer",
    stakeAmount: "",
    description: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dispute Submitted:", formData);
    alert("Dispute request submitted to the verifier community! (Demo)");
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

              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                
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
                        onChange={(e) => setFormData({...formData, jobId: e.target.value})}
                        placeholder="e.g. JOB-12345"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
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
                      onClick={() => setFormData({...formData, requesterRole: "freelancer"})}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                        formData.requesterRole === "freelancer"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-slate-100 dark:border-slate-800 bg-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      }`}
                    >
                      <Briefcase className={`w-8 h-8 mb-2 ${formData.requesterRole === "freelancer" ? "text-indigo-600" : "text-slate-400"}`} />
                      <span className={`font-bold ${formData.requesterRole === "freelancer" ? "text-indigo-900 dark:text-indigo-300" : "text-slate-500"}`}>Freelancer</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, requesterRole: "employer"})}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                        formData.requesterRole === "employer"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-slate-100 dark:border-slate-800 bg-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      }`}
                    >
                      <User className={`w-8 h-8 mb-2 ${formData.requesterRole === "employer" ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className={`font-bold ${formData.requesterRole === "employer" ? "text-emerald-900 dark:text-emerald-300" : "text-slate-500"}`}>Employer</span>
                    </button>
                  </div>
                </div>

                {/* Stake Amount */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold mb-2">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Coins className="w-4 h-4 text-amber-500" />
                    </div>
                    <span>Reputation Stake</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">RP Tokens to Stake</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        required
                        value={formData.stakeAmount}
                        onChange={(e) => setFormData({...formData, stakeAmount: e.target.value})}
                        placeholder="0.00"
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-lg"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">RP TOKEN</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      Staking RP tokens proves your commitment to the case. If the verifiers rule in your favor, your stake is returned. If not, it may be slashed.
                    </p>
                  </div>
                </div>

                {/* Conflict Description */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold mb-2">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <FileText className="w-4 h-4 text-red-600" />
                    </div>
                    <span>Detailed Conflict Description</span>
                  </div>
                  
                  <div>
                    <textarea 
                      required
                      rows={6}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Please provide a clear and detailed explanation of the conflict. Include milestone dates, specific requirements not met, and any communication evidence..."
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm leading-relaxed"
                    ></textarea>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  className="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-200 dark:shadow-none transition-all flex items-center justify-center group"
                >
                  Initiate Dispute <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>

          {/* Guidelines Sidebar */}
          <div className="lg:col-span-1 space-y-6">
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Submit your claim and stake RP tokens to initialize the protocol.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 mr-4 shrink-0">2</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Verifier Selection</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">The system randomly selects 5 independent verifiers based on expertise.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 mr-4 shrink-0">3</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Evidence Review</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Verifiers review the contract, work submitted, and description provided.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 mr-4 shrink-0">4</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Final Ruling</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">A majority vote determines the outcome. Funds are released accordingly.</p>
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
                    Once a dispute is initiated, the project funds are locked in the escrow contract and cannot be moved until a final resolution is reached by the verifier community.
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
                Our platform uses a blockchain-based consensus mechanism to ensure fair and unbiased dispute resolution.
              </p>
              <button className="w-full py-3 bg-white/10 dark:bg-slate-100 hover:bg-white/20 dark:hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors">
                Read Justice Protocol
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
