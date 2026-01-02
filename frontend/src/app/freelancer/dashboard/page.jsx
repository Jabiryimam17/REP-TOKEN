"use client";

import React, { useState } from "react";
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Hourglass, 
  Trophy, 
  Wallet, 
  Shield, 
  ArrowUpRight, 
  ExternalLink, 
  MessageSquare, 
  Star,
  Settings,
  Bell,
  Search,
  ChevronRight,
  MoreVertical,
  Plus,
  Coins,
  Cpu,
  Flame,
  LayoutDashboard,
  TrendingUp
} from "lucide-react";

export default function FreelancerDashboard() {
  // Mock freelancer data
  const freelancer = {
    name: "Alex Rivera",
    publicAddresses: {
      ethereum: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      bitcoin: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      solana: "7xKXv2bdRQYvSrqG7Xv424S9eK8wX9eK8wX9eK8wX9eK"
    },
    balances: {
      rpTokens: 12500,
      stableCoin: 4200.50,
      currency: "USDC"
    },
    stats: {
      totalJobs: 48,
      successfulJobs: 46,
      successRate: "95.8%",
      totalEarned: "85.2k"
    },
    jobs: {
      workingOn: [
        { id: 101, title: "DeFi Protocol Audit", employer: "Nexus Finance", amount: "5,000", description: "Comprehensive security audit of the core lending smart contracts.", note: "Priority: High. Need to finish by Friday.", link: "/jobs/101" },
        { id: 102, title: "NFT Marketplace Frontend", employer: "ArtBlock", amount: "2,500", description: "Building the gallery and bidding interface using React.", note: "Waiting for assets from the designer.", link: "/jobs/102" }
      ],
      bidOn: [
        { id: 201, title: "Layer 2 Bridge Implementation", employer: "Optimism-X", amount: "12,000", description: "Design and build a secure cross-chain bridge.", note: "Follow up on Monday if no response.", link: "/jobs/201" }
      ],
      inDispute: [
        { id: 301, title: "Governance DAO Dashboard", employer: "MetaDAO", amount: "3,200", description: "Frontend for voting and proposal management.", note: "Dispute regarding scope creep on animations.", link: "/jobs/301" }
      ],
      paymentWaiting: [
        { id: 401, title: "Staking Contract V2", employer: "YieldFarm", amount: "4,000", description: "Optimization of reward distribution logic.", note: "Milestone 3 approved. Payment in escrow release process.", link: "/jobs/401" }
      ],
      finished: [
        { id: 501, title: "Wallet Integration Module", employer: "CryptoPay", amount: "1,800", description: "ConnectKit and RainbowKit setup for dApp.", note: "Client gave 5 stars!", link: "/jobs/501" }
      ],
      requested: [
        { id: 601, title: "Smart Contract Specialist", employer: "BlueChip Ventures", amount: "15,000", description: "Long-term partnership for multiple DeFi projects.", note: "Direct invite from previous client recommendation.", link: "/jobs/601" }
      ]
    }
  };

  const [activeTab, setActiveTab] = useState("workingOn");

  const jobTabs = [
    { id: "workingOn", label: "Working On", icon: Cpu, count: freelancer.jobs.workingOn.length },
    { id: "bidOn", label: "Bid On", icon: Hourglass, count: freelancer.jobs.bidOn.length },
    { id: "inDispute", label: "In Dispute", icon: AlertCircle, count: freelancer.jobs.inDispute.length, color: "text-red-500" },
    { id: "paymentWaiting", label: "Waiting Payment", icon: Wallet, count: freelancer.jobs.paymentWaiting.length },
    { id: "finished", label: "Finished", icon: CheckCircle2, count: freelancer.jobs.finished.length },
    { id: "requested", label: "Requested", icon: Plus, count: freelancer.jobs.requested.length, color: "text-indigo-600" },
  ];

  const renderJobBlock = (job, type) => (
    <div key={job.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
            <a href={job.link} className="flex items-center">
              {job.title}
              <ArrowUpRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center">
            Employer: <span className="font-semibold ml-1 text-slate-700 dark:text-slate-300">{job.employer}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900 dark:text-white">{job.amount} {freelancer.balances.currency}</p>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Budget</span>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
        {job.description}
      </p>

      {job.note && (
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border-l-2 border-indigo-500 p-3 mb-4">
          <p className="text-xs italic text-indigo-700 dark:text-indigo-300">
            <span className="font-bold not-italic mr-1 text-[10px] uppercase">My Note:</span>
            "{job.note}"
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="flex -space-x-2">
           {/* Avatar placeholder for employer */}
           <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold">
            {job.employer.charAt(0)}
           </div>
        </div>
        <div className="flex gap-2">
          {type === "requested" && (
            <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
              Agree to Job
            </button>
          )}
          <a href={job.link} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            View Details
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center">
              <LayoutDashboard className="w-8 h-8 mr-3 text-indigo-600" />
              Freelancer Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Welcome back, <span className="font-bold text-slate-700 dark:text-slate-300">{freelancer.name}</span>. Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold border-2 border-white dark:border-slate-900 shadow-sm">
              {freelancer.name.charAt(0)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar: Financials & Public Addresses */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Wallet Balances */}
            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Coins className="w-32 h-32" />
              </div>
              <h3 className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-4">Total Balance</h3>
              <div className="mb-6">
                <p className="text-3xl font-black mb-1">{freelancer.balances.stableCoin.toLocaleString()} <span className="text-lg font-medium">{freelancer.balances.currency}</span></p>
                <div className="inline-flex items-center px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5% this month
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-t border-white/10">
                  <span className="text-xs text-indigo-100">RP Tokens Staked</span>
                  <span className="font-bold">{freelancer.balances.rpTokens.toLocaleString()} RP</span>
                </div>
              </div>
            </div>

            {/* Public Addresses */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-slate-900 dark:text-white text-sm font-bold mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-indigo-600" />
                Linked Wallets
              </h3>
              <div className="space-y-4">
                {Object.entries(freelancer.publicAddresses).map(([chain, address]) => (
                  <div key={chain} className="group">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{chain}</p>
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 group-hover:border-indigo-200 dark:group-hover:border-indigo-900 transition-colors">
                      <code className="text-[10px] text-slate-600 dark:text-slate-400 truncate w-32">
                        {address}
                      </code>
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-slate-900 dark:text-white text-sm font-bold mb-4 flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Success</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{freelancer.stats.successRate}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Jobs</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{freelancer.stats.totalJobs}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl col-span-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Successful Jobs</p>
                  <p className="text-lg font-black text-emerald-600">{freelancer.stats.successfulJobs}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content: Job Lists */}
          <div className="lg:col-span-3">
            
            {/* Quick Filter Tabs */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-1 mb-6">
              {jobTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
                      : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${isActive ? "text-white" : tab.color || ""}`} />
                    {tab.label}
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                      isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Job List Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {jobTabs.find(t => t.id === activeTab)?.label}
                </h2>
                <div className="relative">
                   <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                    type="text" 
                    placeholder="Search jobs..."
                    className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                   />
                </div>
              </div>

              {freelancer.jobs[activeTab].length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {freelancer.jobs[activeTab].map(job => renderJobBlock(job, activeTab))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Briefcase className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">No jobs in this category</h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    You don't have any jobs listed under {jobTabs.find(t => t.id === activeTab)?.label.toLowerCase()} yet.
                  </p>
                  <button className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 transition-colors">
                    Browse Marketplace
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions / News */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden group">
                <Flame className="w-32 h-32 absolute -right-8 -bottom-8 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
                <h4 className="font-bold mb-2">Boost Your Profile</h4>
                <p className="text-sm text-slate-400 mb-4 max-w-xs">Stake 5,000 more RP tokens to get a "Top Rated" badge and 20% lower platform fees.</p>
                <button className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                  Stake Now
                </button>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Community Activity</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Milestone Approved</p>
                      <p className="text-[10px] text-slate-500">Nexus Finance approved 'Design Phase'</p>
                    </div>
                    <span className="ml-auto text-[10px] text-slate-400">2h ago</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">New Message</p>
                      <p className="text-[10px] text-slate-500">ArtBlock sent you a message</p>
                    </div>
                    <span className="ml-auto text-[10px] text-slate-400">5h ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
