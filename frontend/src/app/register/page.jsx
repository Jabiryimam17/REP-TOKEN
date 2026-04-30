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
import axios from "axios";
import { useRouter } from "next/navigation";
import sign_message from "@/services/sign_message.service"
import connect_wallet from "@/services/connect_wallet.service"
import send_profile from "@/features/signup/send_profile"
import { useApp } from "@/context/AppContext";

export default function RegisterPage() {
  const router = useRouter();
  const { wallet_address, set_wallet_address } = useApp();
  const [role, set_role] = useState("freelancer");
  const [step, set_step] = useState(1);
  const [user, set_user] = useState({
    f_name: "",
    l_name: "",
    email: "",
    password: "",
    nonce: "",
    hash: "",
    signature: "",
    role: "freelancer",
    profile_picture: null,
    description:""
  });
  
  const [profile_preview, set_profile_preview] = useState(null);
  const [is_loading, set_is_loading] = useState(false);

  const handle_image_change = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      set_user({ ...user, profile_picture: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        set_profile_preview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };


  const handle_connect_wallet = async () => {
    set_is_loading(true);
    try {
      const { signer } = await connect_wallet();
      const addr = await signer.getAddress();
      set_wallet_address(addr);
    } catch (error) {
      console.error("Connection failed", error);
      if (error.message.includes("MetaMask not installed")) {
        alert("Please install MetaMask to proceed.");
      } else {
        alert(error.message || "Failed to connect wallet");
      }
    } finally {
      set_is_loading(false);
    }
  };

  const handle_message_request = async () => {
    try {
      const response = await axios.get("http://localhost:3333/api/auth/nonce");
      set_user({ ...user, nonce: response.data.nonce });
    } catch (error) {
      console.error("Failed to fetch nonce", error);
    }
  }
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

  const handle_next = async () => {
    if (step === 2) {
      // Email validation
      const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email_regex.test(user.email)) {
        alert("Please enter a valid email address.");
        return;
      }

      // Password validation: 6 characters with mixed alphabets (at least one uppercase and one lowercase)
      // Actually "6 figure password with mixed alphabet" might mean exactly 6 or at least 6.
      // And "mixed alphabet" usually means upper and lower.
      const has_upper = /[A-Z]/.test(user.password);
      const has_lower = /[a-z]/.test(user.password);
      
      if (user.password.length !== 6) {
        alert("Password must be exactly 6 characters long.");
        return;
      }
      
      if (!has_upper || !has_lower) {
        alert("Password must contain mixed alphabet (both uppercase and lowercase).");
        return;
      }
    }
    if (step === 3) {
      if (!user.signature) {
        alert("Please sign the verification message before proceeding.");
        return;
      }
      await handle_submit();
      return;
    }
    set_step(step + 1);
  };
  const handle_back = () => set_step(step - 1);
  const handle_sign = async () => {
    set_is_loading(true);
    try {
      const { signature, hash } = await sign_message(user.nonce);
      set_user({ ...user, signature: signature, hash: hash});
      
      // Update wallet address if not already set
      if (!wallet_address) {
        const { signer } = await connect_wallet();
        const addr = await signer.getAddress();
        set_wallet_address(addr);
      }
      
      // Removed noisy alert
    } catch (error) {
      console.error("Signing failed", error);
      if (error.code === 4001) {
        alert("Signature request rejected. Please sign the message to verify your identity.");
      } else {
        alert("Failed to sign message. Please make sure your wallet is connected.");
      }
    } finally {
      set_is_loading(false);
    }
  };

  const handle_submit = async (e) => {
    if (e) e.preventDefault();
    if (!user.signature || !user.nonce) {
      alert("Please ensure you have requested a nonce and signed the verification message.");
      return;
    }
    
    set_is_loading(true);
    try {
      const success = await send_profile({ ...user, role });
      if (success) {
        router.push("/verify-email");
      } else {
        alert("Registration failed. Email might already be in use or data is invalid.");
      }
    } catch (error) {
      console.error("Submission error", error);
      const message = error.response?.data?.message || "An error occurred during registration. Please try again later.";
      alert(message);
    } finally {
      set_is_loading(false);
    }
  };

  return (
      <div
          className="min-h-screen bg-slate-50 dark:bg-slate-950/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div
              className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-[120px]"></div>
          <div
              className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-4xl mx-auto w-full relative z-10">
          <div className="text-center mb-8">
            <div
                className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-4">
              Sign Up for the Decentralized Future
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Create Your Account</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">Sign up for the world's most trusted
              decentralized freelance network.</p>
          </div>

          <div
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-indigo-100/20 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">

            {/* Sidebar Info */}
            <div
                className="md:w-1/3 bg-indigo-600 p-10 text-white relative flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-400 rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10">
                <div className="bg-white/20 p-3 rounded-2xl w-fit mb-6 backdrop-blur-sm border border-white/10">
                  <Shield className="w-8 h-8 text-white"/>
                </div>
                <h2 className="text-2xl font-bold mb-4">Why REP TOKEN?</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 mr-3 mt-1 text-indigo-300"/>
                    <p className="text-sm text-indigo-100">Immutable reputation scores earned through verified work.</p>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 mr-3 mt-1 text-indigo-300"/>
                    <p className="text-sm text-indigo-100">Zero-commission payments using stablecoins.</p>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 mr-3 mt-1 text-indigo-300"/>
                    <p className="text-sm text-indigo-100">Community-governed dispute resolution system.</p>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
                <p className="text-xs text-indigo-200 font-medium uppercase tracking-widest mb-4">Step {step} of 3</p>
                <div className="flex gap-2">
                  {[1, 2, 3].map((s) => (
                      <div key={s}
                           className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? "bg-white w-8" : "bg-white/20 w-4"}`}></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-8 md:p-12">
              <form onSubmit={handle_submit} className="h-full flex flex-col">

                {/* Step 1: Role Selection */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Choose your path</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Select the role that best describes
                          you.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {roles.map((r) => {
                          const Icon = r.icon;
                          const isSelected = role === r.id;
                          return (
                              <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => set_role(r.id)}
                                  className={`flex items-start p-5 rounded-3xl border-2 text-left transition-all ${
                                      isSelected
                                          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 ring-4 ring-indigo-50 dark:ring-indigo-900/10"
                                          : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                                  }`}
                              >
                                <div
                                    className={`p-3 rounded-2xl mr-4 ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                                  <Icon className="w-6 h-6"/>
                                </div>
                                <div>
                                  <p className={`font-bold ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`}>
                                    {r.title}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    {r.desc}
                                  </p>
                                </div>
                                {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 ml-auto"/>}
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

                      <div
                          onClick={() => document.getElementById('profile-upload').click()}
                          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/50 transition-colors cursor-pointer group">
                        <input
                            id="profile-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handle_image_change}
                        />
                        <div
                            className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm mb-4 border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform overflow-hidden">
                          {profile_preview ? (
                              <img src={profile_preview} alt="Profile Preview" className="w-full h-full object-cover" />
                          ) : (
                              <ImageIcon className="w-8 h-8 text-slate-400"/>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{profile_preview ? "Change Profile Picture" : "Upload Profile Picture"}</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                      </div>

                      <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                          <input
                              type="text"
                              placeholder="First Name"
                              onChange={(e) => set_user({...user, f_name: e.target.value})}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                          />
                        </div>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                          <input
                              type="text"
                              placeholder="Last Name"
                              onChange={(e) => set_user({...user, l_name: e.target.value})}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                          />
                        </div>
                      </div>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                          <input
                              type="email"
                              placeholder="Email Address"
                              onChange={(e) => set_user({...user, email: e.target.value})}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                          <input
                              type="password"
                              placeholder="Password (6 characters, mixed alphabet)"
                              onChange={(e) => set_user({...user, password: e.target.value})}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                          />
                        </div>
                        <textarea
                            rows={3}
                            placeholder="Brief Bio (Professional headline, experience...)"
                            onChange={(e) => set_user({...user, description: e.target.value})}
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
                        <p className="text-sm text-slate-500 dark:text-slate-400">Connect your wallet and sign the
                          message to proceed.</p>
                      </div>

                      <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10">
                          <Wallet className="w-24 h-24"/>
                        </div>
                        <div className="relative z-10">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Connected
                            Address</p>
                          <p className="text-sm font-mono font-medium truncate">
                            {wallet_address || "Not Connected"}
                          </p>

                          {wallet_address ? (
                            <div className="flex items-center mt-4 text-xs text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5"/>
                              Wallet Linked Successfully
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handle_connect_wallet}
                              className="mt-4 flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
                            >
                              <Wallet className="w-3.5 h-3.5 mr-2" />
                              Connect Wallet
                            </button>
                          )}
                        </div>
                      </div>

                      {!wallet_address && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-400">Wallet Connection Needed</p>
                            <p className="text-xs text-blue-700 dark:text-blue-500">Please click the 'Connect Wallet' button above to link your blockchain identity before signing.</p>
                          </div>
                        </div>
                      )}

                      <div
                          className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-3xl">
                        <div className="flex items-start">
                          <Info className="w-5 h-5 text-amber-600 mr-3 mt-0.5"/>
                          <div>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">Signature
                              Required</p>
                            <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed mb-2">
                              By signing, you prove ownership of this wallet. This action does not cost any gas and will
                              not trigger a transaction.
                            </p>
                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                              <p className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-600 mb-1">Message to sign:</p>
                              <p className="text-xs font-mono text-amber-900 dark:text-amber-300">
                                Please sign this nonce to verify your identity: <span className="font-bold underline">{user.nonce || "Loading..."}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handle_message_request}
                            disabled={is_loading}
                            className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-2xl font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition flex items-center justify-center group mb-4"
                        >
                          <Zap className="w-4 h-4 mr-2 text-indigo-600 group-hover:scale-110 transition-transform"/>
                          {user.nonce ? "Refresh Nonce" : "Request Nonce"}
                        </button>

                        <button
                            type="button"
                            onClick={handle_sign}
                            disabled={is_loading || !user.nonce}
                            className={`w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center group ${user.signature ? 'border-emerald-500 dark:border-emerald-500/50 ring-4 ring-emerald-50 dark:ring-emerald-900/10' : ''}`}
                        >
                          {user.signature ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 fill-emerald-500/10"/>
                              Verification Complete
                            </>
                          ) : (
                            <>
                              <Key className="w-4 h-4 mr-2 text-indigo-600 group-hover:rotate-12 transition-transform"/>
                              {is_loading ? "Signing..." : "Sign Verification Message"}
                            </>
                          )}
                        </button>

                        {user.signature && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-500 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3">
                            <div className="p-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200 dark:shadow-none">
                              <CheckCircle2 className="w-4 h-4 text-white"/>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-400">Everything looks good!</p>
                              <p className="text-[10px] text-emerald-700 dark:text-emerald-500 font-medium">Your identity has been verified. Click 'Next Step' to complete your registration.</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Link Socials</span>
                          <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <button type="button"
                                  className="flex items-center justify-center p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <Github className="w-5 h-5 mr-2"/>
                            <span className="text-xs font-bold">GitHub</span>
                          </button>
                          <button type="button"
                                  className="flex items-center justify-center p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <Twitter className="w-5 h-5 mr-2"/>
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
                          onClick={handle_back}
                          className="flex-1 py-4 px-6 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        Back
                      </button>
                  )}

                  {step <= 3 ? (
                      <button
                          type="button"
                          onClick={handle_next}
                          className="flex-[2] py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center group"
                      >
                        Next Step
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                      </button>
                  ) : (
                      <button
                          type="submit"
                          disabled={is_loading}
                          className="flex-[2] py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {is_loading ? "Processing..." : "Complete Registration"}
                        {!is_loading && <Zap className="ml-2 w-4 h-4 fill-white animate-pulse"/>}
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
