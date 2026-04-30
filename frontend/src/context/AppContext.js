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

  const [address_mismatch, set_address_mismatch] = useState(false);

  // Address matching check
  useEffect(() => {
    const checkAddressMatch = async () => {
      if (is_authenticated && wallet_address) {
        const token = getCookie("token");
        if (token) {
          try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
            );
            const payload = JSON.parse(jsonPayload);

            if (payload.hash_address) {
              const current_hash = ethers.keccak256(
                ethers.getBytes(ethers.getAddress(wallet_address))
              );
              set_address_mismatch(current_hash !== payload.hash_address);
            }
          } catch (e) {
            console.error("Error decoding token or hashing address:", e);
          }
        }
      } else {
        set_address_mismatch(false);
      }
    };
    checkAddressMatch();
  }, [is_authenticated, wallet_address]);

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
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          set_wallet_address(accounts[0]);
          // Auto refresh on account change as requested
          window.location.reload();
        } else {
          set_wallet_address("");
        }
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  const logout = async () => {
    try {
      await axios.post("http://localhost:3333/api/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      removeCookie("token");
      set_is_authenticated(false);
    }
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
      is_loading,
      address_mismatch
    }}>
      {address_mismatch && (
        <div className="bg-red-500 text-white text-center p-2 fixed top-0 w-full z-[9999]">
          Warning: The connected wallet address does not match your signed-in profile. 
          Please switch to the correct wallet or sign in again.
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
