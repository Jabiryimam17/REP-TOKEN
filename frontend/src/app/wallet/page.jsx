"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Send,
  RefreshCcw,
  Shield,
  Coins,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { ethers } from "ethers";
import connect_wallet from "@/services/connect_wallet.service";
import { useApp } from "@/context/AppContext";
import config from "@/configs/registry_address.json" with { type: "json" };
import { abi as registryAbi } from "@/abis/Registry.json" with { type: "json" };
import { abi as rptAbi } from "@/abis/ReputationToken.json" with { type: "json" };
import { abi as stableAbi } from "@/abis/EthioCoin.json" with { type: "json" };

export default function WalletPage() {
  const { wallet_address, set_wallet_address } = useApp();

  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [contracts, setContracts] = useState({ rpt: null, stable: null });
  const [tokenMeta, setTokenMeta] = useState({
    rpt: { symbol: "RPT", name: "Reputation Token", decimals: 18, address: "" },
    stable: { symbol: "ETC", name: "EthioCoin", decimals: 18, address: "" },
  });
  const [balances, setBalances] = useState({ rpt: "0", stable: "0" });
  const [forms, setForms] = useState({
    rpt: { to: "", amount: "" },
    stable: { to: "", amount: "" },
  });
  const [txState, setTxState] = useState({
    rpt: { status: "idle", message: "" },
    stable: { status: "idle", message: "" },
  });

  const shortAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—";

  const statusBadge = (state) => {
    const map = {
      idle: "text-slate-500",
      pending: "text-amber-600",
      mining: "text-indigo-600",
      success: "text-emerald-600",
      error: "text-red-600",
    };
    return map[state] || "text-slate-500";
  };

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setLoading(true);
    setError("");
    try {
      const { provider, signer } = await connect_wallet();
      const address = await signer.getAddress();
      set_wallet_address(address);

      const net = await provider.getNetwork();
      setNetwork(net);

      const registry = new ethers.Contract(config.registry, registryAbi, signer);
      const [, rptAddr, stableAddr] = await registry.get_system_addresses();

      const rptContract = new ethers.Contract(rptAddr, rptAbi, signer);
      const stableContract = new ethers.Contract(stableAddr, stableAbi, signer);

      const [
        rptSymbol,
        stableSymbol,
        rptDecimals,
        stableDecimals,
        rptBalance,
        stableBalance,
      ] = await Promise.all([
        rptContract.symbol(),
        stableContract.symbol(),
        rptContract.decimals(),
        stableContract.decimals(),
        rptContract.balanceOf(address),
        stableContract.balanceOf(address),
      ]);

      setContracts({ rpt: rptContract, stable: stableContract });
      setTokenMeta({
        rpt: { symbol: rptSymbol, name: "Reputation Token", decimals: Number(rptDecimals), address: rptAddr },
        stable: { symbol: stableSymbol, name: "EthioCoin", decimals: Number(stableDecimals), address: stableAddr },
      });
      setBalances({
        rpt: ethers.formatUnits(rptBalance, rptDecimals),
        stable: ethers.formatUnits(stableBalance, stableDecimals),
      });
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message || "Failed to load wallet data.");
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async () => {
    if (!contracts.rpt || !contracts.stable || !wallet_address) return;
    try {
      const [rptBalance, stableBalance] = await Promise.all([
        contracts.rpt.balanceOf(wallet_address),
        contracts.stable.balanceOf(wallet_address),
      ]);
      setBalances({
        rpt: ethers.formatUnits(rptBalance, tokenMeta.rpt.decimals),
        stable: ethers.formatUnits(stableBalance, tokenMeta.stable.decimals),
      });
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message || "Unable to refresh balances.");
    }
  };

  const handleSend = async (key) => {
    const { to, amount } = forms[key];
    const meta = tokenMeta[key];
    const contract = contracts[key];

    if (!contract) return;
    if (!ethers.isAddress(to)) {
      setTxState((prev) => ({
        ...prev,
        [key]: { status: "error", message: "Enter a valid recipient address." },
      }));
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setTxState((prev) => ({
        ...prev,
        [key]: { status: "error", message: "Amount must be greater than zero." },
      }));
      return;
    }
    const numericBalance = Number(balances[key] || 0);
    if (Number(amount) > numericBalance) {
      setTxState((prev) => ({
        ...prev,
        [key]: { status: "error", message: "Insufficient balance for this transfer." },
      }));
      return;
    }

    try {
      setTxState((prev) => ({
        ...prev,
        [key]: { status: "pending", message: "Confirm the transaction in your wallet..." },
      }));

      const value = ethers.parseUnits(amount, meta.decimals);
      const tx = await contract.transfer(to, value);

      setTxState((prev) => ({
        ...prev,
        [key]: { status: "mining", message: `Sending ${meta.symbol}...` },
      }));

      await tx.wait();

      setTxState((prev) => ({
        ...prev,
        [key]: { status: "success", message: `${meta.symbol} sent successfully.` },
      }));
      await refreshBalances();
    } catch (err) {
      console.error(err);
      setTxState((prev) => ({
        ...prev,
        [key]: { status: "error", message: err.shortMessage || err.message || "Transaction failed." },
      }));
    }
  };

  const setMax = (key) => {
    setForms((prev) => ({
      ...prev,
      [key]: { ...prev[key], amount: balances[key] || "" },
    }));
  };

  const copy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
  };

  const cards = useMemo(
    () => [
      {
        key: "rpt",
        accent: "from-indigo-500/20 via-indigo-500/10 to-transparent",
        icon: Shield,
        gradient: "bg-gradient-to-br from-indigo-600 to-blue-500",
      },
      {
        key: "stable",
        accent: "from-emerald-500/20 via-emerald-500/10 to-transparent",
        icon: Coins,
        gradient: "bg-gradient-to-br from-emerald-500 to-teal-500",
      },
    ],
    []
  );

  return (
    <div className="relative bg-white dark:bg-slate-950 min-h-[calc(100vh-64px)]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-32 -top-24 w-96 h-96 bg-indigo-200/40 dark:bg-indigo-900/20 blur-[140px]" />
        <div className="absolute right-0 top-32 w-80 h-80 bg-emerald-200/40 dark:bg-emerald-900/20 blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-200/30 dark:bg-blue-900/10 blur-[140px]" />
      </div>

      <section className="relative container mx-auto px-4 py-14 md:py-18">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200/40 dark:shadow-none">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">On-chain</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Send Tokens</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-8 relative z-10">
          <div className="space-y-6">
            <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Gasless-friendly UI, same theme
                </div>
                <div className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-sm font-semibold">
                  Chain ID: {network?.chainId ?? "—"}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm">
                  Registry: {shortAddress(config.registry)}
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Connected wallet</p>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200">
                      {wallet_address ? shortAddress(wallet_address) : "Connect wallet"}
                    </span>
                    {wallet_address && (
                      <button
                        onClick={() => copy(wallet_address)}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Copy address"
                      >
                        <Copy className="w-4 h-4 text-slate-500" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={initialize}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Resync
                  </button>
                  <button
                    onClick={refreshBalances}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200/40 dark:shadow-none"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Refresh balances
                  </button>
                </div>
              </div>
              {error && (
                <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 px-4 py-3 rounded-2xl">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-10 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading wallet data...
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {cards.map(({ key, accent, icon: Icon, gradient }) => (
                  <div
                    key={key}
                    className="relative p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 overflow-hidden backdrop-blur"
                  >
                    <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${accent}`} />
                    <div className="relative space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl ${gradient} text-white flex items-center justify-center shadow-lg shadow-indigo-200/30 dark:shadow-none`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Send</p>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                              {tokenMeta[key].symbol} • {tokenMeta[key].name}
                            </h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 dark:text-slate-400">Balance</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">{Number(balances[key] || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <label className="space-y-2">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Recipient</span>
                          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 px-4 py-3 focus-within:border-indigo-500/70 focus-within:shadow-[0_12px_40px_-24px_rgba(79,70,229,0.65)] transition-all">
                            <Send className="w-4 h-4 text-slate-400" />
                            <input
                              value={forms[key].to}
                              onChange={(e) =>
                                setForms((prev) => ({ ...prev, [key]: { ...prev[key], to: e.target.value } }))
                              }
                              placeholder="0x recipient address"
                              className="w-full bg-transparent outline-none text-sm"
                              autoComplete="off"
                            />
                          </div>
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Amount</span>
                          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 px-4 py-3 focus-within:border-indigo-500/70 focus-within:shadow-[0_12px_40px_-24px_rgba(79,70,229,0.65)] transition-all">
                            <Coins className="w-4 h-4 text-slate-400" />
                            <input
                              value={forms[key].amount}
                              onChange={(e) =>
                                setForms((prev) => ({ ...prev, [key]: { ...prev[key], amount: e.target.value } }))
                              }
                              placeholder="0.0"
                              className="w-full bg-transparent outline-none text-sm"
                              type="number"
                              min="0"
                            />
                            <button
                              onClick={() => setMax(key)}
                              className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                              type="button"
                            >
                              Max
                            </button>
                          </div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className={`text-xs font-semibold ${statusBadge(txState[key].status)} flex items-center gap-2`}>
                          {txState[key].status === "success" && <CheckCircle2 className="w-4 h-4" />}
                          {txState[key].status === "pending" && <Loader2 className="w-4 h-4 animate-spin" />}
                          {txState[key].status === "mining" && <Loader2 className="w-4 h-4 animate-spin" />}
                          {txState[key].status === "error" && <AlertCircle className="w-4 h-4" />}
                          <span>{txState[key].message || "Ready"}</span>
                        </div>
                        <button
                          onClick={() => handleSend(key)}
                          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-95 transition-all dark:bg-white dark:text-slate-900 shadow-lg shadow-slate-200/40 dark:shadow-none"
                        >
                          <Send className="w-4 h-4" />
                          Send {tokenMeta[key].symbol}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Token address: {shortAddress(tokenMeta[key].address)}</span>
                        <button
                          onClick={() => copy(tokenMeta[key].address)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>

                      {key === "stable" && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          EthioCoin is a fixed-supply ERC20. If transfers fail, be sure your wallet actually holds ETC
                          (the initial supply lives with the deployer/treasury).
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Balances</p>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Wallet Overview</h3>
                </div>
              </div>

              <div className="space-y-3">
                {["rpt", "stable"].map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-100">
                        {tokenMeta[key].symbol}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{tokenMeta[key].name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{shortAddress(tokenMeta[key].address)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {Number(balances[key] || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{tokenMeta[key].symbol}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-900/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-200 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Tips
                </div>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>Use the same network as your connected wallet.</li>
                  <li>Click Max to prefill with your available balance.</li>
                  <li>Transactions stay on-chain; keep this tab open until they finish.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
