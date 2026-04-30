"use client";

import React, { useState, useEffect } from "react";
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
  Send,
  X,
  User,
  Loader2
} from "lucide-react";
import { get_employer_jobs } from "@/services/employer.service";
import { 
  get_job_blockchain, 
  cancel_job, 
  cancel_pending_hire, 
  cancel_hire, 
  complete_job, 
  pay_freelancer,
  estimate_dispute_fee,
  raise_dispute
} from "@/services/jobs.service";
import { ethers } from "ethers";

const JOB_STATUS = {
    NONE: 0,
    OPEN: 1,
    PENDING: 2,
    HIRED: 3,
    COMPLETED: 4,
    DISPUTED: 5,
    CLOSED: 6
};

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState({
    workingOn: [],
    bidding: [],
    inDispute: [],
    paymentWaiting: [],
    finished: [],
    requested: []
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // { jobId: { actionName: true } }
  const [activeTab, setActiveTab] = useState("workingOn");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedJobBids, setSelectedJobBids] = useState(null);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [disputeModal, setDisputeModal] = useState({ show: false, jobId: null, feeEth: 0n, feeLink: 0n, loading: false, reason: "", details: "" });

  const handleOpenDisputeModal = (jobId) => {
    window.location.href = `/post-dispute?jobId=${jobId}`;
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const apiJobs = await get_employer_jobs();
      const enrichedJobs = await Promise.all(apiJobs.map(async (job) => {
        const blockchainData = await get_job_blockchain(job.id);
        return { ...job, blockchain: blockchainData };
      }));

      const classified = {
        workingOn: [],
        bidding: [],
        inDispute: [],
        paymentWaiting: [],
        finished: [],
        requested: []
      };

      enrichedJobs.forEach(job => {
        const status = Number(job.blockchain?.status || 0);
        const isExpired = job.blockchain?.expiry_timestamp && Number(job.blockchain.expiry_timestamp) * 1000 < Date.now();

        if (status === JOB_STATUS.OPEN) {
          classified.bidding.push(job);
        } else if (status === JOB_STATUS.PENDING) {
          classified.requested.push(job);
        } else if (status === JOB_STATUS.HIRED) {
          if (isExpired) {
              // Expired and not completed
              classified.workingOn.push({...job, expired: true});
          } else {
              classified.workingOn.push(job);
          }
        } else if (status === JOB_STATUS.COMPLETED) {
          classified.paymentWaiting.push(job);
        } else if (status === JOB_STATUS.DISPUTED) {
          classified.inDispute.push(job);
        } else if (status === JOB_STATUS.CLOSED) {
          classified.finished.push(job);
        }
      });

      setJobs(classified);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCancelJob = async (jobId) => {
    if (!confirm("Are you sure you want to cancel this job?")) return;
    setActionLoading(prev => ({ ...prev, [jobId]: { ...prev[jobId], cancel: true } }));
    const success = await cancel_job(jobId);
    if (success) {
      alert("Job canceled successfully");
      fetchJobs();
    } else {
      alert("Failed to cancel job");
    }
    setActionLoading(prev => ({ ...prev, [jobId]: { ...prev[jobId], cancel: false } }));
  };

  const handleCancelPendingHire = async (jobId) => {
    if (!confirm("Are you sure you want to cancel this pending hire?")) return;
    setActionLoading(prev => ({ ...prev, [jobId]: { ...prev[jobId], cancelPending: true } }));
    const success = await cancel_pending_hire(jobId);
    if (success) {
      alert("Pending hire canceled successfully");
      fetchJobs();
    } else {
      alert("Failed to cancel pending hire");
    }
    setActionLoading(prev => ({ ...prev, [jobId]: { ...prev[jobId], cancelPending: false } }));
  };

  const handleCancelHire = async (jobId) => {
    if (!confirm("Are you sure you want to cancel this hire (expired)?")) return;
    setActionLoading(prev => ({ ...prev, [jobId]: { ...prev[jobId], cancelHire: true } }));
    const success = await cancel_hire(jobId);
    if (success) {
      alert("Hire canceled successfully");
      fetchJobs();
    } else {
      alert("Failed to cancel hire");
    }
    setActionLoading(prev => ({ ...prev, [jobId]: { ...prev[jobId], cancelHire: false } }));
  };

  const handlePayFreelancer = async (jobId) => {
    if (!confirm("Are you sure you want to pay the freelancer?")) return;
    setActionLoading(prev => ({ ...prev, [jobId]: { ...prev[jobId], pay: true } }));
    const success = await pay_freelancer(jobId);
    if (success) {
      alert("Freelancer paid successfully");
      fetchJobs();
    } else {
      alert("Failed to pay freelancer");
    }
    setActionLoading(prev => ({ ...prev, [jobId]: { ...prev[jobId], pay: false } }));
  }

  const jobTabs = [
    { id: "workingOn", label: "Working On", icon: Cpu, count: jobs.workingOn.length },
    { id: "bidding", label: "Bidding", icon: Hourglass, count: jobs.bidding.length },
    { id: "inDispute", label: "In Dispute", icon: AlertCircle, count: jobs.inDispute.length, color: "text-red-500" },
    { id: "paymentWaiting", label: "Waiting Payment", icon: Wallet, count: jobs.paymentWaiting.length },
    { id: "finished", label: "Finished", icon: CheckCircle2, count: jobs.finished.length },
    { id: "requested", label: "Requested", icon: UserPlus, count: jobs.requested.length, color: "text-indigo-600" },
  ];

  const renderJobBlock = (job) => (
    <div key={job.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
            <a href={`/jobs/${job.id}`} className="flex items-center">
              {job.title}
              <ArrowUpRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center">
            {job.blockchain?.freelancer && job.blockchain.freelancer !== '0x0000000000000000000000000000000000000000' ? (
              <>Freelancer: <span className="font-semibold ml-1 text-slate-700 dark:text-slate-300">{job.blockchain.freelancer.slice(0,6)}...{job.blockchain.freelancer.slice(-4)}</span></>
            ) : (
              <>Bids: <span className="font-semibold ml-1 text-slate-700 dark:text-slate-300">{job.bids?.length || 0} proposals</span></>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900 dark:text-white">{job.blockchain?.amount ? ethers.formatUnits(job.blockchain.amount, 18) : (job.amount ? ethers.formatUnits(job.amount, 18) : "0")} USDC</p>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Budget</span>
        </div>
      </div>
      
      {job.expired ? (
        <div className="mb-4 flex items-center bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest animate-pulse">
            <AlertCircle className="w-5 h-5 mr-2" />
            JOB EXPIRED - ACTION REQUIRED
        </div>
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
          {job.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            activeTab === 'inDispute' ? 'bg-red-500' : 
            activeTab === 'finished' ? 'bg-emerald-500' : 
            activeTab === 'paymentWaiting' ? 'bg-amber-500' : 'bg-indigo-500'
          }`}></div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
              {Object.keys(JOB_STATUS).find(key => JOB_STATUS[key] === Number(job.blockchain?.status)) || 'Unknown'}
          </span>
        </div>
        
        <div className="flex gap-2">
            {activeTab === 'bidding' && (
                <>
                <button 
                    onClick={() => {
                        setSelectedJobBids(job.bids || []);
                        setShowBidsModal(true);
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    View Bids
                </button>
                <button 
                    disabled={actionLoading[job.id]?.cancel}
                    onClick={() => handleCancelJob(job.id)}
                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center"
                >
                    {actionLoading[job.id]?.cancel ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Canceling</> : "Cancel Job"}
                </button>
                </>
            )}
            {activeTab === 'requested' && (
                <button 
                    disabled={actionLoading[job.id]?.cancelPending}
                    onClick={() => handleCancelPendingHire(job.id)}
                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center"
                >
                    {actionLoading[job.id]?.cancelPending ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Canceling</> : "Cancel Pending Hire"}
                </button>
            )}
            {activeTab === 'workingOn' && job.expired && (
                <button 
                    disabled={actionLoading[job.id]?.cancelHire}
                    onClick={() => handleCancelHire(job.id)}
                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center"
                >
                    {actionLoading[job.id]?.cancelHire ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Canceling</> : "Cancel Hire"}
                </button>
            )}
            {activeTab === 'paymentWaiting' && (
                <div className="flex gap-2">
                    <button 
                        disabled={actionLoading[job.id]?.pay}
                        onClick={() => handlePayFreelancer(job.id)}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center"
                    >
                        {actionLoading[job.id]?.pay ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Paying</> : "Pay Freelancer"}
                    </button>
                    <button 
                        onClick={() => handleOpenDisputeModal(job.id)}
                        className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
                    >
                        Raise Dispute
                    </button>
                </div>
            )}
            <a href={`/jobs/${job.id}`} className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:underline">Details</a>
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
            <div className="flex items-center mb-1">
               <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center">
                <LayoutDashboard className="w-8 h-8 mr-3 text-indigo-600" />
                Employer Dashboard
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Managing your talent and projects.
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Stats */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-slate-900 dark:text-white text-sm font-bold mb-4 flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-indigo-600" />
                Hiring Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Working</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{jobs.workingOn.length}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Finished</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{jobs.finished.length}</p>
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
              {loading ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
              ) : jobs[activeTab].length > 0 ? (
                jobs[activeTab].map(renderJobBlock)
              ) : (
                <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Briefcase className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No projects found in this category</p>
                  <a href="/jobs/post" className="mt-4 text-indigo-600 font-bold text-sm hover:underline">Post a new job</a>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Bids Modal */}
      {showBidsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Bids</h3>
                    <button onClick={() => setShowBidsModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {selectedJobBids && selectedJobBids.length > 0 ? (
                        selectedJobBids.map((bid, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold mr-3">
                                            {(bid.fu_f_name || "F").charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{bid.fu_f_name || "Freelancer"}</p>
                                            <p className="text-xs text-slate-500">{bid.freelancer_email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 dark:text-white">{ethers.formatUnits(bid.amount || 0, 18)} USDC</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">{bid.finishing_days} Days</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{bid.cover_letter}"</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-8 text-slate-500">No bids yet for this job.</p>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Raise Dispute</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">
              A dispute will be initiated for this job. You need to pay the VRF fee for verifier selection.
            </p>
            
            {disputeModal.loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Reason</label>
                  <input 
                    type="text" 
                    value={disputeModal.reason}
                    onChange={(e) => setDisputeModal({...disputeModal, reason: e.target.value})}
                    placeholder="Short reason"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Details (Optional)</label>
                  <textarea 
                    value={disputeModal.details}
                    onChange={(e) => setDisputeModal({...disputeModal, details: e.target.value})}
                    placeholder="Provide more information..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  ></textarea>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Fee (Native ETH)</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{ethers.formatEther(disputeModal.feeEth)} ETH</span>
                  </div>
                  <button 
                    onClick={() => handleRaiseDispute(false)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Pay with ETH
                  </button>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Fee (LINK Token)</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{ethers.formatEther(disputeModal.feeLink)} LINK</span>
                  </div>
                  <button 
                    onClick={() => handleRaiseDispute(true)}
                    className="w-full py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Pay with LINK
                  </button>
                </div>
                
                <button 
                  onClick={() => setDisputeModal({ ...disputeModal, show: false })}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
