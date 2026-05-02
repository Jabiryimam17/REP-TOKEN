"use client";

import React, { useState, useEffect } from "react";
import { 
  Scale, 
  Shield, 
  Users, 
  Clock, 
  Coins, 
  ChevronRight, 
  Search, 
  Filter,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  History,
  AlertCircle,
  Gavel,
  Briefcase
} from "lucide-react";
import { get_disputes } from "@/services/disputes.service";
import { get_categories } from "@/services/verifiers.service";
import { ethers } from "ethers";

export default function DisputeHistoryPage() {
  const [disputes, setDisputes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [disputesData, categoriesData] = await Promise.all([
          get_disputes(),
          get_categories()
        ]);
        setDisputes(disputesData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Failed to fetch disputes data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getStatusInfo = (status, open_for_dispute) => {
    if (open_for_dispute) {
      return {
        label: "In Progress",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        icon: <Clock className="w-3.5 h-3.5 mr-1" />
      };
    }
    
    switch(status) {
      case 0: // PENDING (but open_for_dispute is false, means finalized or not yet selected)
         return {
            label: "Pending Selection",
            color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
            icon: <Users className="w-3.5 h-3.5 mr-1" />
         };
      case 1: // FREELANCER_WIN
        return {
          label: "Freelancer Win",
          color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
        };
      case 2: // CLIENT_WIN
        return {
          label: "Client Win",
          color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
          icon: <XCircle className="w-3.5 h-3.5 mr-1" />
        };
      default:
        return {
          label: "Closed",
          color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
          icon: <Info className="w-3.5 h-3.5 mr-1" />
        };
    }
  };

  const filteredDisputes = disputes.filter(d => {
    const matchesSearch = (d.job_id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         d.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         d.reason?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "active") return matchesSearch && d.open_for_dispute;
    if (filterStatus === "resolved") return matchesSearch && !d.open_for_dispute && d.status !== 0;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
              <Scale className="w-10 h-10 mr-4 text-indigo-600" />
              Dispute Resolution Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">
              Transparent, decentralized justice for the <span className="text-indigo-600 dark:text-indigo-400 font-bold">REP TOKEN</span> ecosystem.
            </p>
          </div>
          <div className="flex items-center space-x-3">
             <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center min-w-[120px]">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Total Cases</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{disputes.length}</p>
             </div>
             <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none text-center min-w-[120px] text-white">
                <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1 tracking-widest">Active Cases</p>
                <p className="text-2xl font-black">{disputes.filter(d => d.open_for_dispute).length}</p>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Job ID, Title, or Reason..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             {["all", "active", "resolved"].map((status) => (
               <button
                 key={status}
                 onClick={() => setFilterStatus(status)}
                 className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                   filterStatus === status 
                   ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg" 
                   : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                 }`}
               >
                 {status}
               </button>
             ))}
          </div>
        </div>

        <div className="space-y-6">
          {filteredDisputes.length > 0 ? (
            filteredDisputes.map((dispute) => {
              const statusInfo = getStatusInfo(dispute.status, dispute.open_for_dispute);
              return (
                <div key={dispute.job_id} className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <History className="w-24 h-24" />
                  </div>
                  
                  <div className="flex flex-col lg:flex-row justify-between gap-8">
                    <div className="flex-grow space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusInfo.color} flex items-center`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                          JOB ID: {dispute.job_id.slice(0, 10)}...
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                          {categories[dispute.category] || "General"} Category
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {dispute.job_title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                          {dispute.reason}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                         <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Budget</p>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                               {ethers.formatUnits(dispute.job_amount || 0, 18)} USDC
                            </p>
                         </div>
                         <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Issuer</p>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300 truncate w-32">
                               {dispute.issuer_email}
                            </p>
                         </div>
                         <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Verifiers</p>
                            <div className="flex items-center text-sm font-black text-slate-700 dark:text-slate-300">
                               <Users className="w-4 h-4 mr-2 text-indigo-500" />
                               {dispute.chosen_verifiers_count} Assigned
                            </div>
                         </div>
                         <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Created</p>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                               {new Date(dispute.created_at).toLocaleDateString()}
                            </p>
                         </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col justify-between border-l border-slate-50 dark:border-slate-800 pl-0 lg:pl-8">
                       <div className="space-y-4">
                          {!dispute.open_for_dispute && dispute.status !== 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                               <div className="flex items-center justify-between mb-2">
                                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Final Score</p>
                                  <div className={`text-xs font-black ${dispute.score >= 50 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                     {dispute.score}%
                                  </div>
                               </div>
                               <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${dispute.score >= 50 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                    style={{ width: `${dispute.score}%` }}
                                  ></div>
                               </div>
                            </div>
                          )}
                       </div>
                       
                       <a 
                         href={`/dispute?jobId=${dispute.job_id}`}
                         className="flex items-center justify-center px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-200 dark:shadow-none transition-all mt-4"
                       >
                         View Details <ChevronRight className="w-4 h-4 ml-2" />
                       </a>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-20 border border-slate-100 dark:border-slate-800 text-center">
               <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Scale className="w-10 h-10 text-slate-300" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No disputes found</h3>
               <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                 There are no disputes matching your search or filter criteria at the moment.
               </p>
            </div>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                 <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                 <h4 className="font-bold text-slate-900 dark:text-white mb-1">Verifiable Justice</h4>
                 <p className="text-xs text-slate-500">Every decision is backed by multiple independent verifiers and recorded on-chain.</p>
              </div>
           </div>
           <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                 <Coins className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                 <h4 className="font-bold text-slate-900 dark:text-white mb-1">Staking Security</h4>
                 <p className="text-xs text-slate-500">Economic incentives ensure verifiers provide honest and high-quality assessments.</p>
              </div>
           </div>
           <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                 <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                 <h4 className="font-bold text-slate-900 dark:text-white mb-1">Time-Locked Process</h4>
                 <p className="text-xs text-slate-500">Strict deadlines for submission and reveal ensure timely resolution of all cases.</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
