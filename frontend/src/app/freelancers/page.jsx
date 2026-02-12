"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  Star, 
  ShieldCheck, 
  Trophy, 
  Briefcase, 
  DollarSign, 
  User, 
  ArrowRight,
  ChevronDown,
  X,
  Award,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function FreelancersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State from URL or defaults
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All Categories");
  const [minRate, setMinRate] = useState(Number(searchParams.get("min_wage")) || 0);
  const [successRate, setSuccessRate] = useState(90); // Not currently in backend
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  
  const [freelancers, setFreelancers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const fetchFreelancers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (category && category !== "All Categories") params.append("category", category);
      if (minRate > 0) params.append("min_wage", minRate);
      params.append("page", page);
      params.append("limit", 10);

      const response = await axios.get(`http://localhost:3333/api/freelancers?${params.toString()}`);
      if (response.data) {
        setFreelancers(response.data.freelancers || []);
        setTotal(response.data.total || 0);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching freelancers:", error);
      setFreelancers([]);
      setTotal(0);
      setLoading(false);
    }
  }, [searchQuery, category, minRate, page]);

  useEffect(() => {
    fetchFreelancers();
  }, [fetchFreelancers]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (category && category !== "All Categories") params.set("category", category);
    if (minRate > 0) params.set("min_wage", minRate);
    if (page > 1) params.set("page", page);
    
    const queryString = params.toString();
    router.push(`/freelancers${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [searchQuery, category, minRate, page, router]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to page 1 on new search
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleRateChange = (e) => {
    setMinRate(Number(e.target.value));
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Search Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
            Find Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Freelance Talent</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
            Connect with verified professionals who accept stablecoins and build their reputation through successful deliveries.
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search by name, skill, or title..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center px-6 py-4 rounded-2xl font-bold transition-all border ${
                showFilters 
                ? "bg-indigo-600 text-white border-indigo-600" 
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-500"
              }`}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              {showFilters ? <X className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">Job Category</label>
                  <select 
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>All Categories</option>
                    <option>Blockchain Development</option>
                    <option>Software Development</option>
                    <option>Design & Creative</option>
                    <option>DevOps & Security</option>
                    <option>Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">Minimum Hourly Rate ({minRate}+ USDC)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="200" 
                    step="10"
                    value={minRate}
                    onChange={handleRateChange}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
                    <span>0</span>
                    <span>100</span>
                    <span>200+</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">Success Rate ({successRate}%+)</label>
                  <input 
                    type="range" 
                    min="80" 
                    max="100" 
                    step="5"
                    value={successRate}
                    onChange={(e) => setSuccessRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
                    <span>80%</span>
                    <span>90%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Showing <span className="font-bold text-slate-900 dark:text-white">{total}</span> professionals
          </p>
          <div className="flex items-center text-sm">
            <span className="text-slate-500 mr-2">Sort by:</span>
            <button className="font-bold text-indigo-600 flex items-center">
              Relevance <ChevronDown className="ml-1 w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Freelancers List */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-bold">Finding best talent for you...</p>
            </div>
          ) : freelancers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center px-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-6 text-slate-400">
                <Search className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No freelancers found</h3>
              <p className="text-slate-500 max-w-md">We couldn't find any freelancers matching your current filters. Try adjusting your search or filters.</p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setCategory("All Categories");
                  setMinRate(0);
                  setPage(1);
                }}
                className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : freelancers.map((freelancer) => (
            <div key={freelancer.id} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Left Side: Profile Info */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                          {freelancer.profile_picture ? (
                            <img src={`http://localhost:3333${freelancer.profile_picture}`} alt={freelancer.f_name} className="w-full h-full object-cover" />
                          ) : (
                            `${freelancer.f_name?.[0] || ""}${freelancer.l_name?.[0] || ""}` || <User />
                          )}
                        </div>
                        {true && ( // Assuming verification for now or add it to DB later
                          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-0.5 rounded-full">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-5">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {freelancer.f_name} {freelancer.l_name}
                          </h3>
                          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center">
                            <Award className="w-3 h-3 mr-1" />
                            {freelancer.min_wage > 100 ? "Top Rated Plus" : "Expert"}
                          </span>
                        </div>
                        <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{freelancer.title}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2 md:line-clamp-none">
                    {freelancer.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6 md:mb-0">
                    {freelancer.skills && (typeof freelancer.skills === 'string' ? (freelancer.skills.startsWith('[') ? JSON.parse(freelancer.skills) : freelancer.skills.split(',')) : freelancer.skills).map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {typeof skill === 'string' ? skill.trim() : skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Side: Stats & Actions */}
                <div className="md:w-72 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-6 md:pt-0 md:pl-8">
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Min. Rate</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">{freelancer.min_wage} USDC/hr</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Success</p>
                        <p className="text-sm font-black text-emerald-600">100%</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Location</p>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white truncate">{freelancer.location || "Remote"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <a href={`/freelancers/profile/${freelancer.id}`} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center group/btn">
                      View Profile <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                    <button className="w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center">
                      Contact
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {total > 10 && (
          <div className="mt-12 flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: Math.ceil(total / 10) }, (_, i) => i + 1).map((p) => (
                <button 
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                    p === page 
                    ? "bg-indigo-600 text-white" 
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
