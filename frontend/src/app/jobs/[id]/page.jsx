"use client";
//TODO: update state when freelancer is hired and match posted to published date on backend
import React, {useState, useEffect} from "react";
import {useParams} from "next/navigation";
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
    Info,
    Link as LinkIcon
} from "lucide-react";
import {get_job_blockchain, get_job_api, get_job_bids, post_bid_api, hire} from "@/services/jobs.service";
import connect_wallet from "@/services/connect_wallet.service";
import {ethers} from "ethers";

const normalizeList = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
        } catch (_) {
            // continue
        }
        return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
};

export default function JobPage() {
    const {id} = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bids, setBids] = useState([]);

    // Bid form state
    const [bidAmount, setBidAmount] = useState("");
    const [finishingDays, setFinishingDays] = useState("");
    const [coverLetter, setCoverLetter] = useState("");
    const [profileLinks, setProfileLinks] = useState("");
    const [freelancerAddress, setFreelancerAddress] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [selectedBid, setSelectedBid] = useState(null);
    const [showBidModal, setShowBidModal] = useState(false);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [blockchainData, apiData] = await Promise.all([
                get_job_blockchain(id),
                get_job_api(id)
            ]);

            if (apiData) {
                const normalizedTopics = normalizeList(apiData.topics);
                const normalizedSkills = normalizeList(apiData.skills);
                setJob({
                    ...apiData,
                    topics: normalizedTopics,
                    skills: normalizedSkills,
                    blockchain: blockchainData,
                    amount: ethers.formatUnits(apiData.amount || 0, 18),
                    // Mock employer for now as it's not in the requirements to fetch it from backend specifically
                    employer: {
                        name: apiData.employer_name || "Employer",
                        profileLink: "#",
                        contact: apiData.employer_email || "contact@employer.com",
                        previousRelation: "No previous collaboration.",
                        rating: 5.0,
                        totalSpent: "0",
                        verified: true
                    }
                });
                setBidAmount(blockchainData?.amount ? ethers.formatUnits(blockchainData.amount, 18) : (apiData.amount ? ethers.formatUnits(apiData.amount, 18) : ""));

                const normalizedBids = (apiData.bids || []).map((b) => ({
                    ...b,
                    amount: ethers.formatUnits(b.amount || 0, 18),
                    profile_links: normalizeList(b.profile_links),
                }));
                setBids(normalizedBids);
            }
        } catch (error) {
            console.error("Error fetching job data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleHire = async (freelancerAddress) => {
        if (!confirm("Are you sure you want to hire this freelancer?")) return;
        try {
            const success = await hire(id, freelancerAddress);
            if (success) {
                alert("Freelancer hired successfully!");
                fetchData();
            } else {
                alert("Failed to hire freelancer.");
            }
        } catch (error) {
            console.error("Error hiring:", error);
            alert("Error hiring freelancer.");
        }
    };

    const handlePostProposal = async () => {
        if (!bidAmount || !finishingDays || !coverLetter || !freelancerAddress) {
            alert("Please fill in all required fields, including your wallet address.");
            return;
        }

        setSubmitting(true);
        try {
            // Address validation
            if (!ethers.isAddress(freelancerAddress)) {
                alert("Invalid wallet address format.");
                setSubmitting(false);
                return;
            }

            // Signing step to prevent mistakes
            const { signer } = await connect_wallet();
            const signerAddress = await signer.getAddress();

            if (signerAddress.toLowerCase() !== freelancerAddress.toLowerCase()) {
                alert(`The connected wallet (${signerAddress}) does not match the input address (${freelancerAddress}). Please use the correct wallet or update the address.`);
                setSubmitting(false);
                return;
            }

            const message = `I am submitting a bid for job ID: ${id}\nAmount: ${bidAmount} USDC\nFinishing Days: ${finishingDays}\nWallet: ${freelancerAddress}`;
            await signer.signMessage(message);

            const bidData = {
                id: id,
                amount: ethers.parseUnits(bidAmount, 18).toString(),
                finishing_days: finishingDays,
                cover_letter: coverLetter,
                profile_links: normalizeList(profileLinks),
                freelancer_address: freelancerAddress,
                duration: job?.blockchain?.max_duration || 0 // using max_duration
            };

            const success = await post_bid_api(bidData);
            if (success) {
                alert("Bid posted successfully!");
                // Refresh data
                fetchData();
            } else {
                alert("Error posting bid. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting bid:", error);
            alert("An error occurred while submitting your bid.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950/50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950/50">
                <div className="text-xl font-bold text-slate-900 dark:text-white">Job not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">

                {/* Breadcrumbs */}
                <nav className="flex mb-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <a href="/" className="hover:text-indigo-600 transition-colors">Marketplace</a>
                    <ChevronRight className="w-4 h-4 mx-2"/>
                    <a href="#" className="hover:text-indigo-600 transition-colors">{job.category}</a>
                    <ChevronRight className="w-4 h-4 mx-2"/>
                    <span className="text-slate-900 dark:text-white truncate">{job.title}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Job Header & Title */}
                        <div
                            className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                    className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  {job.category}
                </span>
                                <span
                                    className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  Fixed Price
                </span>
                                <span className="text-slate-400 dark:text-slate-500 text-xs ml-auto">
                  ID: {job.id}
                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                                {job.title}
                            </h1>

                            <div
                                className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-50 dark:border-slate-800">
                                <div className="flex items-center">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
                                        <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Budget</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{job.blockchain?.amount ? ethers.formatUnits(job.blockchain.amount, 18) : ethers.formatUnits(job.amount || 0, 18)} USDC</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
                                        <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Level</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{job.blockchain?.verifiers_cnt ? `Level (Verifiers: ${job.blockchain.verifiers_cnt})` : "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
                                        <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Duration</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{job.blockchain?.max_duration ? (parseInt(job.blockchain.max_duration) / 86400).toFixed(1) : "N/A"} Days</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
                                        <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Posted</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{job.created_at ? new Date(job.created_at).toLocaleDateString() : "Recently"}</p>
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
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Topics
                                    Covered</h3>
                                <div className="flex flex-wrap gap-2">
                                    {normalizeList(job.topics).map((topic, i) => (
                                        <div key={`${topic}-${i}`}
                                             className="flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300">
                                            <Tag className="w-3.5 h-3.5 mr-2 text-indigo-500"/>
                                            {topic}
                                        </div>
                                    ))}

                                </div>
                            </div>
                        </div>

                        {/* Skills Section */}
                        <div
                            className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <Code className="w-5 h-5 mr-2 text-indigo-600"/>
                                Required Skills
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {normalizeList(job.skills).map((skill, i) => (
                                    <span
                                        key={`${skill}-${i}`}
                                        className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-2xl text-sm font-semibold"
                                    >
                                        {skill}
                                    </span>
                                ))}

                            </div>
                        </div>

                        {/* Bid List Section */}
                        <div
                            className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                                    <History className="w-5 h-5 mr-2 text-indigo-600"/>
                                    Recent Bids ({bids.length})
                                </h3>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    Average Bid: <span className="font-bold text-indigo-600">
                    {bids.length > 0
                        ? (bids.reduce((acc, curr) => acc + parseFloat(curr.amount), 0) / bids.length).toFixed(2)
                        : 0} USDC
                  </span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {bids.map((bid, idx) => (
                                    <div key={bid.id || idx}
                                         className="group p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">
                                        <div
                                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center">
                                                <div
                                                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mr-4 shadow-sm">
                                                    {(bid.username || "F").charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center">
                                                        <h4 className="font-bold text-slate-900 dark:text-white mr-2 group-hover:text-indigo-600 transition-colors cursor-pointer">{bid.username || "Freelancer"}</h4>
                                                        <div
                                                            className="flex items-center bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                            <Star
                                                                className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-1"/>
                                                            5.0
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reputation: <span
                                                        className="text-indigo-500">95/100</span></p>
                                                </div>
                                            </div>
                                            <div
                                                className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center">
                                                <p className="text-xl font-bold text-slate-900 dark:text-white">{bid.amount} USDC</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Delivery
                                                    in {bid.finishing_days} days</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                            "{bid.cover_letter}"
                                        </p>
                                        {bid.profile_links && bid.profile_links.length > 0 && (
                                            <div className="mb-4 flex flex-wrap gap-2">
                                                <span
                                                    className="text-xs font-bold text-slate-400 uppercase mr-1">Links:</span>
                                                {bid.profile_links.map((link, idx) => {
                                                    const safe = (link || "").trim();
                                                    if (!safe) return null;
                                                    const url = safe.startsWith("http") ? safe : `https://${safe}`;
                                                    return (
                                                        <a key={`${safe}-${idx}`}
                                                           href={url}
                                                           target="_blank" rel="noopener noreferrer"
                                                           className="text-xs text-indigo-600 hover:underline flex items-center">
                                                            <LinkIcon className="w-3 h-3 mr-1"/> {safe}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div
                                            className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                            <span>Submitted {new Date(bid.created_at).toLocaleDateString()}</span>
                                            <button
                                                onClick={() => {
                                                    setSelectedBid(bid);
                                                    setShowBidModal(true);
                                                }}
                                                className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View
                                                Proposal
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {bids.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">No bids yet. Be the first to
                                        bid!</div>
                                )}
                            </div>

                            {bids.length > 5 && (
                                <button
                                    className="w-full mt-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center">
                                    Show All Bids
                                    <ArrowRight className="w-4 h-4 ml-2"/>
                                </button>
                            )}
                        </div>

                        {/* Bid Details Modal */}
                        {showBidModal && selectedBid && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                                <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mr-4 shadow-lg">
                                                    {(selectedBid.freelancer_name || selectedBid.username || "F").charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                        {selectedBid.freelancer_name || selectedBid.username || "Freelancer"}
                                                    </h3>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                                                        {selectedBid.freelancer_email || selectedBid.email || "freelancer@example.com"}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setShowBidModal(false)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                            >
                                                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Proposed Budget</p>
                                                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{selectedBid.amount} USDC</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Delivery Time</p>
                                                <p className="text-xl font-black text-slate-900 dark:text-white">{selectedBid.finishing_days} Days</p>
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Cover Letter</h4>
                                            <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                                "{selectedBid.cover_letter}"
                                            </div>
                                        </div>

                                        {selectedBid.profile_links && selectedBid.profile_links.length > 0 && (
                                            <div className="mb-8">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Professional Links</h4>
                                                <div className="flex flex-wrap gap-3">
                                                    {selectedBid.profile_links.map((link, idx) => {
                                                        const safe = (link || "").trim();
                                                        if (!safe) return null;
                                                        const url = safe.startsWith("http") ? safe : `https://${safe}`;
                                                        return (
                                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" 
                                                               className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-indigo-600 hover:border-indigo-300 transition-all">
                                                                <LinkIcon className="w-4 h-4 mr-2" />
                                                                {safe}
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                            <div className="flex items-start">
                                                <Info className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-1">Freelancer Address</p>
                                                    <p className="text-xs font-mono text-amber-700 dark:text-amber-500 break-all">{selectedBid.freelancer_address || "Address not available"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setShowBidModal(false)}
                                                className="flex-1 py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                            >
                                                Close
                                            </button>
                                            <button 
                                                disabled={!selectedBid.freelancer_address}
                                                onClick={() => {
                                                    handleHire(selectedBid.freelancer_address);
                                                    setShowBidModal(false);
                                                }}
                                                className="flex-1 py-4 px-6 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Hire Freelancer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-1 space-y-8">

                        {/* Bid Submission Card */}
                        <div
                            className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-indigo-100/20 dark:shadow-none border border-indigo-100 dark:border-indigo-900/50 sticky top-24">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Submit Your Bid</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Your
                                        Proposed Budget</label>
                                    <div className="relative">
                                        <span
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            className="w-full pl-8 pr-16 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                                        />
                                        <span
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">USDC</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estimated
                                        Delivery</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={finishingDays}
                                            onChange={(e) => setFinishingDays(e.target.value)}
                                            placeholder="e.g. 30"
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                                        />
                                        <span
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Days</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Profile
                                        Links</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={profileLinks}
                                            onChange={(e) => setProfileLinks(e.target.value)}
                                            placeholder="Portfolio, GitHub, LinkedIn..."
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Proposal
                                        Overview</label>
                                    <textarea
                                        rows={4}
                                        value={coverLetter}
                                        onChange={(e) => setCoverLetter(e.target.value)}
                                        placeholder="Describe how you will solve this problem..."
                                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Your Wallet Address (for payment)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={freelancerAddress}
                                            onChange={(e) => setFreelancerAddress(e.target.value)}
                                            placeholder="0x..."
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Must match your connected wallet. You will be asked to sign a message.</p>
                                </div>

                                <div
                                    className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                    <div className="flex items-start">
                                        <ShieldCheck className="w-5 h-5 text-indigo-600 mr-3 mt-0.5"/>
                                        <div>
                                            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-tight mb-1">Secure
                                                Payment</p>
                                            <p className="text-[11px] text-indigo-700 dark:text-indigo-400 leading-snug">
                                                Funds will be locked in an escrow smart contract and released upon
                                                milestone completion.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePostProposal}
                                    disabled={submitting}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center group disabled:bg-indigo-400"
                                >
                                    {submitting ? "Submitting..." : "Post Proposal"}
                                    {!submitting && <Send
                                        className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>}
                                </button>
                            </div>
                        </div>

                        {/* Employer Card */}
                        <div
                            className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <User className="w-5 h-5 mr-2 text-indigo-600"/>
                                About Employer
                            </h3>

                            <div className="flex items-center mb-6">
                                <div
                                    className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold text-2xl mr-4">
                                    {job.employer.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center">
                                        {job.employer.name}
                                        {job.employer.verified &&
                                            <ShieldCheck className="w-4 h-4 text-blue-500 ml-1.5"/>}
                                    </h4>
                                    <div className="flex items-center text-sm">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1"/>
                                        <span
                                            className="font-bold text-slate-700 dark:text-slate-300">{job.employer.rating}</span>
                                        <span className="mx-2 text-slate-300">•</span>
                                        <span
                                            className="text-slate-500 dark:text-slate-400">{job.employer.totalSpent} spent</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <a href={job.employer.profileLink}
                                   className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                    View full profile <ExternalLink className="w-3.5 h-3.5 ml-1.5"/>
                                </a>
                                <a href={`mailto:${job.employer.contact}`}
                                   className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                    Contact employer <MessageSquare className="w-3.5 h-3.5 ml-1.5"/>
                                </a>
                            </div>

                            <div
                                className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-start mb-2">
                                    <Info className="w-4 h-4 text-slate-400 mr-2 mt-0.5"/>
                                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Previous
                                        Relation</p>
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
