"use client";

import React, {useState, useEffect} from "react";
import {
    Shield,
    User,
    Coins,
    Award,
    Lock,
    Trophy,
    Globe,
    ExternalLink,
    Key,
    Layers,
    AlertCircle,
    CheckCircle2,
    Eye,
    Gavel,
    Search,
    ChevronRight,
    TrendingUp,
    Clock,
    LayoutDashboard,
    Send,
    ArrowUpCircle,
    ArrowDownCircle
} from "lucide-react";
import {ethers} from "ethers";
import {
    get_verifier_data,
    get_stack_levels,
    stake_rpt,
    unstake_rpt,
    transfer_verifier_address,
    get_categories,
    get_verifier_backend_data
} from "@/services/verifiers.service";
import connect_wallet from "@/services/connect_wallet.service";

export default function VerifierPanel() {
    const [address, setAddress] = useState("");
    const [verifierData, setVerifierData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stakeAmount, setStakeAmount] = useState("");
    const [transferAddress, setTransferAddress] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    const [backendData, setBackendData] = useState(null);
    const [stackLevels, setStackLevels] = useState([]);

    useEffect(() => {
        async function init() {
            try {
                const {signer} = await connect_wallet();
                const userAddress = await signer.getAddress();
                setAddress(userAddress);

                const data = await get_verifier_data(userAddress);
                setVerifierData(data);

                const cats = await get_categories();
                setCategories(cats);

                const levels = await get_stack_levels();
                setStackLevels(levels || []);

                const bData = await get_verifier_backend_data(ethers.keccak256(ethers.getBytes(userAddress)));
                setBackendData(bData);
            } catch (error) {
                console.error("Failed to initialize verifier panel:", error);
            } finally {
                setLoading(false);
            }
        }

        init();
    }, []);

    const refreshData = async () => {
        if (address) {
            const data = await get_verifier_data(address);
            setVerifierData(data);
            const levels = await get_stack_levels();
            setStackLevels(levels || []);
            const bData = await get_verifier_backend_data(ethers.keccak256(ethers.getBytes(address)));
            setBackendData(bData);
        }
    };

    const handleStake = async () => {
        if (!stakeAmount || isNaN(stakeAmount)) return;
        setActionLoading(true);
        try {
            const amount = ethers.parseEther(stakeAmount);
            const success = await stake_rpt(amount);
            if (success) {
                alert("Staked successfully!");
                setStakeAmount("");
                await refreshData();
            }
        } catch (error) {
            console.error("Staking failed:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnstake = async () => {
        setActionLoading(true);
        try {
            const success = await unstake_rpt();
            if (success) {
                alert("Unstaked successfully!");
                await refreshData();
            }
        } catch (error) {
            console.error("Unstaking failed:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (!ethers.isAddress(transferAddress)) {
            alert("Invalid address");
            return;
        }
        setActionLoading(true);
        try {
            const success = await transfer_verifier_address(transferAddress);
            if (success) {
                alert("Address transferred successfully!");
                setTransferAddress("");
                // Redirect or refresh? Since the current address is no longer a verifier
                window.location.reload();
            }
        } catch (error) {
            console.error("Transfer failed:", error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!verifierData || !verifierData.verified) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950/50">
                <div
                    className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-md">
                    <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4"/>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Not Registered</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Your
                        address {address.slice(0, 6)}...{address.slice(-4)} is not registered as a verifier in our
                        system.</p>
                    <button onClick={() => window.location.href = '/'}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Return Home
                    </button>
                </div>
            </div>
        );
    }

    const verifier = {
        name: backendData?.email || "Verifier", // Use email from backend as name for now
        skills: ["Solidity Architecture", "DeFi Risk Assessment", "Governance Design"],
        categories: [categories[verifierData.category] || "General"],
        level: verifierData.level,
        publicAddresses: {
            ethereum: address,
        },
        stats: {
            totalStaked: ethers.formatEther(verifierData.staked),
            lockedAmount: ethers.formatEther(verifierData.locked),
            totalRewards: ethers.formatEther(verifierData.pendingRewards),
            totalParticipated: backendData?.jobs?.length || 0
        },
        jobs: backendData?.jobs?.map(job => ({
            id: job.id,
            title: job.title,
            description: job.description,
            status: "open", // Map these based on real logic if available
            stakedAmount: Number(ethers.formatEther(verifierData.locked)) / (backendData.jobs.length || 1), // Heuristic
            link: "#",
            salt: "********",
            level: categories[job.category] || job.category,
            employer: "System"
        })) || []
    };

    const filteredJobs = activeTab === "all"
        ? verifier.jobs
        : verifier.jobs.filter(job => job.status === activeTab);

    const getStatusColor = (status) => {
        switch (status) {
            case "open":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
            case "submit":
                return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
            case "reveal":
                return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800";
            case "resolved":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
            default:
                return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "open":
                return <AlertCircle className="w-3.5 h-3.5 mr-1"/>;
            case "submit":
                return <Gavel className="w-3.5 h-3.5 mr-1"/>;
            case "reveal":
                return <Eye className="w-3.5 h-3.5 mr-1"/>;
            case "resolved":
                return <CheckCircle2 className="w-3.5 h-3.5 mr-1"/>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
                            <Shield className="w-10 h-10 mr-4 text-indigo-600"/>
                            Verifier Panel
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">
                            Justice and verification protocols for <span
                            className="text-indigo-600 dark:text-indigo-400 font-bold">REP TOKEN</span> ecosystem.
                        </p>
                    </div>
                    <div
                        className="flex items-center space-x-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="text-right px-4">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Network
                                Status</p>
                            <p className="text-sm font-bold text-emerald-500 flex items-center justify-end">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                                Active Verifier
                            </p>
                        </div>
                        <div
                            className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {verifier.name.charAt(0)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Verifier Profile & Financials */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Profile Card */}
                        <div
                            className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <User className="w-24 h-24"/>
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{verifier.name}</h3>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {verifier.skills.map((skill, i) => (
                                    <span key={i}
                                          className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {skill}
                    </span>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Category</p>
                                        <div
                                            className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                            <Layers className="w-4 h-4 mr-2 text-indigo-500"/>
                                            {verifier.categories[0]}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Level</p>
                                        <div
                                            className="flex items-center justify-end text-sm font-black text-indigo-600">
                                            <Trophy className="w-4 h-4 mr-2"/>
                                            Tier {verifier.level}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-3 tracking-widest">Public
                                        Addresses</p>
                                    {Object.entries(verifier.publicAddresses).map(([chain, address]) => (
                                        <div key={chain} className="mb-3">
                                            <p className="text-[10px] font-bold text-slate-500 mb-1 capitalize">{chain}</p>
                                            <div
                                                className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <code
                                                    className="text-[10px] text-slate-600 dark:text-slate-400 truncate w-40">{address}</code>
                                                <ExternalLink className="w-3 h-3 text-slate-400"/>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RP Token Stats */}
                        <div
                            className="bg-slate-900 dark:bg-white rounded-3xl p-8 text-white dark:text-slate-900 shadow-xl relative overflow-hidden">
                            <div className="absolute -right-6 -bottom-6 opacity-10 dark:opacity-5">
                                <Coins className="w-40 h-40"/>
                            </div>

                            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 flex items-center">
                                <Award className="w-4 h-4 mr-2 text-indigo-400 dark:text-indigo-600"/>
                                RP Token Economy
                            </h3>

                            <div className="grid grid-cols-1 gap-6 relative z-10">
                                <div>
                                    <p className="text-3xl font-black mb-1">{Number(verifier.stats.totalStaked).toLocaleString()}
                                        <span className="text-sm font-medium opacity-60">RP</span></p>
                                    <p className="text-[10px] font-bold uppercase text-indigo-400 dark:text-indigo-600">Total
                                        Staked Amount</p>
                                </div>

                                <div
                                    className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10 dark:border-slate-100">
                                    <div>
                                        <p className="text-xl font-black text-amber-400 dark:text-amber-600">{Number(verifier.stats.lockedAmount).toLocaleString()}</p>
                                        <p className="text-[10px] font-bold uppercase opacity-60 flex items-center">
                                            <Lock className="w-3 h-3 mr-1"/> Locked
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-emerald-400 dark:text-emerald-600">+{Number(verifier.stats.totalRewards).toLocaleString()}</p>
                                        <p className="text-[10px] font-bold uppercase opacity-60 flex items-center">
                                            <TrendingUp className="w-3 h-3 mr-1"/> Rewards
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10 dark:border-slate-100 text-center">
                                    <p className="text-4xl font-black text-white dark:text-slate-900">{verifier.stats.totalParticipated}</p>
                                    <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest mt-1">Total
                                        Disputes Resolved</p>
                                </div>
                            </div>
                        </div>

                        {/* Staking & Management Controls */}
                        <div
                            className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                                <LayoutDashboard className="w-5 h-5 mr-2 text-indigo-600"/>
                                Verifier Actions
                            </h3>

                            {/* Stake Input */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Stake RP
                                        Tokens</p>
                                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
                                        <Coins className="w-3 h-3 mr-1"/>
                                        Balance: {Number(ethers.formatEther(verifierData.rptBalance || 0n)).toLocaleString()} RPT
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <input
                                            type="text"
                                            placeholder="Amount in RPT"
                                            value={stakeAmount}
                                            onChange={(e) => setStakeAmount(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <span
                                            className="absolute right-4 top-3.5 text-[10px] font-black text-slate-400">RPT</span>
                                    </div>
                                    <button
                                        onClick={handleStake}
                                        disabled={actionLoading}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center transition-colors"
                                    >
                                        {actionLoading ? <div
                                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> :
                                            <ArrowUpCircle className="w-4 h-4 mr-2"/>}
                                        Stake
                                    </button>
                                </div>
                            </div>

                            {/* Stack Levels Information */}
                            {stackLevels && stackLevels.length > 0 && (
                                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-3">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Verifier
                                        Staking Levels</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {stackLevels.map((level, index) => {
                                            const levelStake = ethers.formatEther(level);
                                            const currentStake = BigInt(verifierData.staked);
                                            
                                            // Calculate if this is the active level using find_upper_bound logic from VerifierSystem.sol
                                            // mid = (low + high + 1) >> 1; if (stack_levels[mid] <= stake_amount) low = mid; else high = mid - 1;
                                            let calculatedLevel = 0;
                                            if (stackLevels.length > 0) {
                                                let low = 0;
                                                let high = stackLevels.length - 1;
                                                while (low < high) {
                                                    let mid = Math.floor((low + high + 1) / 2);
                                                    if (BigInt(stackLevels[mid]) <= currentStake) {
                                                        low = mid;
                                                    } else {
                                                        high = mid - 1;
                                                    }
                                                }
                                                calculatedLevel = low;
                                            }
                                            
                                            const isActive = (index === calculatedLevel);

                                            return (
                                                <div
                                                    key={index}
                                                    className={`p-3 rounded-xl border transition-all ${
                                                        isActive
                                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/20'
                                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                            <span
                                className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                              Tier {index + 1}
                            </span>
                                                        {isActive && (
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500"/>
                                                        )}
                                                    </div>
                                                    <div
                                                        className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                        {Number(levelStake).toLocaleString()} <span
                                                        className="text-[9px] font-medium opacity-60">RPT</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Unstake Button */}
                            <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                                <button
                                    onClick={handleUnstake}
                                    disabled={actionLoading}
                                    className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:bg-slate-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center transition-all"
                                >
                                    {actionLoading ? <div
                                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> :
                                        <ArrowDownCircle className="w-4 h-4 mr-2"/>}
                                    Unstake All Tokens
                                </button>
                                <p className="text-[10px] text-slate-400 mt-3 text-center font-medium">Warning:
                                    Unstaking will set your level to minimum and may affect active disputes.</p>
                            </div>

                            {/* Transfer Address */}
                            <div className="pt-6 border-t border-slate-50 dark:border-slate-800 space-y-3">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Transfer
                                    Verifier Address</p>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <input
                                            type="text"
                                            placeholder="New address (0x...)"
                                            value={transferAddress}
                                            onChange={(e) => setTransferAddress(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <Send className="absolute right-4 top-3.5 w-4 h-4 text-slate-400"/>
                                    </div>
                                    <button
                                        onClick={handleTransfer}
                                        disabled={actionLoading}
                                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:bg-slate-50 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors border border-slate-200 dark:border-slate-700"
                                    >
                                        Transfer
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Assigned Jobs / Disputes */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Filter Tabs */}
                        <div
                            className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-2">
                            {["all", "open", "submit", "reveal", "resolved"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Job List */}
                        <div className="space-y-6">
                            {filteredJobs.length > 0 ? (
                                filteredJobs.map((job) => (
                                    <div key={job.id}
                                         className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-3 mb-3">
                          <span
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(job.status)} flex items-center`}>
                            {getStatusIcon(job.status)}
                              {job.status}
                          </span>
                                                    <span
                                                        className="text-[10px] font-bold text-slate-400 tracking-widest">
                            ID: {job.id}
                          </span>
                                                </div>
                                                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                                                    {job.title}
                                                </h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                                    {job.description}
                                                </p>
                                            </div>
                                            <div
                                                className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0">
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{job.stakedAmount.toLocaleString()} RP</p>
                                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Your
                                                        Stake</p>
                                                </div>
                                                <a
                                                    href={job.link}
                                                    className="flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-xs font-bold transition-colors border border-slate-100 dark:border-slate-800"
                                                >
                                                    Assess Work <ExternalLink className="w-3 h-3 ml-2"/>
                                                </a>
                                            </div>
                                        </div>

                                        <div
                                            className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                                    <Key className="w-3 h-3 mr-1 text-indigo-500"/> Commit Salt
                                                </p>
                                                <code
                                                    className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded select-all">
                                                    {job.salt}
                                                </code>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                                    <Layers className="w-3 h-3 mr-1 text-indigo-500"/> Complexity
                                                </p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{job.verifiers_cnt}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                                    <User className="w-3 h-3 mr-1 text-indigo-500"/> Employer
                                                </p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{job.employer}</p>
                                            </div>
                                            <div className="flex items-end justify-end">
                                                {job.status === "submit" && (
                                                    <button
                                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
                                                        Submit Vote
                                                    </button>
                                                )}
                                                {job.status === "reveal" && (
                                                    <button
                                                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-200 dark:shadow-none transition-all">
                                                        Reveal Vote
                                                    </button>
                                                )}
                                                {job.status === "open" && (
                                                    <button
                                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-none transition-all">
                                                        Commit Stake
                                                    </button>
                                                )}
                                                {job.status === "resolved" && (
                                                    <div
                                                        className="w-full py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center">
                                                        <CheckCircle2 className="w-3 h-3 mr-2"/> Finalized
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div
                                    className="bg-white dark:bg-slate-900 rounded-3xl p-20 border border-slate-100 dark:border-slate-800 text-center">
                                    <div
                                        className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Search className="w-10 h-10 text-slate-300"/>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No disputes
                                        found</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                        There are no active disputes matching this filter. Check back later or explore
                                        other categories.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Verifier Guidelines */}
                        <div
                            className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-900/30">
                            <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center">
                                <Gavel className="w-5 h-5 mr-2"/>
                                Verifier Responsibilities
                            </h4>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-700 dark:text-indigo-400 font-medium">
                                <li className="flex items-start">
                                    <span
                                        className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3 mt-1.5 shrink-0"></span>
                                    Maintain strict confidentiality of the salt until the reveal phase.
                                </li>
                                <li className="flex items-start">
                                    <span
                                        className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3 mt-1.5 shrink-0"></span>
                                    Provide unbiased assessment based on provided evidence and contract terms.
                                </li>
                                <li className="flex items-start">
                                    <span
                                        className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3 mt-1.5 shrink-0"></span>
                                    Submit assessments within the protocol's time limits (usually 48h).
                                </li>
                                <li className="flex items-start">
                                    <span
                                        className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3 mt-1.5 shrink-0"></span>
                                    Staked RP may be slashed for malicious or consistently outlier voting.
                                </li>
                            </ul>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
