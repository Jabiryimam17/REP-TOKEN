"use client";
import React from "react";
import { 
  Shield, 
  Coins, 
  Users, 
  Scale, 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  Globe, 
  Lock,
  TrendingUp,
  Award
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-white dark:bg-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2 animate-pulse"></span>
              The Future of Freelancing is Here
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8 leading-tight">
              Work, Earn, and Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Reputation</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Connect with top global talent or find your next project. Pay securely with stablecoins and earn reputation tokens that prove your expertise.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button onClick={() => window.location.href='/freelancers'} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center group">
                Find Talent <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => window.location.href='/jobs'} className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-full font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Browse Projects
              </button>
            </div>
            
            <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6" /> <span className="font-bold">Trustless</span>
              </div>
              <div className="flex items-center space-x-2">
                <Coins className="w-6 h-6" /> <span className="font-bold">Stablecoin Payments</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6" /> <span className="font-bold">Community Driven</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Social Proof Section */}
      <section className="py-12 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">$12M+</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Volume Processed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">45k+</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Active Freelancers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">99.8%</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Success Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">2,400+</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Community Verifiers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose REP TOKEN?</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              We've redesigned the freelance experience from the ground up using blockchain technology to solve the biggest problems in the industry.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="group p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 transition-all duration-300">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Coins className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Stablecoin Payments</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                No more volatility. Get paid in USDC or USDT. Instant cross-border transfers with minimal fees.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Reputation Tokens</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Your work history is your greatest asset. Earn non-transferable REP tokens for every successful milestone.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Scale className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Community Justice</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Disputes are resolved by a decentralized community of verifiers, ensuring fair outcomes without expensive intermediaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">How it Works</h2>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold mr-4">1</div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Post or Find a Project</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Create a detailed project brief or browse through listed opportunities that match your skills.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold mr-4">2</div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Escrow in Stablecoins</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Employers fund the project milestones using stablecoins, which are held securely in a smart contract.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold mr-4">3</div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Complete & Get Tokens</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Deliver the work, receive payment instantly, and earn Reputation Tokens that boost your ranking.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 relative z-10">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                      <div>
                        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                        <div className="w-16 h-3 bg-slate-100 dark:bg-slate-800 rounded"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-indigo-600 font-bold">500 USDC</div>
                      <div className="text-[10px] text-slate-400">Escrow Secured</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded w-[90%]"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded w-[75%]"></div>
                  </div>
                  <div className="mt-8 flex justify-center">
                    <div className="px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-bold border border-indigo-100 dark:border-indigo-800">
                      Payment Released Successfully
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center items-center text-sm font-bold text-slate-900 dark:text-white">
                    <Award className="w-4 h-4 text-amber-500 mr-2" /> +25 REP Tokens Earned
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-full h-full bg-indigo-600/10 rounded-3xl -z-0"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community / Dispute Section */}
      <section className="py-24 bg-indigo-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[50%] h-full opacity-10">
           <Globe className="w-full h-full scale-150" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">Governance by the Community</h2>
            <p className="text-xl text-indigo-100 mb-10 leading-relaxed">
              Our decentralized community of verifiers ensures that every dispute is handled fairly. Verifiers are chosen based on their own reputation and expertise in the field of the project.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                <CheckCircle className="w-6 h-6 text-indigo-300" />
                <span className="font-medium">Transparent Decisions</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                <CheckCircle className="w-6 h-6 text-indigo-300" />
                <span className="font-medium">Expert Verification</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                <CheckCircle className="w-6 h-6 text-indigo-300" />
                <span className="font-medium">Fast Resolution</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                <CheckCircle className="w-6 h-6 text-indigo-300" />
                <span className="font-medium">Stake-based Trust</span>
              </div>
            </div>
            <button onClick={() => window.location.href='/verifier'} className="mt-12 px-8 py-4 bg-white text-indigo-600 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all">
              Become a Verifier
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="bg-slate-900 dark:bg-indigo-950 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px]"></div>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 relative z-10">Ready to start your decentralized career?</h2>
            <p className="text-indigo-200 text-xl mb-12 max-w-2xl mx-auto relative z-10">Sign up with thousands of freelancers and employers who are already building the future of work.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 relative z-10">
              <button onClick={() => window.location.href='/register'} className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-xl hover:bg-indigo-50 transition-all">
                Get Started Now
              </button>
              <button className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-white/30 text-white rounded-full font-bold text-xl hover:bg-white/10 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
