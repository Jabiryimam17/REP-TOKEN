"use client";

import React, {useState, useEffect} from "react";
import {
    Settings,
    Plus,
    Percent,
    Layers,
    Clock,
    Shield,
    Wallet,
    TrendingUp,
    ChevronRight,
    AlertCircle,
    Check,
    Loader2,
    Tag
} from "lucide-react";
import {
    append_level,
    set_client_fee_portion,
    get_levels_count,
    get_level,
    get_client_fee_portion,
    get_post_configs
} from "@/services/jobs.service";
import { add_category } from "@/services/verifiers.service";
import { ethers } from "ethers";

export default function JobSystemAdminPage() {
    const [levels, setLevels] = useState([]);
    const [categories, setCategories] = useState([]);
    const [clientFee, setClientFee] = useState(0);
    const [vrfWrapperAddress, setVrfWrapperAddress] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Form states
    const [newLevel, setNewLevel] = useState({
        verifiers_cnt: "",
        freelancer_stake: "",
        client_stake: "",
        max_amount: "",
        payment_duration: ""
    });
    const [newFee, setNewFee] = useState("");
    const [newCategory, setNewCategory] = useState("");

    useEffect(() => {
        fetchSystemData();
    }, []);

    const fetchSystemData = async () => {
        try {
            setLoading(true);
            const { levels: fetchedLevels, client_fee_portion: fee, categories: fetchedCategories, vrf_wrapper_address } = await get_post_configs();
            setClientFee(Number(fee));
            setVrfWrapperAddress(vrf_wrapper_address);
            setLevels(fetchedLevels.map((lvl, i) => ({
                id: i,
                max_amount: ethers.formatUnits(lvl.max_amount, 18),
                client_stake: ethers.formatUnits(lvl.client_stake, 18),
                freelancer_stake: ethers.formatUnits(lvl.freelancer_stake, 18),
                verifiers_cnt: lvl.verifiers_cnt.toString(),
                payment_duration: lvl.payment_duration.toString()
            })));
            setCategories(fetchedCategories);
        } catch (error) {
            console.error("Error fetching system data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLevel = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const success = await append_level({
                verifiers_cnt: newLevel.verifiers_cnt,
                freelancer_stake: ethers.parseUnits(newLevel.freelancer_stake, 18),
                client_stake: ethers.parseUnits(newLevel.client_stake, 18),
                max_amount: ethers.parseUnits(newLevel.max_amount, 18),
                payment_duration: newLevel.payment_duration
            });

            if (success) {
                alert("Level added successfully!");
                setNewLevel({
                    verifiers_cnt: "",
                    freelancer_stake: "",
                    client_stake: "",
                    max_amount: "",
                    payment_duration: ""
                });
                fetchSystemData();
            } else {
                alert("Failed to add level. Check console for details.");
            }
        } catch (error) {
            console.error("Error adding level:", error);
            alert("Error adding level: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateFee = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const success = await set_client_fee_portion(newFee);
            if (success) {
                alert("Client fee portion updated successfully!");
                setNewFee("");
                fetchSystemData();
            } else {
                alert("Failed to update fee. Check console for details.");
            }
        } catch (error) {
            console.error("Error updating fee:", error);
            alert("Error updating fee: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const success = await add_category(newCategory);
            if (success) {
                alert("Category added successfully!");
                setNewCategory("");
                fetchSystemData();
            } else {
                alert("Failed to add category. Check console for details.");
            }
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Error adding category: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <nav className="flex mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <span className="hover:text-indigo-600 transition-colors cursor-pointer">Admin Panel</span>
                        <ChevronRight className="w-4 h-4 mx-2"/>
                        <span className="text-slate-900 dark:text-white font-bold">Job System Management</span>
                    </nav>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center">
                        <Settings className="w-8 h-8 mr-3 text-indigo-600"/>
                        System Configuration
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Configure platform fees and work levels for the Job Paying System.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Forms */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Fee Configuration */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center mb-6">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl mr-4">
                                    <Percent className="w-5 h-5 text-indigo-600"/>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Client Fee</h3>
                            </div>
                            
                            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Fee</p>
                                <p className="text-2xl font-black text-indigo-600">{clientFee} BPS <span className="text-sm font-normal text-slate-400">({clientFee/100}%)</span></p>
                            </div>

                            <form onSubmit={handleUpdateFee} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">New Fee (BPS)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 200 for 2%"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={newFee}
                                        onChange={(e) => setNewFee(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Check className="w-5 h-5 mr-2"/>}
                                    Update Fee
                                </button>
                            </form>
                        </div>

                        {/* Category Configuration */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center mb-6">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl mr-4">
                                    <Tag className="w-5 h-5 text-indigo-600"/>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Job Categories</h3>
                            </div>
                            
                            <div className="mb-6 flex flex-wrap gap-2">
                                {categories.length > 0 ? categories.map((cat, i) => (
                                    <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500">
                                        {cat}
                                    </span>
                                )) : <p className="text-xs text-slate-400 italic">No categories found</p>}
                            </div>

                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">New Category Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Web Development"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Plus className="w-5 h-5 mr-2"/>}
                                    Add Category
                                </button>
                            </form>
                        </div>

                        {/* VRF Configuration */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center mb-6">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl mr-4">
                                    <Shield className="w-5 h-5 text-amber-600"/>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">VRF Configuration</h3>
                            </div>
                            
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">VRF Wrapper Address</p>
                                <p className="text-sm font-mono text-slate-600 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 mt-2">
                                    {vrfWrapperAddress || "Not configured"}
                                </p>
                            </div>
                        </div>

                        {/* Add Level Form */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center mb-6">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl mr-4">
                                    <Plus className="w-5 h-5 text-emerald-600"/>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Work Level</h3>
                            </div>

                            <form onSubmit={handleAddLevel} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Max Amount</label>
                                        <div className="relative">
                                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                            <input
                                                type="number"
                                                placeholder="Max job value"
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                value={newLevel.max_amount}
                                                onChange={(e) => setNewLevel({...newLevel, max_amount: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Client Stake</label>
                                            <input
                                                type="number"
                                                placeholder="RPT amount"
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                value={newLevel.client_stake}
                                                onChange={(e) => setNewLevel({...newLevel, client_stake: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Freelancer Stake</label>
                                            <input
                                                type="number"
                                                placeholder="RPT amount"
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                value={newLevel.freelancer_stake}
                                                onChange={(e) => setNewLevel({...newLevel, freelancer_stake: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Min Verifiers Portion</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                            <input
                                                type="number"
                                                placeholder="e.g. 500 for 50%"
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                value={newLevel.verifiers_cnt}
                                                onChange={(e) => setNewLevel({...newLevel, verifiers_cnt: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Payment Duration (Seconds)</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                            <input
                                                type="number"
                                                placeholder="e.g. 259200 for 3 days"
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                value={newLevel.payment_duration}
                                                onChange={(e) => setNewLevel({...newLevel, payment_duration: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center disabled:opacity-50 mt-4"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Plus className="w-5 h-5 mr-2"/>}
                                    Append New Level
                                </button>
                                <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center">
                                    <AlertCircle className="w-3 h-3 mr-1"/> Sorting order (Max Amount) must be respected.
                                </p>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Level List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl mr-4">
                                        <Layers className="w-5 h-5 text-indigo-600"/>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Work Levels</h3>
                                </div>
                                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500">
                                    {levels.length} Total Levels
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Amount</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stakes (C/F)</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verifiers</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-20 text-center">
                                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4"/>
                                                    <p className="text-slate-500">Loading system levels...</p>
                                                </td>
                                            </tr>
                                        ) : levels.length > 0 ? (
                                            levels.map((level) => (
                                                <tr key={level.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                    <td className="px-6 py-6">
                                                        <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                            {level.id}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <p className="font-bold text-slate-900 dark:text-white">{level.max_amount} Tokens</p>
                                                        <p className="text-[10px] text-slate-400">Stable Coin</p>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-emerald-600 font-bold">{level.client_stake} RPT</span>
                                                            <span className="text-slate-300">/</span>
                                                            <span className="text-amber-600 font-bold">{level.freelancer_stake} RPT</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400">Client / Freelancer Stake</p>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <p className="font-bold text-slate-700 dark:text-slate-300">{level.verifiers_cnt} BPS</p>
                                                        <p className="text-[10px] text-slate-400">Min. Approval</p>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <p className="font-bold text-slate-700 dark:text-slate-300">{level.payment_duration}</p>
                                                        <p className="text-[10px] text-slate-400">Seconds</p>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-20 text-center">
                                                    <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4"/>
                                                    <p className="text-slate-500">No work levels configured yet.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/30">
                            <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2"/> Protocol Insight
                            </h4>
                            <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
                                Work levels determine the stakes and security parameters for jobs based on their value. 
                                When a level is appended, it must have a <b>Max Amount</b> higher than the previous level to maintain 
                                proper sorting for the system's level calculation algorithm. Fees are defined in Basis Points (BPS), where 100 BPS = 1%.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
