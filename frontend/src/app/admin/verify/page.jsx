"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  User, 
  Briefcase, 
  Scale, 
  Eye, 
  Check, 
  X, 
  ExternalLink, 
  Search,
  Filter,
  Maximize2,
  Lock,
  ArrowRight,
  ChevronRight,
  AlertCircle
} from "lucide-react";

export default function AdminVerifyPage() {
  // Mock data for people in line for verification
  const [pendingUsers, setPendingUsers] = useState([
    {
      id: "REQ-001",
      name: "Satoshi Nakamoto",
      role: "freelancer",
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      idType: "Passport",
      uploadedAt: "2 hours ago",
      idImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800",
      profileLink: "/freelancers/profile/satoshi"
    },
    {
      id: "REQ-002",
      name: "Vitalik Buterin",
      role: "verifier",
      address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      idType: "National ID",
      uploadedAt: "5 hours ago",
      idImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800",
      profileLink: "/verifier"
    },
    {
      id: "REQ-003",
      name: "Nexus Finance Group",
      role: "employer",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      idType: "Business License",
      uploadedAt: "1 day ago",
      idImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
      profileLink: "/employer"
    },
    {
      id: "REQ-004",
      name: "Alice Johnson",
      role: "freelancer",
      address: "0xAbC123...789XYZ",
      idType: "National ID",
      uploadedAt: "3 days ago",
      idImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800",
      profileLink: "/freelancers/profile/alice"
    }
  ]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleApprove = (id) => {
    setPendingUsers(pendingUsers.filter(user => user.id !== id));
    alert("User approved and verified successfully.");
  };

  const handleReject = (id) => {
    setPendingUsers(pendingUsers.filter(user => user.id !== id));
    alert("Verification request rejected.");
  };

  const openIdPreview = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "freelancer":
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase flex items-center w-fit"><Briefcase className="w-3 h-3 mr-1" /> Freelancer</span>;
      case "employer":
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase flex items-center w-fit"><User className="w-3 h-3 mr-1" /> Employer</span>;
      case "verifier":
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase flex items-center w-fit"><Scale className="w-3 h-3 mr-1" /> Verifier</span>;
      default:
        return null;
    }
  };

  const filteredUsers = pendingUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <nav className="flex mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="hover:text-indigo-600 transition-colors cursor-pointer">Admin Panel</span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-slate-900 dark:text-white font-bold">Identity Verification</span>
            </nav>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center">
              <ShieldCheck className="w-8 h-8 mr-3 text-indigo-600" />
              Verification Queue
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Review and approve national IDs/passports for new platform participants.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by name or address..."
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Requests</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{pendingUsers.length}</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Response Time</p>
            <h3 className="text-2xl font-black text-indigo-600">4.2 hours</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Verified Today</p>
            <h3 className="text-2xl font-black text-emerald-600">24 Users</h3>
          </div>
        </div>

        {/* Verification List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Public Address</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Document</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold mr-4 shadow-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Applied {user.uploadedAt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center space-x-2 group">
                          <code className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                            {user.address.slice(0, 6)}...{user.address.slice(-4)}
                          </code>
                          <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <button 
                          onClick={() => openIdPreview(user)}
                          className="flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors group"
                        >
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          {user.idType}
                        </button>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <a 
                            href={user.profileLink}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="View Profile"
                          >
                            <User className="w-5 h-5" />
                          </a>
                          <button 
                            onClick={() => handleReject(user.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="Reject"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleApprove(user.id)}
                            className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md shadow-emerald-200 dark:shadow-none"
                            title="Approve"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">No pending verification requests found.</p>
                        <p className="text-sm text-slate-400">Check back later or try a different search query.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Showing {filteredUsers.length} of {pendingUsers.length} requests</p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-50" disabled>Next</button>
            </div>
          </div>
        </div>

        {/* Security Guidelines */}
        <div className="mt-12 bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/30 flex flex-col md:flex-row items-center gap-8">
          <div className="p-4 bg-indigo-600 rounded-2xl text-white">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-2">Verification Security Protocol</h4>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed max-w-3xl">
              As an administrator, you are handling sensitive personal data. Ensure you cross-reference the photo ID with the user's claimed identity. Verify that the public address matches the signature provided during registration. All actions in this panel are logged for governance auditing.
            </p>
          </div>
          <button className="whitespace-nowrap flex items-center px-6 py-3 bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all">
            Full Policy <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      {/* ID Preview Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-indigo-600 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-4">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                    <p className="text-sm text-slate-500">{selectedUser.idType} Verification</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Public Address</label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-400 break-all leading-relaxed">
                      {selectedUser.address}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Role</label>
                      <div className="font-bold text-slate-700 dark:text-slate-300 capitalize">{selectedUser.role}</div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Uploaded</label>
                      <div className="font-bold text-slate-700 dark:text-slate-300">{selectedUser.uploadedAt}</div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                    <button 
                      onClick={() => { handleApprove(selectedUser.id); setIsModalOpen(false); }}
                      className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 mr-2" /> Approve ID
                    </button>
                    <button 
                      onClick={() => { handleReject(selectedUser.id); setIsModalOpen(false); }}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all flex items-center justify-center"
                    >
                      <X className="w-5 h-5 mr-2" /> Reject
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 flex flex-col p-8 items-center justify-center relative">
                <div className="absolute top-4 left-4 flex space-x-2">
                  <div className="px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest">Document Preview</div>
                </div>
                
                <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-slate-700 relative group">
                  {selectedUser.idImage ? (
                    <img 
                      src={selectedUser.idImage} 
                      alt="National ID" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-400">
                      <FileText className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                  <button className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-xl text-slate-900 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="mt-4 text-xs text-slate-500 font-medium flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> Inspect for tempering or photo manipulation
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
