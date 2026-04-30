"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Gavel, 
  Shield, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Users,
  Calendar,
  ChevronRight,
  TrendingUp,
  Scale,
  MessageSquare
} from "lucide-react";
import { ethers } from "ethers";
import axios from "axios";

const DISPUTE_STATUS = ["PENDING", "FREELANCER_WIN", "CLIENT_WIN"];

const ScoreHistogram = ({ scores }) => {
  const bins = useMemo(() => {
    const b = new Array(10).fill(0);
    scores.forEach(s => {
      const score = Number(s);
      if (score === 0) return; // Not revealed
      const binIdx = Math.min(Math.floor(score / 10), 9);
      b[binIdx]++;
    });
    return b;
  }, [scores]);

  const maxVal = Math.max(...bins, 1);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
          <BarChart3 className="w-4 h-4 mr-2 text-indigo-600" />
          Score Distribution
        </h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">X: Score, Y: Count</span>
      </div>
      <div className="flex items-end justify-between h-40 gap-2">
        {bins.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div 
              className="w-full bg-indigo-600 rounded-t-lg transition-all duration-500 hover:bg-indigo-500 relative group"
              style={{ height: `${(val / maxVal) * 100}%` }}
            >
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {val} voters
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400">{i * 10}-{(i + 1) * 10}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DisputeDetailsPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) {
      setError("Job ID is required");
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await axios.get(`http://localhost:3333/api/disputes/${jobId}`, { withCredentials: true });
        setDispute(res.data);
      } catch (err) {
        console.error("Error fetching dispute details:", err);
        setError("Failed to load dispute details. It might not exist yet.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 p-4">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error || "Dispute not found"}</p>
          <button onClick={() => window.history.back()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Go Back</button>
        </div>
      </div>
    );
  }

  const { contract_data } = dispute;
  const isFinalized = contract_data.dispute_status !== 0; // PENDING is 0
  const now = Math.floor(Date.now() / 1000);
  const isSubmission = now <= Number(contract_data.submission_deadline);
  const isReveal = now > Number(contract_data.submission_deadline) && now <= Number(contract_data.release_deadline);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm font-medium text-slate-500 dark:text-slate-400">
          <a href="/" className="hover:text-indigo-600 transition-colors">Platform</a>
          <ChevronRight className="w-4 h-4 mx-2" />
          <a href="/disputes" className="hover:text-indigo-600 transition-colors">Disputes</a>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-slate-900 dark:text-white">Case #{jobId.slice(0, 8)}</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                 isFinalized 
                 ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" 
                 : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
               }`}>
                {DISPUTE_STATUS[contract_data.dispute_status]}
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Category: {contract_data.category} • Level: {contract_data.level}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Dispute Resolution Details
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Reward Pool</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {ethers.formatEther(dispute.total_reward || '0')} RPT
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Stats & Histogram */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Case Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-2 mb-6">
                 <Scale className="w-5 h-5 text-indigo-600" />
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">Case Summary</h3>
               </div>
               
               <div className="space-y-6">
                 <div>
                   <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Issue / Reason</p>
                   <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{dispute.reason}</p>
                 </div>
                 
                 <div>
                   <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Description</p>
                   <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{dispute.description}</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Client Stake</p>
                      <p className="font-bold text-slate-900 dark:text-white">{ethers.formatEther(contract_data.client_stake)} RPT</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Freelancer Stake</p>
                      <p className="font-bold text-slate-900 dark:text-white">{ethers.formatEther(contract_data.freelancer_stake)} RPT</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Verifier Locked</p>
                      <p className="font-bold text-slate-900 dark:text-white">{ethers.formatEther(contract_data.lock_amount)} RPT / each</p>
                    </div>
                 </div>
               </div>
            </div>

            {/* Participation Stats & Histogram */}
            {(isFinalized || isReveal) && (
              <ScoreHistogram scores={contract_data.scores} />
            )}

            {/* Voting Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] uppercase font-black text-slate-400 mb-4 tracking-widest flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-indigo-500" /> Resolution
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{dispute.score || '-'}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">Average Score</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] uppercase font-black text-slate-400 mb-4 tracking-widest flex items-center">
                  <Users className="w-3 h-3 mr-1 text-indigo-500" /> Participation
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  {isSubmission ? contract_data.total_submitted : contract_data.total_revealed} / {contract_data.chosen_verifiers.length}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  {isSubmission ? "Verifiers Submitted" : "Verifiers Revealed"}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] uppercase font-black text-slate-400 mb-4 tracking-widest flex items-center">
                  <Gavel className="w-3 h-3 mr-1 text-red-500" /> Penalties
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{dispute.slashed_cnt || 0}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">Verifiers Slashed</p>
              </div>
            </div>

          </div>

          {/* Right Column: Timeline & Verifiers */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Timeline Card */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
               <h3 className="text-lg font-bold mb-6 flex items-center">
                 <Clock className="w-5 h-5 mr-2 text-indigo-400" />
                 Timeline
               </h3>
               
               <div className="space-y-6">
                 <div className={`relative pl-8 pb-6 border-l-2 ${now > Number(contract_data.submission_deadline) ? 'border-indigo-500' : 'border-slate-700'}`}>
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 ${now > Number(contract_data.submission_deadline) ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Submission Deadline</p>
                    <p className="text-sm font-bold">{new Date(Number(contract_data.submission_deadline) * 1000).toLocaleString()}</p>
                 </div>

                 <div className={`relative pl-8 pb-6 border-l-2 ${now > Number(contract_data.release_deadline) ? 'border-indigo-500' : 'border-slate-700'}`}>
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 ${now > Number(contract_data.release_deadline) ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Reveal Deadline</p>
                    <p className="text-sm font-bold">{new Date(Number(contract_data.release_deadline) * 1000).toLocaleString()}</p>
                 </div>

                 <div className={`relative pl-8`}>
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 ${isFinalized ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Resolution Time</p>
                    <p className="text-sm font-bold">{dispute.resolved_time ? new Date(Number(dispute.resolved_time) * 1000).toLocaleString() : 'Pending...'}</p>
                 </div>
               </div>
            </div>

            {/* Selected Verifiers */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                 <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                 Chosen Verifiers
               </h3>
               
               <div className="space-y-4">
                 {contract_data.chosen_verifiers.map((v_addr, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <div className="flex items-center gap-3 overflow-hidden">
                       <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                         {i + 1}
                       </div>
                       <code className="text-xs text-slate-600 dark:text-slate-400 truncate">{v_addr}</code>
                     </div>
                     {isFinalized && (
                       <span className={`text-xs font-black ${Number(contract_data.scores[i]) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                         {Number(contract_data.scores[i]) > 0 ? contract_data.scores[i] : "Missed"}
                       </span>
                     )}
                   </div>
                 ))}
               </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
