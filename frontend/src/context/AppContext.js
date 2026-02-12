"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getCookie, removeCookie } from "@/utils/cookie.util";
import { ethers } from "ethers";
import axios from "axios";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [is_authenticated, set_is_authenticated] = useState(false);
  const [wallet_address, set_wallet_address] = useState("");
  const [is_loading, set_is_loading] = useState(true);

  // Initial auth check
  useEffect(() => {
    const token = getCookie("token");
    set_is_authenticated(!!token);
    set_is_loading(false);
  }, []);

  // Persistent wallet check
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            set_wallet_address(accounts[0].address);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    checkWallet();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          set_wallet_address(accounts[0]);
        } else {
          set_wallet_address("");
        }
      });
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);

  const logout =  () => {
    removeCookie("token");

    set_is_authenticated(false);
  };

  const login = () => {
    set_is_authenticated(true);
  };

  return (
    <AppContext.Provider value={{ 
      is_authenticated, 
      login, 
      logout, 
      wallet_address, 
      set_wallet_address,
      is_loading 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
