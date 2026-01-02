"use client";

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Briefcase, 
  Clock, 
  DollarSign, 
  ChevronDown, 
  Star, 
  ShieldCheck,
  Tag,
  ArrowUpRight,
  SlidersHorizontal,
  X
} from "lucide-react";

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Mock job list data
  const jobList = [
    {
      id: "JOB-101",
      title: "Senior Solidity Developer for DeFi Lending Protocol",
      description: "We are looking for an experienced Solidity developer to audit and optimize our core lending contracts. You will be working with a team of elite blockchain engineers to ensure the security and efficiency of our protocol that handles over $50M TVL.",
      category: "Blockchain Development",
      topics: ["Solidity", "DeFi", "Smart Contracts", "Security"],
      paymentType: "Fixed Price",
      budget: "12,000 - 15,000 USDC",
      level: "Expert",
      postedAt: "2 hours ago",
      employer: {
        name: "LendWave DAO",
        rating: 4.9,
        verified: true
      }
    },
    {
      id: "JOB-102",
      title: "Full Stack Next.js & Web3 Integration",
      description: "Need a developer to build a clean, responsive dashboard for our NFT analytics platform. You'll be using Next.js, Tailwind CSS, and connecting to various subgraphs and RPC endpoints. Design is already finalized in Figma.",
      category: "Web Development",
      topics: ["Next.js", "Tailwind CSS", "Ethers.js", "GraphQL"],
      paymentType: "Hourly",
      budget: "$60 - $90 / hr",
      level: "Intermediate",
      postedAt: "5 hours ago",
      employer: {
        name: "MetaView Analytics",
        rating: 4.7,
        verified: true
      }
    },
    {
      id: "JOB-103",
      title: "Technical Writer for Protocol Documentation",
      description: "Create comprehensive technical documentation, API references, and user guides for our new Layer 2 scaling solution. Ability to explain complex cryptographic concepts in a clear, concise manner is required.",
      category: "Writing & Translation",
      topics: ["Technical Writing", "Cryptography", "Documentation", "L2s"],
      paymentType: "Fixed Price",
      budget: "3,500 USDC",
      level: "Intermediate",
      postedAt: "1 day ago",
      employer: {
        name: "ZKSync Ecosystem",
        rating: 5.0,
        verified: true
      }
    },
    {
      id: "JOB-104",
      title: "Community Manager & Discord Moderator",
      description: "Manage our growing community on Discord and Twitter. Host weekly AMAs, manage moderators, and coordinate with the marketing team for announcements. Deep understanding of crypto culture is a must.",
      category: "Marketing",
      topics: ["Community Management", "Discord", "Marketing", "Social Media"],
      paymentType: "Hourly",
      budget: "$25 - $40 / hr",
      level: "Entry Level",
      postedAt: "3 days ago",
      employer: {
        name: "Alpha Pulse DAO",
        rating: 4.5,
        verified: false
      }
    },
    {
      id: "JOB-105",
      title: "UI/UX Designer for Web3 Wallet",
      description: "Design a mobile-first crypto wallet focusing on simplicity and security. We need high-fidelity prototypes and a complete design system. Experience with wallet-specific UX challenges (seed phrases, gas fees) is preferred.",
      category: "Design & Creative",
      topics: ["UI/UX Design", "Figma", "Product Design", "Crypto Wallet"],
      paymentType: "Fixed Price",
      budget: "8,000 USDC",
      level: "Expert",
      postedAt: "4 days ago",
      employer: {
        name: "Nexus Wallet",
        rating: 4.8,
        verified: true
      }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Find Your Next Opportunity</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">
            Browse through high-quality projects, earn stablecoins, and grow your reputation in the decentralized ecosystem.
          </p>
        </div>

        {/* Search and Quick Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search for jobs, skills, or companies..."
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center space-x-2 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold md:w-auto"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
          </button>
          <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
            Search
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className={`lg:block ${showFilters ? 'block' : 'hidden'} lg:col-span-1 space-y-6`}>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-6 lg:hidden">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
              </div>

              {/* Category Filter */}
              <div className="mb-8">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  Category
                </h4>
                <div className="space-y-3">
                  {["Blockchain Development", "Web Development", "Design & Creative", "Writing", "Marketing"].map((cat) => (
                    <label key={cat} className="flex items-center group cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-3" />
                      <span className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Level Filter */}
              <div className="mb-8">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Experience Level</h4>
                <div className="space-y-3">
                  {["Entry Level", "Intermediate", "Expert"].map((level) => (
                    <label key={level} className="flex items-center group cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-3" />
                      <span className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Budget Range (USDC)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Min" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                  <input type="number" placeholder="Max" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Hourly Rate Range */}
              <div className="mb-8">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Hourly Rate ($)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Min" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                  <input type="number" placeholder="Max" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Topics */}
              <div className="mb-6">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Popular Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {["Solidity", "React", "Rust", "DeFi", "NFTs", "DAO"].map((topic) => (
                    <button key={topic} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors">
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Job List */}
          <main className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center mb-2 px-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">{jobList.length} jobs found</span>
              <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                <span className="mr-2">Sort by:</span>
                <button className="flex items-center text-slate-900 dark:text-white">
                  Newest First <ChevronDown className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>

            {jobList.map((job) => (
              <div key={job.id} className="group bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all cursor-pointer">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                        {job.category}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{job.postedAt}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 transition-colors">
                      {job.title}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 line-clamp-2 md:line-clamp-3">
                      {job.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {job.topics.map((topic) => (
                        <span key={topic} className="flex items-center px-3 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-lg text-sm font-medium border border-slate-100 dark:border-slate-800">
                          <Tag className="w-3 h-3 mr-1.5 opacity-60" />
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-between md:min-w-[200px] h-full">
                    <div className="mb-4 md:text-right">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {job.budget}
                      </div>
                      <div className="flex items-center md:justify-end text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <Briefcase className="w-4 h-4 mr-1.5" />
                        {job.paymentType} • {job.level}
                      </div>
                    </div>

                    <div className="flex items-center md:justify-end space-x-4">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center text-sm font-bold text-slate-900 dark:text-white">
                          {job.employer.name}
                          {job.employer.verified && <ShieldCheck className="w-4 h-4 ml-1 text-blue-500" />}
                        </div>
                        <div className="flex items-center text-xs text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-500 mr-1" />
                          {job.employer.rating}
                        </div>
                      </div>
                      <button className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowUpRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination / Load More */}
            <div className="pt-8 flex justify-center">
              <button className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Load More Jobs
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
