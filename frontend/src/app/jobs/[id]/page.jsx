"use client";

import React, { useState } from "react";
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  Tag, 
  User, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight,
  ExternalLink,
  Code,
  Layers,
  Calendar,
  Send,
  History,
  Info
} from "lucide-react";

export default function JobPage() {
  // Mock job data based on requirements
  const job = {
    id: "JOB-2025-042",
    title: "Expert Solidity Developer for Decentralized Lending Protocol",
    category: "Blockchain Development",
    topics: ["DeFi", "Lending", "Smart Contracts", "Security"],
    amount: 15000,
    currency: "USDC",
    description: `We are looking for an expert Solidity developer to lead the development of our core lending protocol. The project involves building a non-custodial liquidity market where users can participate as depositors or borrowers.

Key responsibilities include:
- Designing and implementing secure smart contracts for interest rate models.
- Integrating with price oracles (Chainlink/Pyth).
- Implementing liquidation logic and safety modules.
- Writing comprehensive unit tests and coordinating with external auditors.

This is a high-stakes project requiring deep knowledge of the EVM and previous experience with DeFi primitives.`,
    details: {
      level: "Expert",
      time: "3-6 months",
      type: "Fixed Price",
      postedDate: "2 days ago"
    },
    skills: ["Solidity", "Hardhat/Foundry", "OpenZeppelin", "DeFi Architecture", "TypeScript"],
    employer: {
      name: "Nexus Finance",
      profileLink: "/employer/nexus-finance",
      contact: "contact@nexus.finance",
      previousRelation: "Previous successful collaboration on 'Oracle Integration' project (Completed Jan 2025). High trust rating.",
      rating: 4.8,
      totalSpent: "120k+",
      verified: true
    },
    bids: [
      {
        id: 1,
        freelancer: "CryptoWiz",
        amount: 14500,
        days: 90,
        rating: 5.0,
        repScore: 98,
        description: "I've built 3 lending protocols previously (Aave-v2 forks and original designs). Can ensure top-tier security.",
        date: "1 day ago"
      },
      {
        id: 2,
        freelancer: "SolidStacker",
        amount: 15000,
        days: 120,
        rating: 4.9,
        repScore: 92,
        description: "Expert in audit-ready Solidity code. My focus is on gas optimization and modularity.",
        date: "12 hours ago"
      }
    ]
  };

  const [bidAmount, setBidAmount] = useState(job.amount);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm font-medium text-slate-500 dark:text-slate-400">
          <a href="/" className="hover:text-indigo-600 transition-colors">Marketplace</a>
          <ChevronRight className="w-4 h-4 mx-2" />
          <a href="#" className="hover:text-indigo-600 transition-colors">{job.category}</a>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-slate-900 dark:text-white truncate">{job.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Job Header & Title */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  {job.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  {job.details.type}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs ml-auto">
                  ID: {job.id}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                {job.title}
              </h1>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-50 dark:border-slate-800">
                <div className="flex items-center">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
                    <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Budget</p>
                    <p className="font-bold text-slate-900 dark:text-white">{job.amount.toLocaleString()} {job.currency}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
                    <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Experience</p>
                    <p className="font-bold text-slate-900 dark:text-white">{job.details.level}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Duration</p>
                    <p className="font-bold text-slate-900 dark:text-white">{job.details.time}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
                    <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Posted</p>
                    <p className="font-bold text-slate-900 dark:text-white">{job.details.postedDate}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Description</h3>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {job.description}
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Topics Covered</h3>
                <div className="flex flex-wrap gap-2">
                  {job.topics.map((topic, i) => (
                    <div key={i} className="flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Tag className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <Code className="w-5 h-5 mr-2 text-indigo-600" />
                Required Skills
              </h3>
              <div className="flex flex-wrap gap-3">
                {job.skills.map((skill, i) => (
                  <span key={i} className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-2xl text-sm font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Bid List Section */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                  <History className="w-5 h-5 mr-2 text-indigo-600" />
                  Recent Bids ({job.bids.length})
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Average Bid: <span className="font-bold text-indigo-600">14,750 USDC</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {job.bids.map((bid) => (
                  <div key={bid.id} className="group p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mr-4 shadow-sm">
                          {bid.freelancer.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h4 className="font-bold text-slate-900 dark:text-white mr-2 group-hover:text-indigo-600 transition-colors cursor-pointer">{bid.freelancer}</h4>
                            <div className="flex items-center bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-1" />
                              {bid.rating}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reputation: <span className="text-indigo-500">{bid.repScore}/100</span></p>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center">
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{bid.amount.toLocaleString()} USDC</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Delivery in {bid.days} days</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      "{bid.description}"
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      <span>Submitted {bid.date}</span>
                      <button className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View Proposal</button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center">
                Show All Bids
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Bid Submission Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-indigo-100/20 dark:shadow-none border border-indigo-100 dark:border-indigo-900/50 sticky top-24">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Submit Your Bid</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Your Proposed Budget</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input 
                      type="number" 
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-16 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">USDC</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estimated Delivery</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="e.g. 30"
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Days</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Proposal Overview</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe how you will solve this problem..."
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  ></textarea>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-start">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-tight mb-1">Secure Payment</p>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-400 leading-snug">
                        Funds will be locked in an escrow smart contract and released upon milestone completion.
                      </p>
                    </div>
                  </div>
                </div>

                <button className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center group">
                  Post Proposal <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Employer Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-600" />
                About Employer
              </h3>
              
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold text-2xl mr-4">
                  {job.employer.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center">
                    {job.employer.name}
                    {job.employer.verified && <ShieldCheck className="w-4 h-4 text-blue-500 ml-1.5" />}
                  </h4>
                  <div className="flex items-center text-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">{job.employer.rating}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="text-slate-500 dark:text-slate-400">{job.employer.totalSpent} spent</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <a href={job.employer.profileLink} className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  View full profile <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
                <a href={`mailto:${job.employer.contact}`} className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Contact employer <MessageSquare className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-start mb-2">
                  <Info className="w-4 h-4 text-slate-400 mr-2 mt-0.5" />
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Previous Relation</p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  "{job.employer.previousRelation}"
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
