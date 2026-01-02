"use client";

import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Shield, 
  Briefcase, 
  Upload, 
  Key, 
  ChevronRight, 
  CheckCircle2, 
  Image as ImageIcon,
  Wallet,
  ArrowRight,
  Info,
  Globe,
  Lock,
  Zap,
  Github,
  Twitter
} from "lucide-react";

export default function RegisterPage() {
  const [role, setRole] = useState("freelancer");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    publicAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", // Mock address
    signature: "",
    bio: "",
    skills: ""
  });

  const roles = [
    { 
      id: "freelancer", 
      title: "Freelancer", 
      icon: Briefcase, 
      desc: "Work on projects and earn stablecoins based on your skills.",
      color: "bg-indigo-500"
    },
    { 
      id: "employer", 
      title: "Employer", 
      icon: User, 
      desc: "Post jobs, hire talent, and manage your decentralized team.",
      color: "bg-emerald-500"
    },
    { 
      id: "verifier", 
      title: "Verifier", 
      icon: Shield, 
      desc: "Govern the community and resolve disputes fairly.",
      color: "bg-amber-500"
    }
  ];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Registered:", { ...formData, role });
    alert("Registration successful! Welcome to REP TOKEN.");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-4">
            Join the Decentralized Future
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Create Your Account</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">Join the world's most trusted decentralized freelance network.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-indigo-100/20 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
          
          {/* Sidebar Info */}
          <div className="md:w-1/3 bg-indigo-600 p-10 text-white relative flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-400 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="bg-white/20 p-3 rounded-2xl w-fit mb-6 backdrop-blur-sm border border-white/10">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Why REP TOKEN?</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 mr-3 mt-1 text-indigo-300" />
                  <p className="text-sm text-indigo-100">Immutable reputation scores earned through verified work.</p>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 mr-3 mt-1 text-indigo-300" />
                  <p className="text-sm text-indigo-100">Zero-commission payments using stablecoins.</p>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 mr-3 mt-1 text-indigo-300" />
                  <p className="text-sm text-indigo-100">Community-governed dispute resolution system.</p>
                </li>
              </ul>
            </div>

            <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
              <p className="text-xs text-indigo-200 font-medium uppercase tracking-widest mb-4">Step {step} of 3</p>
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? "bg-white w-8" : "bg-white/20 w-4"}`}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-8 md:p-12">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              
              {/* Step 1: Role Selection */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Choose your path</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Select the role that best describes you.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {roles.map((r) => {
                      const Icon = r.icon;
                      const isSelected = role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`flex items-start p-5 rounded-3xl border-2 text-left transition-all ${
                            isSelected 
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 ring-4 ring-indigo-50 dark:ring-indigo-900/10" 
                            : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                          }`}
                        >
                          <div className={`p-3 rounded-2xl mr-4 ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className={`font-bold ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`}>
                              {r.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {r.desc}
                            </p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Personal Info */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Profile Information</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tell us a bit about yourself.</p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/50 transition-colors cursor-pointer group">
                    <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm mb-4 border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Upload Profile Picture</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="email" 
                        placeholder="Email Address"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                      />
                    </div>
                    <textarea 
                      rows={3}
                      placeholder="Brief Bio (Professional headline, experience...)"
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Step 3: Blockchain Verification */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Verify Ownership</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Connect your wallet and sign the message to proceed.</p>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10">
                      <Wallet className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Connected Address</p>
                      <code className="text-sm font-mono text-indigo-300 break-all">{formData.publicAddress}</code>
                      <div className="flex items-center mt-4 text-xs text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Wallet Linked Successfully
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-3xl">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">Signature Required</p>
                        <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                          By signing, you prove ownership of this wallet. This action does not cost any gas and will not trigger a transaction.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="button"
                      className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center group"
                    >
                      <Key className="w-4 h-4 mr-2 text-indigo-600 group-hover:rotate-12 transition-transform" />
                      Sign Verification Message
                    </button>
                    
                    <div className="flex items-center gap-4">
                      <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Link Socials</span>
                      <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" className="flex items-center justify-center p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Github className="w-5 h-5 mr-2" />
                        <span className="text-xs font-bold">GitHub</span>
                      </button>
                      <button type="button" className="flex items-center justify-center p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Twitter className="w-5 h-5 mr-2" />
                        <span className="text-xs font-bold">Twitter</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-auto pt-10 flex items-center justify-between gap-4">
                {step > 1 && (
                  <button 
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-4 px-6 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    Back
                  </button>
                )}
                
                {step < 3 ? (
                  <button 
                    type="button"
                    onClick={handleNext}
                    className="flex-[2] py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center group"
                  >
                    Next Step
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button 
                    type="submit"
                    className="flex-[2] py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center group"
                  >
                    Complete Registration
                    <Zap className="ml-2 w-4 h-4 fill-white animate-pulse" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account? <a href="/login" className="text-indigo-600 font-bold hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}
