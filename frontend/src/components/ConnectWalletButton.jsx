"use client";

import React, { useState } from "react";
import connect_wallet from "../services/connect_wallet.service";
import { useApp } from "@/context/AppContext";

export default function ConnectWalletButton() {
  const { wallet_address, set_wallet_address } = useApp();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { signer } = await connect_wallet();
      const addr = await signer.getAddress();
      set_wallet_address(addr);
    } catch (error) {
      console.error("Connection failed", error);
      // More graceful error handling
      if (error.message.includes("MetaMask not installed")) {
        alert("Please install MetaMask to connect your wallet.");
      } else if (error.code === 4001) {
        // User rejected
        console.log("User rejected connection");
      } else {
        alert(error.message || "Failed to connect wallet");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 px-5 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
    >
      {loading ? "Connecting..." : wallet_address ? `${wallet_address.substring(0, 6)}...${wallet_address.substring(wallet_address.length - 4)}` : "Connect Wallet"}
    </button>
  );
}
