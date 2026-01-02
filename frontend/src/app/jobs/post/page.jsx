"use client";

import React, { useState } from "react";
import { 
  Briefcase, 
  Mail, 
  User, 
  Tag, 
  Layers, 
  FileText, 
  DollarSign, 
  Clock, 
  Calendar,
  Send,
  ChevronRight,
  ShieldCheck,
  Plus,
  X,
  Info,
  Globe
} from "lucide-react";

export default function PostJobPage() {
  const [formData, setFormData] = useState({
    employerName: "Nexus Finance",
    employerEmail: "contact@nexus.finance",
    category: "",
    level: "Intermediate",
    description: "",
    payment: "",
    maxWorkDuration: "",
    maxBiddingDuration: "",
  });

  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Job Posted:", { ...formData, skills });
    alert("Job posting submitted successfully! (Demo)");
  };

  const categories = [
    "Blockchain Development",
    "Web Development",
    "Mobile App Development",
    "Smart Contract Audit",
    "DeFi Architecture",
    "UI/UX Design",
    "Technical Writing",
    "DevOps & Security"
  ];

  const levels = ["Entry Level", "Intermediate", "Expert"];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm font-medium text-slate-500 dark:text-slate-400">
          <a href="/employer" className="hover:text-indigo-600 transition-colors">Employer Dashboard</a>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-slate-900 dark:text-white">Post a New Job</span>
        </nav>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-indigo-100/20 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-indigo-600 px-8 py-10 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl font-extrabold mb-2">Create a Job Posting</h1>
              <p className="text-indigo-100 max-w-xl">
                Connect with the world's best blockchain talent. Define your project details and find the perfect match.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
            
            {/* Section 1: Employer Info */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mr-3 text-sm">1</span>
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Employer Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={formData.employerName}
                      onChange={(e) => setFormData({...formData, employerName: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                      placeholder="Your name or company name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      value={formData.employerEmail}
                      onChange={(e) => setFormData({...formData, employerEmail: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Job Details */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mr-3 text-sm">2</span>
                Project Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">General Category</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select 
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white appearance-none"
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Experience Level</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select 
                      required
                      value={formData.level}
                      onChange={(e) => setFormData({...formData, level: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white appearance-none"
                    >
                      {levels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Skills / Topics</label>
                <div className="relative mb-3">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill(e)}
                    className="w-full pl-12 pr-24 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                    placeholder="e.g. Solidity, React, DeFi"
                  />
                  <button 
                    type="button"
                    onClick={handleAddSkill}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 && <p className="text-xs text-slate-400 italic ml-1">No skills added yet. Press Enter or click Add.</p>}
                  {skills.map(skill => (
                    <span key={skill} className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-800">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="ml-2 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Project Description</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <textarea 
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                    placeholder="Describe the job, requirements, and deliverables in detail..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Section 3: Payment & Timeline */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mr-3 text-sm">3</span>
                Budget & Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Payment (USDC)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="number" 
                      required
                      value={formData.payment}
                      onChange={(e) => setFormData({...formData, payment: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white font-bold"
                      placeholder="5000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Work Duration</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={formData.maxWorkDuration}
                      onChange={(e) => setFormData({...formData, maxWorkDuration: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                      placeholder="e.g. 3 months"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Bidding Ends In</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={formData.maxBiddingDuration}
                      onChange={(e) => setFormData({...formData, maxBiddingDuration: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                      placeholder="e.g. 7 days"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Info */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-start space-x-4">
              <div className="mt-1">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Escrow Security Enabled</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your payment will be secured in a blockchain escrow contract. Funds are only released when milestones are completed or through community dispute resolution.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button 
                type="submit"
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center group"
              >
                Post This Job <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <p className="text-center text-xs text-slate-400 mt-4">
                By posting, you agree to the platform's <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:underline">Escrow Policy</a>.
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
