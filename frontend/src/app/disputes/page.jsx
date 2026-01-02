"use client";

import React, { useState } from "react";
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
  History
} from "lucide-react";

export default function DisputeHistoryPage() {
  // Mock resolved disputes data
  const [disputes] = useState([
    {
      id: "DISP-2025-001",
      jobId: "JOB-2024-892",
      jobTitle: "E-commerce Smart Contract Audit",
      parties: {
        employer: "0x1234...5678",
        freelancer: "0x8765...4321"
      },
      stakes: {
        employer: 500,
        freelancer: 500,
        currency: "RP"
      },
      result: {
        score: 72, // Above 50, freelancer wins
        winner: "Freelancer",
        totalReward: 850, // Reward in RP tokens distributed to winner/verifiers
        resolutionTime: "4 days"
      },
      verifiers: [
        { address: "0xAAAA...1111", score: 80 },
        { address: "0xBBBB...2222", score: 65 },
        { address: "0xCCCC...3333", score: 71 }
      ],
      resolvedAt: "2025-01-15"
    },
    {
      id: "DISP-2025-002",
      jobId: "JOB-2024-905",
      jobTitle: "React Native UI Implementation",
      parties: {
        employer: "0x2233...4455",
        freelancer: "0x5544...3322"
      },
      stakes: {
        employer: 300,
        freelancer: 300,
        currency: "RP"
      },
      result: {
        score: 35, // Below 50, employer wins
        winner: "Employer",
        totalReward: 520,
        resolutionTime: "2 days"
      },
      verifiers: [
        { address: "0xDDDD...4444", score: 40 },
        { address: "0xEEEE...5555", score: 30 }
      ],
      resolvedAt: "2025-01-18"
    },
    {
      id: "DISP-2025-003",
      jobId: "JOB-2024-918",
      jobTitle: "DAO Governance Module",
      parties: {
        employer: "0x9988...7766",
        freelancer: "0x6677...8899"
      },
      stakes: {
        employer: 1000,
        freelancer: 1000,
        currency: "RP"
      },
      result: {
        score: 55,
        winner: "Freelancer",
        totalReward: 1700,
        resolutionTime: "7 days"
      },
      verifiers: [
        { address: "0xFFFF...0000", score: 60 },
        { address: "0x1111...AAAA", score: 50 },
        { address: "0x2222...BBBB", score: 55 }
      ],
      resolvedAt: "2025-01-22"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredDisputes = disputes.filter(d => 
    d.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Intro */}
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center justify-center md:justify-start">
              <Scale className="w-10 h-10 mr-4 text-indigo-600" />
              Dispute Resolution Registry
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-2xl">
              A transparent, decentralized log of all resolved conflicts within the REP TOKEN ecosystem. 
              Only public data is shown to maintain protocol integrity and user privacy.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Dispute ID or Job..." 
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="flex items-center justify-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Resolved</p>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">1,284</p>
            <p className="text-xs text-slate-500 mt-1">Global platform history</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Distributed Rewards</p>
              <Coins className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">425.8k <span className="text-lg font-medium">RP</span></p>
            <p className="text-xs text-slate-500 mt-1">To winners and verifiers</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg. Resolution Time</p>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">3.4 Days</p>
            <p className="text-xs text-slate-500 mt-1">Protocol efficiency rating</p>
          </div>
        </div>

        {/* Disputes List */}
        <div className="space-y-8">
          {filteredDisputes.map((dispute) => (
            <div key={dispute.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              
              {/* Card Header */}
              <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${dispute.result.score >= 50 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-lg leading-none">{dispute.id}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{dispute.jobTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${dispute.result.score >= 50 ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    Winner: {dispute.result.winner}
                  </span>
                  <span className="text-xs font-bold text-slate-400">Resolved {dispute.resolvedAt}</span>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  
                  {/* Left: Score & Result Analysis */}
                  <div className="lg:col-span-4 space-y-8">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center">
                        Resolution Score
                        <Info className="w-4 h-4 ml-2 text-slate-400 cursor-help" />
                      </h4>
                      <div className="relative pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">0 (Employer Win)</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white">{dispute.result.score}/100</span>
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">100 (Freelancer Win)</span>
                        </div>
                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-300 dark:bg-slate-600 z-10"></div>
                          <div 
                            className={`h-full transition-all duration-1000 ${dispute.result.score >= 50 ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                            style={{ width: `${dispute.result.score}%` }}
                          ></div>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 italic text-center">
                          A score of 50 indicates an equal split. Above 50 favors the Freelancer.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Reward</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{dispute.result.totalReward} RP</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Time to Resolve</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{dispute.result.resolutionTime}</p>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Parties & Stakes */}
                  <div className="lg:col-span-3 space-y-6">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center">
                      Parties Involved
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mr-3">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Employer</p>
                            <code className="text-xs text-slate-700 dark:text-slate-300">{dispute.parties.employer}</code>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900 dark:text-white">{dispute.stakes.employer} RP</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Staked</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 mr-3">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Freelancer</p>
                            <code className="text-xs text-slate-700 dark:text-slate-300">{dispute.parties.freelancer}</code>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900 dark:text-white">{dispute.stakes.freelancer} RP</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Staked</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Tokens were locked in escrow during the dispute period. Staked amounts reflect the user's commitment to their case.
                      </p>
                    </div>
                  </div>

                  {/* Right: Verifiers */}
                  <div className="lg:col-span-5 space-y-4">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                      Verifier Assessments ({dispute.verifiers.length})
                      <span className="text-[10px] font-bold text-slate-400 flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Anonymous Participation
                      </span>
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 p-4">
                      <div className="space-y-3">
                        {dispute.verifiers.map((verifier, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mr-3">
                                {idx + 1}
                              </div>
                              <code className="text-xs text-slate-600 dark:text-slate-400">{verifier.address}</code>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-black text-slate-900 dark:text-white">{verifier.score}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Assessment</p>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${verifier.score >= 50 ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100 dark:border-slate-800">
                        <a href="#" className="flex items-center hover:text-indigo-600 transition-colors">
                          View Protocol Proof <ExternalLink className="w-3 h-3 ml-1.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Bar */}
              <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center text-xs text-slate-500 font-medium">
                  <History className="w-4 h-4 mr-2" />
                  Archived Job Link: <a href={`/jobs/${dispute.jobId}`} className="ml-1 text-indigo-600 hover:underline font-bold">{dispute.jobId}</a>
                </div>
                <button className="text-xs font-black text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors">
                  Details <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-12 p-8 bg-indigo-600 rounded-[2rem] text-white overflow-hidden relative shadow-xl shadow-indigo-200 dark:shadow-none">
          <div className="absolute right-0 bottom-0 opacity-10">
            <Scale className="w-64 h-64 translate-x-16 translate-y-16" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl font-black mb-4">Commitment to Decentralized Justice</h2>
            <p className="text-indigo-100 leading-relaxed mb-6">
              Our dispute resolution protocol ensures that every conflict is assessed by independent, community-staked verifiers. 
              Decisions are transparent, verifiable on-chain, and weighted by the reputation of the participants.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                Resolution Whitepaper
              </button>
              <button className="px-6 py-3 bg-indigo-500 text-white border border-indigo-400 rounded-2xl font-bold hover:bg-indigo-400 transition-colors">
                Become a Verifier
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-component for icons that were missing
function Briefcase(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  );
}
