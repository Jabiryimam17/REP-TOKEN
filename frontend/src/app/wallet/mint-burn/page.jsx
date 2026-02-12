"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Flame,
  Plus,
  Minus,
  Shield,
  Coins,
  AlertCircle,
  Loader2,
  Wand2,
  Sparkles,
  Gauge,
  ClipboardCopy,
  LockKeyhole,
} from "lucide-react";
import { ethers } from "ethers";
import connect_wallet from "@/services/connect_wallet.service";
import config from "@/configs/registry_address.json" with { type: "json" };
import { abi as registryAbi } from "@/abis/Registry.json" with { type: "json" };
import { abi as rptAbi } from "@/abis/ReputationToken.json" with { type: "json" };
import { abi as stableAbi } from "@/abis/EthioCoin.json" with { type: "json" };
import { useApp } from "@/context/AppContext";

export default function MintBurnPage() {
  const { wallet_address, set_wallet_address } = useApp();

  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contracts, setContracts] = useState({ rpt: null, stable: null });
  const [meta, setMeta] = useState({
    rpt: { symbol: "RPT", name: "Reputation Token", decimals: 18, address: "", caps: { canMint: false, canBurn: false } },
    stable: { symbol: "ETC", name: "EthioCoin", decimals: 18, address: "", caps: { canMint: false, canBurn: false } },
  });
  const [balances, setBalances] = useState({ rpt: "0", stable: "0" });
  const [forms, setForms] = useState({
    rpt: { mintTo: "", mintAmount: "", burnFrom: "", burnAmount: "" },
    stable: { mintTo: "", mintAmount: "", burnFrom: "", burnAmount: "" },
  });
  const [txState, setTxState] = useState({
    rpt: { status: "idle", message: "" },
    stable: { status: "idle", message: "" },
  });

  useEffect(() => {
    bootstrap();
  }, []);

  const short = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—");

  const detectCapabilities = (contract) => {
    const caps = { canMint: false, canBurn: false };
    if (!contract) return caps;
    try {
      contract.interface.getFunction("mint(address,uint256)");
      caps.canMint = true;
    } catch (_) {}
    try {
      contract.interface.getFunction("burn(address,uint256)");
      caps.canBurn = true;
    } catch (_) {}
    return caps;
  };

  const bootstrap = async () => {
    setLoading(true);
    setError("");
    try {
      const { provider, signer } = await connect_wallet();
      const addr = await signer.getAddress();
      set_wallet_address(addr);
      const net = await provider.getNetwork();
      setNetwork(net);

      const registry = new ethers.Contract(config.registry, registryAbi, signer);
      const [, rptAddr, stableAddr] = await registry.get_system_addresses();

      const rpt = new ethers.Contract(rptAddr, rptAbi, signer);
      const stable = new ethers.Contract(stableAddr, stableAbi, signer);

      const [
        rptSymbol,
        stableSymbol,
        rptDecimals,
        stableDecimals,
        rptBal,
        stableBal,
      ] = await Promise.all([
        rpt.symbol(),
        stable.symbol(),
        rpt.decimals(),
        stable.decimals(),
        rpt.balanceOf(addr),
        stable.balanceOf(addr),
      ]);

      const rptCaps = detectCapabilities(rpt);
      const stableCaps = detectCapabilities(stable);

      setContracts({ rpt, stable });
      setMeta({
        rpt: {
          symbol: rptSymbol,
          name: "Reputation Token",
          decimals: Number(rptDecimals),
          address: rptAddr,
          caps: rptCaps,
        },
        stable: {
          symbol: stableSymbol,
          name: "EthioCoin",
          decimals: Number(stableDecimals),
          address: stableAddr,
          caps: stableCaps,
        },
      });
      setBalances({
        rpt: ethers.formatUnits(rptBal, rptDecimals),
        stable: ethers.formatUnits(stableBal, stableDecimals),
      });
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message || "Unable to load mint/burn controls.");
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async (key) => {
    if (!contracts[key] || !wallet_address) return;
    const bal = await contracts[key].balanceOf(wallet_address);
    setBalances((prev) => ({
      ...prev,
      [key]: ethers.formatUnits(bal, meta[key].decimals),
    }));
  };

  const runTx = async (key, action) => {
    const contract = contracts[key];
    if (!contract) return;
    const cap = meta[key].caps;
    const { mintTo, mintAmount, burnFrom, burnAmount } = forms[key];
    let fn;
    let args;
    if (action === "mint") {
      if (!cap.canMint) return;
      if (!ethers.isAddress(mintTo)) {
        return setTxState((p) => ({ ...p, [key]: { status: "error", message: "Mint recipient is invalid." } }));
      }
      if (!mintAmount || Number(mintAmount) <= 0) {
        return setTxState((p) => ({ ...p, [key]: { status: "error", message: "Enter a mint amount > 0." } }));
      }
      fn = "mint";
      args = [mintTo, ethers.parseUnits(mintAmount, meta[key].decimals)];
    } else {
      if (!cap.canBurn) return;
      if (!ethers.isAddress(burnFrom)) {
        return setTxState((p) => ({ ...p, [key]: { status: "error", message: "Burn address is invalid." } }));
      }
      if (!burnAmount || Number(burnAmount) <= 0) {
        return setTxState((p) => ({ ...p, [key]: { status: "error", message: "Enter a burn amount > 0." } }));
      }
      fn = "burn";
      args = [burnFrom, ethers.parseUnits(burnAmount, meta[key].decimals)];
    }

    try {
      setTxState((p) => ({ ...p, [key]: { status: "pending", message: "Awaiting wallet confirmation..." } }));
      const tx = await contract[fn](...args);
      setTxState((p) => ({ ...p, [key]: { status: "mining", message: "Transaction submitted. Mining..." } }));
      await tx.wait();
      setTxState((p) => ({ ...p, [key]: { status: "success", message: `${action === "mint" ? "Minted" : "Burned"} successfully.` } }));
      await refreshBalance(key);
    } catch (err) {
      console.error(err);
      setTxState((p) => ({ ...p, [key]: { status: "error", message: err.shortMessage || err.message || "Transaction failed." } }));
    }
  };

  const cards = useMemo(
    () => [
      { key: "rpt", title: "Reputation Token", icon: Shield, gradient: "from-indigo-600 to-blue-500" },
      { key: "stable", title: "EthioCoin Stable", icon: Coins, gradient: "from-emerald-500 to-teal-500" },
    ],
    []
  );

  return (
    <div className="relative bg-white dark:bg-slate-950 min-h-[calc(100vh-64px)] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-28 top-0 w-[28rem] h-[28rem] bg-indigo-200/40 dark:bg-indigo-900/20 blur-[150px]" />
        <div className="absolute right-[-10%] top-32 w-[26rem] h-[26rem] bg-emerald-200/35 dark:bg-emerald-900/15 blur-[160px]" />
        <div className="absolute bottom-[-8%] left-1/4 w-[22rem] h-[22rem] bg-blue-100/40 dark:bg-blue-900/15 blur-[140px]" />
      </div>

      <section className="relative container mx-auto px-4 py-14 md:py-18 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-xs font-semibold uppercase tracking-[0.2em]">
              <Wand2 className="w-4 h-4" />
              Mint & Burn Station
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Forge, refine, or retire your tokens
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
              Controlled access, transparent state. RPT uses role-gated mint/burn. EthioCoin is a fixed-supply ERC20—mint/burn are intentionally disabled.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Chain ID: {network?.chainId ?? "—"}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Registry: {short(config.registry)}
              </span>
            </div>
          </div>
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur w-full md:w-80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Status</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {wallet_address ? short(wallet_address) : "Connect wallet"}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Role-restricted methods will revert if your signer lacks permission. Use the Access Manager roles set on-chain.
            </p>
          </div>
        </div>

        {error && (
          <div className="relative z-10 p-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="relative z-10 p-10 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading contract data...
          </div>
        ) : (
          <div className="relative z-10 grid md:grid-cols-2 gap-6">
            {cards.map(({ key, title, icon: Icon, gradient }) => {
              const caps = meta[key].caps;
              const state = txState[key];
              if (key === "stable") {
                return (
                  <div key={key} className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg shadow-indigo-200/30 dark:shadow-none`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Token</p>
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                            {title} ({meta[key].symbol})
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Balance: {Number(balances[key] || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => refreshBalance(key)}
                        className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Refresh
                      </button>
                    </div>

                    <div className="rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-900/20 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold">
                        <LockKeyhole className="w-4 h-4" />
                        Mint/Burn Disabled
                      </div>
                      <p className="text-sm text-amber-800/80 dark:text-amber-100/80">
                        EthioCoin is a plain ERC20 with fixed supply minted to the deployer. There are no mint or burn methods exposed. Use transfers from the treasury/owner to distribute liquidity.
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Address: {short(meta[key].address)}</span>
                      <button
                        onClick={() => navigator.clipboard?.writeText(meta[key].address)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <ClipboardCopy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={key} className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg shadow-indigo-200/30 dark:shadow-none`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Token</p>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                          {title} ({meta[key].symbol})
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Balance: {Number(balances[key] || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => refreshBalance(key)}
                      className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Mint</span>
                        {!caps.canMint && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200">
                            <LockKeyhole className="w-3 h-3" />
                            Not exposed
                          </span>
                        )}
                      </div>
                      <div className="grid gap-3">
                        <input
                          disabled={!caps.canMint}
                          value={forms[key].mintTo}
                          onChange={(e) => setForms((p) => ({ ...p, [key]: { ...p[key], mintTo: e.target.value } }))}
                          placeholder="Recipient address"
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-indigo-500 disabled:opacity-60"
                        />
                        <input
                          disabled={!caps.canMint}
                          value={forms[key].mintAmount}
                          onChange={(e) => setForms((p) => ({ ...p, [key]: { ...p[key], mintAmount: e.target.value } }))}
                          placeholder="Amount"
                          type="number"
                          min="0"
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-indigo-500 disabled:opacity-60"
                        />
                        <button
                          disabled={!caps.canMint}
                          onClick={() => runTx(key, "mint")}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                          Mint {meta[key].symbol}
                        </button>
                        {!caps.canMint && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            This contract does not expose a public mint function. If minting is required, update the token contract or call via an authorized manager.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Minus className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Burn</span>
                        {!caps.canBurn && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200">
                            <LockKeyhole className="w-3 h-3" />
                            Not exposed
                          </span>
                        )}
                      </div>
                      <div className="grid gap-3">
                        <input
                          disabled={!caps.canBurn}
                          value={forms[key].burnFrom}
                          onChange={(e) => setForms((p) => ({ ...p, [key]: { ...p[key], burnFrom: e.target.value } }))}
                          placeholder="Address to burn from"
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-indigo-500 disabled:opacity-60"
                        />
                        <input
                          disabled={!caps.canBurn}
                          value={forms[key].burnAmount}
                          onChange={(e) => setForms((p) => ({ ...p, [key]: { ...p[key], burnAmount: e.target.value } }))}
                          placeholder="Amount"
                          type="number"
                          min="0"
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-indigo-500 disabled:opacity-60"
                        />
                        <button
                          disabled={!caps.canBurn}
                          onClick={() => runTx(key, "burn")}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors"
                        >
                          <Flame className="w-4 h-4" />
                          Burn {meta[key].symbol}
                        </button>
                        {!caps.canBurn && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            No burn function detected. Burning requires a contract method; transferring to zero address is disallowed by ERC‑20.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Address: {short(meta[key].address)}</span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(meta[key].address)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ClipboardCopy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>

                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    {state.status === "pending" && <Loader2 className="w-4 h-4 animate-spin" />}
                    {state.status === "mining" && <Loader2 className="w-4 h-4 animate-spin" />}
                    {state.status === "success" && <Sparkles className="w-4 h-4 text-emerald-500" />}
                    {state.status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span>{state.message || "Ready"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
