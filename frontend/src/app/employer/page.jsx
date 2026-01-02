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
  TrendingUp,
  ShieldCheck,
  UserPlus,
  Send
} from "lucide-react";

export default function EmployerDashboard() {
  // Mock employer data
  const employer = {
    name: "Nexus Finance",
    verified: true,
    publicAddresses: {
      ethereum: "0x1234...5678",
      bitcoin: "bc1q...wxyz",
      solana: "7xKX...2bdR"
    },
    balances: {
      stakedAmount: 50000,
      stableCoin: 125000.75,
      currency: "USDC"
    },
    stats: {
      totalJobsPosted: 24,
      activeJobs: 5,
      completedJobs: 18,
      totalSpent: "240k"
    },
    jobs: {
      workingOn: [
        { id: 101, title: "DeFi Protocol Audit", freelancer: "Alex Rivera", amount: "5,000", description: "Comprehensive security audit of the core lending smart contracts.", status: "In Progress", link: "/jobs/101" }
      ],
      bidding: [
        { id: 201, title: "Layer 2 Bridge Implementation", bidsCount: 12, budgetRange: "10k - 15k", description: "Design and build a secure cross-chain bridge.", status: "Open for Bids", link: "/jobs/201" }
      ],
      inDispute: [
        { id: 301, title: "Governance DAO Dashboard", freelancer: "BlockSmith", amount: "3,200", description: "Frontend for voting and proposal management.", status: "Under Review", link: "/jobs/301" }
      ],
      paymentWaiting: [
        { id: 401, title: "Staking Contract V2", freelancer: "SolidStacker", amount: "4,000", description: "Optimization of reward distribution logic.", status: "Milestone Approved", link: "/jobs/401" }
      ],
      finished: [
        { id: 501, title: "Wallet Integration Module", freelancer: "CryptoWiz", amount: "1,800", description: "ConnectKit and RainbowKit setup for dApp.", status: "Completed", link: "/jobs/501" }
      ],
      requested: [
        { id: 601, title: "Smart Contract Specialist", freelancer: "Sarah Chen", amount: "15,000", description: "Direct request for long-term partnership.", status: "Awaiting Acceptance", link: "/jobs/601" }
      ]
    }
  };

  const [activeTab, setActiveTab] = useState("workingOn");
  const [showRequestForm, setShowRequestForm] = useState(false);

  const jobTabs = [
    { id: "workingOn", label: "Working On", icon: Cpu, count: employer.jobs.workingOn.length },
    { id: "bidding", label: "Bidding", icon: Hourglass, count: employer.jobs.bidding.length },
    { id: "inDispute", label: "In Dispute", icon: AlertCircle, count: employer.jobs.inDispute.length, color: "text-red-500" },
    { id: "paymentWaiting", label: "Waiting Payment", icon: Wallet, count: employer.jobs.paymentWaiting.length },
    { id: "finished", label: "Finished", icon: CheckCircle2, count: employer.jobs.finished.length },
    { id: "requested", label: "Requested", icon: UserPlus, count: employer.jobs.requested.length, color: "text-indigo-600" },
  ];

  const renderJobBlock = (job) => (
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
            {job.freelancer ? (
              <>Freelancer: <span className="font-semibold ml-1 text-slate-700 dark:text-slate-300">{job.freelancer}</span></>
            ) : (
              <>Bids: <span className="font-semibold ml-1 text-slate-700 dark:text-slate-300">{job.bidsCount} proposals</span></>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900 dark:text-white">{job.amount || job.budgetRange} {employer.balances.currency}</p>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{job.amount ? "Budget" : "Range"}</span>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
        {job.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            activeTab === 'inDispute' ? 'bg-red-500' : 
            activeTab === 'finished' ? 'bg-emerald-500' : 
            activeTab === 'paymentWaiting' ? 'bg-amber-500' : 'bg-indigo-500'
          }`}></div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{job.status}</span>
        </div>
        <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Manage Project</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center mb-1">
               <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center">
                <LayoutDashboard className="w-8 h-8 mr-3 text-indigo-600" />
                Employer Dashboard
              </h1>
              {employer.verified && (
                <div className="ml-3 flex items-center bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Verified Employer</span>
                </div>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Managing <span className="font-bold text-slate-700 dark:text-slate-300">{employer.name}</span>'s talent and projects.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <a 
              href="/jobs/post"
              className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </a>
            <button 
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all"
            >
              Request Freelancer
            </button>
            <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <div className="h-10 w-10 rounded-full bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white font-bold border-2 border-white dark:border-slate-900 shadow-sm">
              {employer.name.charAt(0)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Wallet & Staked */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Shield className="w-32 h-32" />
              </div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Platform Stake</h3>
              <div className="mb-6">
                <p className="text-3xl font-black mb-1">{employer.balances.stakedAmount.toLocaleString()} <span className="text-lg font-medium">RP</span></p>
                <div className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5.2% Yield
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-t border-white/10">
                  <span className="text-xs text-slate-400">Available Funds</span>
                  <span className="font-bold">{employer.balances.stableCoin.toLocaleString()} {employer.balances.currency}</span>
                </div>
              </div>
            </div>

            {/* Public Addresses */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-slate-900 dark:text-white text-sm font-bold mb-4 flex items-center">
                <Wallet className="w-4 h-4 mr-2 text-indigo-600" />
                Company Wallets
              </h3>
              <div className="space-y-4">
                {Object.entries(employer.publicAddresses).map(([chain, address]) => (
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
                <Trophy className="w-4 h-4 mr-2 text-indigo-600" />
                Hiring Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Active</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{employer.stats.activeJobs}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Posted</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{employer.stats.totalJobsPosted}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl col-span-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Spent</p>
                  <p className="text-lg font-black text-indigo-600">{employer.stats.totalSpent} {employer.balances.currency}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Post Job Form (Hidden by default) */}
            {showRequestForm && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-900 shadow-xl shadow-indigo-100/20 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-indigo-600" />
                    Request a Freelancer
                  </h3>
                  <button onClick={() => setShowRequestForm(false)} className="text-slate-400 hover:text-slate-600">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Project Title</label>
                      <input type="text" placeholder="e.g. Smart Contract Audit" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Freelancer Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                        <input type="text" placeholder="sarahchen" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Budget (USDC)</label>
                      <input type="number" placeholder="5000" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Project Description</label>
                      <textarea rows={1} placeholder="Tell them what you need..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center transition-all">
                  Send Direct Request <Send className="w-4 h-4 ml-2" />
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-1">
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
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Job List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employer.jobs[activeTab].length > 0 ? (
                employer.jobs[activeTab].map(renderJobBlock)
              ) : (
                <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Briefcase className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No projects found in this category</p>
                  <button className="mt-4 text-indigo-600 font-bold text-sm hover:underline">Post a new job</button>
                </div>
              )}
            </div>

            {/* Activity Feed / Notifications */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <Flame className="w-5 h-5 mr-2 text-orange-500" />
                Recent Activity
              </h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mr-4 mt-1">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">New bid received for <span className="font-bold">Layer 2 Bridge Implementation</span></p>
                    <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mr-4 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Milestone 2 approved by <span className="font-bold">Nexus Finance</span></p>
                    <p className="text-xs text-slate-500 mt-1">5 hours ago</p>
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
