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
  Globe,
  Loader2,
  Check,
  CheckCircle2
} from "lucide-react";
import {
  get_post_configs,
  post_job,
  calc_expense,
  check_allowance
} from "@/services/jobs.service";
import { useEffect } from "react";
import { ethers } from "ethers";
import { get_user_balance, approve as approve_ethio } from "@/services/eth_coin.service.js"
import { approve as approve_rpt, get_allowance as get_rpt_allowance } from "@/services/rpt.service.js"
import { get_addresses } from "@/services/system_addresses.service.js";
export default function PostJobPage() {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    category: "",
    description: "",
    payment: "",
    maxWorkDuration: "",
    maxBiddingDuration: "",
  });

  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [topics, setTopics] = useState([]);
  const [currentTopic, setCurrentTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvingEthio, setApprovingEthio] = useState(false);
  const [approvingRPT, setApprovingRPT] = useState(false);
  const [categories, setCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0n);
  const [userBalance, setUserBalance] = useState(0n);
  const [allowanceStatus, setAllowanceStatus] = useState(null);
  const [checkingAllowance, setCheckingAllowance] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { levels, categories } = await get_post_configs();
        setLevels(levels);
        setCategories(categories);
        const balance = await get_user_balance();
        setUserBalance(balance);
      } catch (error) {
        console.error("Error fetching job configs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function updateAllowance() {
      if (formData.payment && !isNaN(formData.payment)) {
        try {
          setCheckingAllowance(true);
          const amountWei = ethers.parseUnits(formData.payment, 18);
          const status = await check_allowance(amountWei);
          const expense = await calc_expense(amountWei);
          setTotalExpense(expense);
          setAllowanceStatus(status);
        } catch (error) {
          console.error("Error checking allowance:", error);
        } finally {
          setCheckingAllowance(false);
        }
      } else {
        setAllowanceStatus(null);
        setTotalExpense(0n);
      }
    }
    updateAllowance();
  }, [formData.payment]);

  const handleApproveEthio = async () => {
    try {
      setApprovingEthio(true);
      const addresses = await get_addresses();
      const amountWei = ethers.parseUnits(formData.payment, 18);
      const expense = await calc_expense(amountWei);
      const success = await approve_ethio(addresses.job_manager_address, expense);
      if (success) {
        // Refresh allowance status
        const status = await check_allowance(amountWei);
        setAllowanceStatus(status);
      }
    } catch (error) {
      console.error("Error approving EthioCoin:", error);
    } finally {
      setApprovingEthio(false);
    }
  };

  const handleApproveRPT = async () => {
    try {
      setApprovingRPT(true);
      const addresses = await get_addresses();
      const amountWei = ethers.parseUnits(formData.payment, 18);
      const status = await check_allowance(amountWei);
      if (!status) return;
      
      const success = await approve_rpt(addresses.job_manager_address, status.rpt.required);
      if (success) {
        // Refresh allowance status
        const newStatus = await check_allowance(amountWei);
        setAllowanceStatus(newStatus);
      }
    } catch (error) {
      console.error("Error approving RPT:", error);
    } finally {
      setApprovingRPT(false);
    }
  };

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

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      setTopics([...topics, currentTopic.trim()]);
      setCurrentTopic("");
    }
  };

  const removeTopic = (topicToRemove) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const jobData = {
        title: formData.title,
        company: formData.company,
        category: categories[parseInt(formData.category)],
        cat_id: parseInt(formData.category),
        description: formData.description,
        amount: ethers.parseUnits(formData.payment, 18),
        max_duration: parseInt(formData.maxWorkDuration) * 86400,
        bid_duration: parseInt(formData.maxBiddingDuration) * 86400,
        topics: Array.isArray(topics) ? topics : String(topics || "").split(",").map(t => t.trim()).filter(Boolean),
        skills: Array.isArray(skills) ? skills : String(skills || "").split(",").map(s => s.trim()).filter(Boolean)
      };
      
      const success = await post_job(jobData);
      if (success) {
        alert("Job posted successfully!");
        setFormData({
          title: "",
          company: "",
          category: "",
          description: "",
          payment: "",
          maxWorkDuration: "",
          maxBiddingDuration: "",
        });
        setSkills([]);
        setTopics([]);
        setCurrentSkill("");
        setCurrentTopic("");
      } else {
        alert("Failed to post job.");
      }
    } catch (error) {
      console.error("Error posting job:", error);
      alert("Error posting job: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm font-medium text-slate-500 dark:text-slate-400">
          <a href="/employer" className="hover:text-indigo-600 transition-colors">Employer Dashboard</a>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-slate-900 dark:text-white">Post a New Job</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
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
                
                {/* Section 1: Basic Information */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mr-3 text-sm">1</span>
                    Basic Information
                  </h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Job Title</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                      placeholder="e.g. Smart Contract Developer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Company Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                      placeholder="e.g. Acme Labs"
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
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Job Category</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select 
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white appearance-none"
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map((cat, index) => <option key={index} value={index}>{cat}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Skills</label>
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

              <div className="space-y-2 mb-6">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Topics</label>
                <div className="relative mb-3">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={currentTopic}
                    onChange={(e) => setCurrentTopic(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTopic(e)}
                    className="w-full pl-12 pr-24 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                    placeholder="e.g. DeFi, DAOs, Layer 2"
                  />
                  <button 
                    type="button"
                    onClick={handleAddTopic}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topics.length === 0 && <p className="text-xs text-slate-400 italic ml-1">No topics added yet. Press Enter or click Add.</p>}
                  {topics.map(topic => (
                    <span key={topic} className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-800">
                      {topic}
                      <button type="button" onClick={() => removeTopic(topic)} className="ml-2 hover:text-red-500">
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
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Work Duration (Days)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="number" 
                      required
                      value={formData.maxWorkDuration}
                      onChange={(e) => setFormData({...formData, maxWorkDuration: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                      placeholder="e.g. 3"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Bidding Duration (Days)</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="number" 
                      required
                      value={formData.maxBiddingDuration}
                      onChange={(e) => setFormData({...formData, maxBiddingDuration: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                      placeholder="e.g. 7"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Info & Expense */}
            <div className="space-y-4">
              {allowanceStatus && (!allowanceStatus.ethio.sufficient || !allowanceStatus.rpt.sufficient) && (
                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-3xl space-y-4 transition-all">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">
                      <ShieldCheck className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm mb-1">Approvals Required</h4>
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        To post this job, you need to approve the transaction for USDC and RPT stakes. 
                        This only authorizes the contract to use the specified amounts.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {!allowanceStatus.ethio.sufficient && (
                      <button
                        type="button"
                        onClick={handleApproveEthio}
                        disabled={submitting || approvingEthio || approvingRPT}
                        className="flex-1 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 rounded-xl font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {approvingEthio ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                        Approve USDC ({ethers.formatUnits(allowanceStatus.ethio.required, 18)})
                      </button>
                    )}
                    {!allowanceStatus.rpt.sufficient && (
                      <button
                        type="button"
                        onClick={handleApproveRPT}
                        disabled={submitting || approvingEthio || approvingRPT}
                        className="flex-1 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 rounded-xl font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {approvingRPT ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                        Approve RPT ({ethers.formatUnits(allowanceStatus.rpt.required, 18)})
                      </button>
                    )}
                  </div>
                </div>
              )}

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

              {formData.payment && (
                <div className={`p-6 rounded-3xl border flex items-start space-x-4 transition-all ${totalExpense > userBalance ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50'}`}>
                  <div className="mt-1">
                    <Info className={`w-6 h-6 ${totalExpense > userBalance ? 'text-amber-500' : 'text-indigo-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className={`font-bold text-sm ${totalExpense > userBalance ? 'text-amber-900 dark:text-amber-200' : 'text-indigo-900 dark:text-indigo-200'}`}>Total Estimated Expense</h4>
                      <span className="text-xs font-mono font-bold">{ethers.formatUnits(totalExpense, 18)} USDC</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${totalExpense > userBalance ? 'text-amber-700 dark:text-amber-400' : 'text-indigo-700 dark:text-indigo-400'}`}>
                      {totalExpense > userBalance 
                        ? `Warning: This expense exceeds your current balance of ${ethers.formatUnits(userBalance, 18)} USDC. Please top up your wallet before posting.` 
                        : "Includes project payment and platform service fees."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button 
                type="submit"
                disabled={submitting || loading || checkingAllowance || !allowanceStatus || !allowanceStatus.ethio.sufficient || !allowanceStatus.rpt.sufficient}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center group disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Post This Job"} <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <p className="text-center text-xs text-slate-400 mt-4">
                By posting, you agree to the platform's <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:underline">Escrow Policy</a>.
              </p>
            </div>

          </form>
        </div>
      </div>

      {/* Sidebar: Work Levels */}
      <div className="lg:w-80 space-y-8">
        {levels && levels.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-indigo-100/20 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
              <Layers className="w-5 h-5 text-indigo-600 mr-2" />
              Work Levels
            </h3>
            <div className="space-y-4">
              {levels.map((level, index) => {
                let isActive = false;
                if (formData.payment && !isNaN(formData.payment) && Number(formData.payment) > 0) {
                  const paymentWei = ethers.parseUnits(formData.payment, 18);
                  const maxAmount = BigInt(level.max_amount);
                  const prevMaxAmount = index > 0 ? BigInt(levels[index - 1].max_amount) : -1n;
                  
                  if (index === 0) {
                    isActive = paymentWei <= maxAmount;
                  } else {
                    isActive = paymentWei <= maxAmount && paymentWei > prevMaxAmount;
                  }
                }
                
                return (
                  <div 
                    key={index} 
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700 ring-2 ring-indigo-500/20' 
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-1 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 uppercase tracking-wider">
                        Level {index + 1}
                      </span>
                      {isActive && (
                        <span className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Max Amount</span>
                        <span className="font-bold text-slate-900 dark:text-white">{ethers.formatUnits(level.max_amount, 18)} USDC</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Client Stake</span>
                        <span className="font-bold text-slate-900 dark:text-white">{ethers.formatUnits(level.client_stake, 18)} RPT</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Freelancer Stake</span>
                        <span className="font-bold text-slate-900 dark:text-white">{ethers.formatUnits(level.freelancer_stake, 18)} RPT</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Min Verifiers</span>
                        <span className="font-bold text-slate-900 dark:text-white">{Number(level.verifiers_cnt) / 10}%</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Payment Delay</span>
                        <span className="font-bold text-slate-900 dark:text-white">{Math.floor(Number(level.payment_duration) / 86400)} Days</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-3xl p-6">
          <div className="flex items-center text-amber-800 dark:text-amber-200 font-bold mb-2">
            <Info className="w-4 h-4 mr-2" />
            <span className="text-sm">Why Levels Matter?</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Higher budget jobs require higher stakes from both parties to ensure security and quality. Level is automatically determined by your project budget.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
