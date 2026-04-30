"use client";
//TODO:show them their levels and don't allow more than one bid for freelancer for a job and give them button to delete bids
import React, { useEffect, useState } from "react";
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
import { list_jobs, get_job_blockchain } from "@/services/jobs.service";
import Link from "next/link";
import {ethers} from "ethers";

const normalizeList = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      // fall through
    }
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobList, setJobList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    minSalary: "",
    maxSalary: "",
    skills: []
  });

  const loadJobs = async (currentFilters = {}) => {
    setLoading(true);
    try {
      const apiJobs = await list_jobs({
        search: searchQuery,
        ...currentFilters
      });
      // Use data from API instead of individual blockchain calls
      const enriched = (apiJobs || []).map((j) => {
        const topicsArr = normalizeList(j.topics);
        const salary = ethers.formatUnits(j.salary || 0, 18);
        // A job is verified if it exists in our database (since they are only added after blockchain confirmation)
        // Or we can rely on the 'state' being set
        const verified = !!j.state; 
        
        return {
          id: j.id,
          title: j.title,
          description: j.description,
          category: j.category,
          topics: topicsArr,
          salary: salary,
          state: j.state,
          bid_duration: j.bid_duration,
          postedAt: new Date(j.published_date || Date.now()).toLocaleDateString(),
          employer: { 
            name: j.employer_name || 'Unknown', 
            rating: 0, 
            verified 
          },
          verified,
        };
      });
      setJobList(enriched);
    } catch (e) {
      console.error('Failed to load jobs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // In a real app we'd fetch categories from API, here we might have some default or fetch them
    setCategories(["Web Development", "Graphic Design", "Content Writing", "Digital Marketing", "Data Analysis", "Mobile App Development", "SEO Services", "Video Editing", "Translation Services", "Virtual Assistance"]);
  }, []);

  const handleApplyFilters = () => {
    loadJobs(filters);
    if (window.innerWidth < 1024) setShowFilters(false);
  };

  const toggleSkill = (skill) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadJobs(filters);
  };

  // Frontend filtering for real-time feedback (optional, but good for efficiency as requested)
  const filteredJobs = jobList.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });


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
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-8">
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
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center space-x-2 px-6 py-4 bg-white dark:bg-slate-900 border ${showFilters ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold md:w-auto`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
          </button>
          <button type="submit" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
            Search
          </button>
        </form>

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
                <select 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Budget Range (USDC)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500" 
                    value={filters.minSalary}
                    onChange={(e) => setFilters({...filters, minSalary: e.target.value})}
                  />
                  <input 
                    type="number" 
                    placeholder="Max" 
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500" 
                    value={filters.maxSalary}
                    onChange={(e) => setFilters({...filters, maxSalary: e.target.value})}
                  />
                </div>
              </div>

              {/* Topics */}
              <div className="mb-6">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {["Solidity", "React", "Rust", "DeFi", "NFTs", "DAO", "UI/UX", "Node.js"].map((skill) => (
                    <button 
                      key={skill} 
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        filters.skills.includes(skill)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleApplyFilters}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Apply Filters
              </button>
              
              <button 
                onClick={() => {
                  const resetFilters = { category: "", minSalary: "", maxSalary: "", skills: [] };
                  setFilters(resetFilters);
                  loadJobs(resetFilters);
                }}
                className="w-full mt-2 py-2 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:text-indigo-600 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Job List */}
          <main className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center mb-2 px-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">{loading ? 'Loading...' : `${filteredJobs.length} jobs found`}</span>
              <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                <span className="mr-2">Sort by:</span>
                <button className="flex items-center text-slate-900 dark:text-white">
                  Newest First <ChevronDown className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>

            {!loading && filteredJobs.map((job) => (
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
                      {job.topics.map((topic, idx) => (
                        <span key={`${topic}-${idx}`} className="flex items-center px-3 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-lg text-sm font-medium border border-slate-100 dark:border-slate-800">
                          <Tag className="w-3 h-3 mr-1.5 opacity-60" />
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-between md:min-w-[200px] h-full">
                    <div className="mb-4 md:text-right">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {job.salary ? `${job.salary} USDC` : '—'}
                      </div>
                      <div className="flex items-center md:justify-end text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <Briefcase className="w-4 h-4 mr-1.5" />
                        {job.verified ? 'Verified on-chain' : 'Unverified'} • Bids: 
                      </div>
                    </div>

                    <div className="flex items-center md:justify-end space-x-4">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center text-sm font-bold text-slate-900 dark:text-white">
                          {job.employer.name}
                          {job.verified && <ShieldCheck className="w-4 h-4 ml-1 text-blue-500" />}
                        </div>
                        <div className="flex items-center text-xs text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-500 mr-1" />
                          {job.employer.rating}
                        </div>
                      </div>
                      <Link href={`/jobs/${job.id}`} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowUpRight className="w-5 h-5" />
                      </Link>
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
