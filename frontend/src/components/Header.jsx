"use client";

import React, { useEffect, useState } from "react";
import { Shield, LogOut, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import ConnectWalletButton from "./ConnectWalletButton";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function Header() {
  const { is_authenticated, logout, is_loading, user } = useApp();
  const router = useRouter();

  const handle_logout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  const get_dashboard_link = () => {
    if (!user) return "/";
    switch (user.role) {
      case "freelancer":
        return "/freelancer/dashboard";
      case "employer":
        return "/employer";
      case "verifier":
        return "/verifier";
      case "admin":
        return "/admin/access-control";
      default:
        return "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => router.push("/")}>
          <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight group-hover:text-indigo-600 transition-colors">REP TOKEN</span>
        </div>
        
        <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium">
          <a href="/jobs" className="hover:text-indigo-600 transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-indigo-600 after:transition-all hover:after:w-full">Find Work</a>
          <a href="/freelancers" className="hover:text-indigo-600 transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-indigo-600 after:transition-all hover:after:w-full">Find Talent</a>
          <a href="/disputes" className="hover:text-indigo-600 transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-indigo-600 after:transition-all hover:after:w-full">Transparency</a>
          <a href="/verifier" className="hover:text-indigo-600 transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-indigo-600 after:transition-all hover:after:w-full">Verifier</a>
          <a
            href="/wallet"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-white shadow-lg shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900 dark:shadow-none"
          >
            Wallet
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {is_loading ? (
            <div className="h-9 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full"></div>
          ) : !is_authenticated ? (
            <>
              <a href="/login" className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 px-5 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300 active:scale-95">
                Login
              </a>
              <a href="/register" className="hidden sm:inline-flex items-center justify-center rounded-full bg-slate-900 dark:bg-white px-5 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-300 shadow-lg shadow-slate-200 dark:shadow-none active:scale-95">
                Sign Up
              </a>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <a 
                href={get_dashboard_link()}
                className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 px-5 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300 active:scale-95"
              >
                Dashboard
              </a>
              <button 
                onClick={handle_logout}
                className="hidden sm:inline-flex items-center justify-center rounded-full border border-red-200 dark:border-red-900/30 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 active:scale-95"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
          
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
