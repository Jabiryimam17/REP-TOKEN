"use client";
import React, {useState, useEffect} from "react";
import {
    Shield,
    Plus,
    Settings,
    Layers,
    Server,
    Zap,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Database,
    Cpu,
    Clock
} from "lucide-react";
import {
    get_stack_levels,
    add_stack_level,
    set_up_vrf,
    get_vrf_config,
    get_categories,
    add_category,
    get_slash_bps,
    set_slash_bps,
    get_deadlines,
    update_deadlines
} from "@/services/verifiers.service";
import { ethers } from "ethers";

export default function VerifierAdminPage() {
    const [stackLevels, setStackLevels] = useState([]);
    const [categories, setCategories] = useState([]);
    const [slashBps, setSlashBps] = useState(0);
    const [vrfConfig, setVrfConfig] = useState(null);
    const [deadlines, setDeadlines] = useState({ sub_duration: 0n, rel_duration: 0n });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Form states
    const [newStackAmount, setNewStackAmount] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [newSlashBps, setNewSlashBps] = useState("");
    const [newDeadlines, setNewDeadlines] = useState({ sub_duration: "", rel_duration: "" });
    const [vrfForm, setVrfForm] = useState({
        sub_id: "",
        confs: "3",
        key_hash: "",
        gas_limit: "500000",
        link_token: "",
        vrf_wrapper: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [levels, config, fetchedCategories, fetchedSlashBps, fetchedDeadlines] = await Promise.all([
                get_stack_levels(),
                get_vrf_config(),
                get_categories(),
                get_slash_bps(),
                get_deadlines()
            ]);
            setStackLevels(levels || []);
            setCategories(fetchedCategories || []);
            setSlashBps(Number(fetchedSlashBps));
            if (fetchedDeadlines) {
                setDeadlines(fetchedDeadlines);
                setNewDeadlines({
                    sub_duration: fetchedDeadlines.sub_duration.toString(),
                    rel_duration: fetchedDeadlines.rel_duration.toString()
                });
            }
            if (config) {
                setVrfConfig(config);
                setVrfForm({
                    sub_id: config.sub_id,
                    confs: config.confs,
                    key_hash: config.key_hash,
                    gas_limit: config.gas_limit,
                    link_token: config.link_token,
                    vrf_wrapper: config.vrf_wrapper
                });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStackLevel = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const amountWei = ethers.parseUnits(newStackAmount, 18);
            const success = await add_stack_level(amountWei);
            if (success) {
                alert("Stack level added successfully!");
                setNewStackAmount("");
                fetchData();
            } else {
                alert("Failed to add stack level.");
            }
        } catch (error) {
            console.error("Error adding stack level:", error);
            alert("Error adding stack level: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateVRF = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const success = await set_up_vrf(
                vrfForm.sub_id,
                vrfForm.confs,
                vrfForm.key_hash,
                vrfForm.gas_limit,
                vrfForm.link_token,
                vrfForm.vrf_wrapper
            );
            if (success) {
                alert("VRF configuration updated successfully!");
                fetchData();
            } else {
                alert("Failed to update VRF configuration.");
            }
        } catch (error) {
            console.error("Error updating VRF:", error);
            alert("Error updating VRF: " + error.message);
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
                fetchData();
            } else {
                alert("Failed to add category.");
            }
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Error adding category: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateSlashBps = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const success = await set_slash_bps(newSlashBps);
            if (success) {
                alert("Slash BPS updated successfully!");
                setNewSlashBps("");
                fetchData();
            } else {
                alert("Failed to update slash BPS.");
            }
        } catch (error) {
            console.error("Error updating slash BPS:", error);
            alert("Error updating slash BPS: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateDeadlines = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const success = await update_deadlines(
                newDeadlines.sub_duration,
                newDeadlines.rel_duration
            );
            if (success) {
                alert("Deadlines updated successfully!");
                fetchData();
            } else {
                alert("Failed to update deadlines.");
            }
        } catch (error) {
            console.error("Error updating deadlines:", error);
            alert("Error updating deadlines: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center">
                            <Shield className="w-10 h-10 mr-4 text-indigo-600" />
                            Verifier System Admin
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Manage verifier staking levels and Chainlink VRF configuration.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Protocol Version</span>
                            <p className="text-sm font-black text-slate-900 dark:text-white">v1.2.0-STAKE</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* VRF Configuration Column */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl mr-4">
                                    <Zap className="w-6 h-6 text-amber-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">VRF Setup</h3>
                            </div>

                            <form onSubmit={handleUpdateVRF} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Link Token Address</label>
                                    <input
                                        placeholder="0x..."
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={vrfForm.link_token}
                                        onChange={(e) => setVrfForm({...vrfForm, link_token: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">VRF Wrapper Address</label>
                                    <input
                                        placeholder="0x..."
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={vrfForm.vrf_wrapper}
                                        onChange={(e) => setVrfForm({...vrfForm, vrf_wrapper: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Subscription ID</label>
                                    <input
                                        type="text"
                                        placeholder="1234..."
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={vrfForm.sub_id}
                                        onChange={(e) => setVrfForm({...vrfForm, sub_id: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Key Hash</label>
                                    <input
                                        type="text"
                                        placeholder="0x..."
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                                        value={vrfForm.key_hash}
                                        onChange={(e) => setVrfForm({...vrfForm, key_hash: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Confirmations</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            value={vrfForm.confs}
                                            onChange={(e) => setVrfForm({...vrfForm, confs: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Gas Limit</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            value={vrfForm.gas_limit}
                                            onChange={(e) => setVrfForm({...vrfForm, gas_limit: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center disabled:opacity-50 mt-2"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Settings className="w-5 h-5 mr-2"/>}
                                    Update VRF Configuration
                                </button>
                            </form>
                        </div>

                        {/* Deadlines Configuration */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mr-4">
                                    <Clock className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Deadline Durations</h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Sub: {Number(deadlines.sub_duration)}s | Rel: {Number(deadlines.rel_duration)}s
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateDeadlines} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Submission (s)</label>
                                        <input
                                            type="number"
                                            placeholder="86400"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            value={newDeadlines.sub_duration}
                                            onChange={(e) => setNewDeadlines({...newDeadlines, sub_duration: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Release (s)</label>
                                        <input
                                            type="number"
                                            placeholder="86400"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            value={newDeadlines.rel_duration}
                                            onChange={(e) => setNewDeadlines({...newDeadlines, rel_duration: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center disabled:opacity-50 mt-2"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Settings className="w-5 h-5 mr-2"/>}
                                    Update Deadlines
                                </button>
                            </form>
                        </div>

                        {/* Slash BPS Configuration */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl mr-4">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Slashing Config</h3>
                                    <p className="text-xs text-slate-400 mt-1">Current: {slashBps} BPS ({(slashBps / 100).toFixed(2)}%)</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateSlashBps} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Slash BPS (10000 = 100%)</label>
                                    <input
                                        type="number"
                                        placeholder="2000"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                        value={newSlashBps}
                                        onChange={(e) => setNewSlashBps(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-200 dark:shadow-none flex items-center justify-center disabled:opacity-50 mt-2"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Settings className="w-5 h-5 mr-2"/>}
                                    Set Slash BPS
                                </button>
                            </form>
                        </div>

                        {/* Category Management */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mr-4">
                                    <Layers className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Categories</h3>
                            </div>

                            <div className="space-y-4">
                                <form onSubmit={handleAddCategory} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="New Category Name"
                                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    </button>
                                </form>

                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat, i) => (
                                        <div key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm border border-slate-200 dark:border-slate-700">
                                            {cat}
                                        </div>
                                    ))}
                                    {categories.length === 0 && (
                                        <p className="text-sm text-slate-500 italic">No categories added yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Staking Info Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                            <h4 className="text-lg font-bold mb-4 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                Admin Warning
                            </h4>
                            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                                Stack levels must be added in ascending order. The system uses a lower-bound search to determine verifier levels based on their total staked RPT.
                            </p>
                            <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-indigo-200">Current Levels</span>
                                    <span className="font-bold">{stackLevels.length} Levels</span>
                                </div>
                                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                    <div className="bg-white h-full" style={{width: `${Math.min(stackLevels.length * 20, 100)}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stack Levels Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mr-4">
                                        <Layers className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verifier Stack Levels</h3>
                                        <p className="text-xs text-slate-400 mt-1">Minimum RPT required for each tier.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <form onSubmit={handleAddStackLevel} className="flex gap-2">
                                        <div className="relative">
                                            <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
                                                value={newStackAmount}
                                                onChange={(e) => setNewStackAmount(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={actionLoading}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all flex items-center disabled:opacity-50"
                                        >
                                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                                            Add
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level ID</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Stake Requirement</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="3" className="px-8 py-20 text-center">
                                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4"/>
                                                    <p className="text-slate-500">Loading protocol levels...</p>
                                                </td>
                                            </tr>
                                        ) : stackLevels.length > 0 ? (
                                            stackLevels.map((lvl, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center">
                                                            <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-sm border border-slate-200 dark:border-slate-700">
                                                               {i}
                                                            </span>
                                                            <div className="ml-4">
                                                                <p className="font-bold text-slate-900 dark:text-white">Tier {i === 0 ? "0 (Initial)" : i}</p>
                                                                <p className="text-[10px] text-slate-400 tracking-wider uppercase">Active</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="inline-flex items-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                                                            <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2" />
                                                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg">
                                                                {ethers.formatUnits(lvl, 18)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <p className="font-bold text-slate-900 dark:text-white">RPT Tokens</p>
                                                        <p className="text-[10px] text-slate-400">Reputation Token</p>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-8 py-20 text-center text-slate-500">
                                                    No stack levels configured. Add the first one above.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Activity Mock */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-600" />
                                Protocol Health
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3 animate-pulse"></div>
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">VRF Connection</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Stable</span>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3"></div>
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Registry Sync</span>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Synced</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
