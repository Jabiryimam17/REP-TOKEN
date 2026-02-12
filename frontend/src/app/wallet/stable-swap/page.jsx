"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRightLeft,
  ArrowUpRight,
  BadgePercent,
  CheckCircle2,
  Coins,
  Gauge,
  Loader2,
  RefreshCcw,
  Shield,
  Sparkles,
} from "lucide-react";
import { ethers } from "ethers";
import { useApp } from "@/context/AppContext";
import connect_wallet from "@/services/connect_wallet.service";
import config from "@/configs/registry_address.json" with { type: "json" };
import { abi as registryAbi } from "@/abis/Registry.json" with { type: "json" };
import { abi as rptAbi } from "@/abis/ReputationToken.json" with { type: "json" };
import { abi as stableAbi } from "@/abis/EthioCoin.json" with { type: "json" };

const erc20Lite = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
];

const routerAbi = [
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)",
];

const formatNumber = (value) => {
  const num = Number(value || 0);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
};

export default function StableSwapPage() {
  const { wallet_address, set_wallet_address } = useApp();

  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [contracts, setContracts] = useState({ router: null, rpt: null, stable: null });
  const [tokenMeta, setTokenMeta] = useState({
    rpt: { symbol: "RPT", decimals: 18, address: "" },
    stable: { symbol: "ETC", decimals: 18, address: "" },
    router: "",
  });
  const [balances, setBalances] = useState({ rpt: "0", stable: "0" });
  const [allowances, setAllowances] = useState({ rpt: 0n, stable: 0n });
  const [slippage, setSlippage] = useState(1);

  const [forms, setForms] = useState({
    stableToRpt: { amountIn: "", expectedOut: "" },
    rptToStable: { amountIn: "", expectedOut: "" },
    addLiquidity: { stable: "", rpt: "" },
  });

  const [txState, setTxState] = useState({
    stableToRpt: { status: "idle", message: "" },
    rptToStable: { status: "idle", message: "" },
    addLiquidity: { status: "idle", message: "" },
  });

  const statusTone = (status) => {
    const tones = {
      idle: "text-slate-500",
      pending: "text-amber-600",
      mining: "text-indigo-600",
      success: "text-emerald-600",
      error: "text-red-600",
    };
    return tones[status] || "text-slate-500";
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
        console.log("I am bootstrapping");
    setLoading(true);
    setError("");
    try {
      const { provider, signer } = await connect_wallet();
      const address = await signer.getAddress();
      set_wallet_address(address);

      const net = await provider.getNetwork();
      setNetwork(net);

      const registry = new ethers.Contract(config.registry, registryAbi, signer);
      const [, rptAddr, stableAddr, , , , , , routerAddr] = await registry.get_system_addresses();

      const router = new ethers.Contract(routerAddr, routerAbi, signer);
      const rpt = new ethers.Contract(rptAddr, rptAbi, signer);
      const stable = new ethers.Contract(stableAddr, stableAbi, signer);

      const [rptSymbol, stableSymbol, rptDecimals, stableDecimals, rptAllowance, stableAllowance] = await Promise.all([
        rpt.symbol(),
        stable.symbol(),
        rpt.decimals(),
        stable.decimals(),
        rpt.allowance(address, routerAddr),
        stable.allowance(address, routerAddr),
      ]);

      setContracts({ router, rpt, stable });
      setTokenMeta({
        rpt: { symbol: rptSymbol, decimals: Number(rptDecimals), address: rptAddr },
        stable: { symbol: stableSymbol, decimals: Number(stableDecimals), address: stableAddr },
        router: routerAddr,
      });
      setAllowances({ rpt: rptAllowance, stable: stableAllowance });

      await refreshBalances(rpt, stable, address, Number(rptDecimals), Number(stableDecimals));
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message || "Unable to load swap data.");
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async (rpt, stable, user, rptDecimals, stableDecimals) => {
         console.log("I am refreshing balances");
    try {
      const [rptBal, stableBal] = await Promise.all([rpt.balanceOf(user), stable.balanceOf(user)]);
      setBalances({
        rpt: ethers.formatUnits(rptBal, rptDecimals),
        stable: ethers.formatUnits(stableBal, stableDecimals),
      });
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message || "Failed to refresh balances.");
    }
  };

  const handleAmountChange = (key, value) => {
        console.log("I am handling amount change");
    setForms((prev) => ({
      ...prev,
      [key]: { ...prev[key], amountIn: value },
    }));
    quote(key, value);
  };

  const handleMax = (key) => {
        console.log("I am handling max");
    const amount =
      key === "stableToRpt"
        ? balances.stable
        : key === "rptToStable"
        ? balances.rpt
        : key === "addLiquidityStable"
        ? balances.stable
        : balances.rpt;
    handleAmountChange(key, amount || "0");
  };

  const quote = async (key, value) => {
        console.log("I am quoting");
    if (!contracts.router || !value || Number(value) <= 0) {
      setForms((prev) => ({ ...prev, [key]: { ...prev[key], expectedOut: "" } }));
      return null;
    }

    try {
      const isStableToRpt = key === "stableToRpt";
      const amountIn = ethers.parseUnits(
        value,
        isStableToRpt ? tokenMeta.stable.decimals : tokenMeta.rpt.decimals
      );
      const path = isStableToRpt
        ? [tokenMeta.stable.address, tokenMeta.rpt.address]
        : [tokenMeta.rpt.address, tokenMeta.stable.address];
      const outDecimals = isStableToRpt ? tokenMeta.rpt.decimals : tokenMeta.stable.decimals;
      console.log(contracts.router);
      const amounts = await contracts.router.getAmountsOut(amountIn, path);
      console.log("amounts", amounts);
      const out = amounts[amounts.length - 1];
      const formatted = ethers.formatUnits(out, outDecimals);

      setForms((prev) => ({ ...prev, [key]: { ...prev[key], expectedOut: formatted } }));
      return { raw: out, formatted };
    } catch (err) {
      console.error(err);
      setForms((prev) => ({ ...prev, [key]: { ...prev[key], expectedOut: "" } }));
      return null;
    }
  };

  const applySlippage = (amountOut) => {
    const bps = Math.max(0, Math.min(10_000, Math.round(slippage * 100)));
    return amountOut - (amountOut * BigInt(bps)) / 10_000n;
  };

  const ensureAllowance = async (key, amountNeeded) => {
    const tokenContract = key === "rpt" ? contracts.rpt : contracts.stable;
    const currentAllowance = allowances[key] || 0n;
    if (currentAllowance >= amountNeeded) return;
    console.log("I am ensuring allowance");

    setTxState((prev) => ({
      ...prev,
      [key === "rpt" ? "rptToStable" : "stableToRpt"]: { status: "pending", message: "Approving tokens..." },
    }));

    const tx = await tokenContract.approve(tokenMeta.router, amountNeeded);
    await tx.wait();
    const updated = await tokenContract.allowance(wallet_address, tokenMeta.router);
    setAllowances((prev) => ({ ...prev, [key]: updated }));
  };

  const handleSwap = async (key) => {
    if (!wallet_address) {
      setError("Connect your wallet first.");
      return;
    }
    if (!contracts.router) return;

    console.log(contracts.router);
    setTxState((prev) => ({ ...prev, [key]: { status: "pending", message: "Awaiting confirmation..." } }));
    setError("");

    try {
      const deadline = Math.floor(Date.now() / 1000) + 600;

      if (key === "stableToRpt") {
        const amountIn = ethers.parseUnits(forms.stableToRpt.amountIn || "0", tokenMeta.stable.decimals);
        if (amountIn <= 0n) throw new Error("Enter an EthioCoin amount.");

        await ensureAllowance("stable", amountIn);
        const amounts = await contracts.router.getAmountsOut(amountIn, [
          tokenMeta.stable.address,
          tokenMeta.rpt.address,
        ]);
        const minOut = applySlippage(amounts[1]);

        const tx = await contracts.router.swapExactTokensForTokens(
          amountIn,
          minOut,
          [tokenMeta.stable.address, tokenMeta.rpt.address],
          wallet_address,
          deadline
        );
        setTxState((prev) => ({ ...prev, stableToRpt: { status: "mining", message: "Swapping ETC for RPT..." } }));
        await tx.wait();
      } else {
        const amountIn = ethers.parseUnits(forms.rptToStable.amountIn || "0", tokenMeta.rpt.decimals);
        if (amountIn <= 0n) throw new Error("Enter an RPT amount.");

        await ensureAllowance("rpt", amountIn);
        const amounts = await contracts.router.getAmountsOut(amountIn, [
          tokenMeta.rpt.address,
          tokenMeta.stable.address,
        ]);
        const minOut = applySlippage(amounts[1]);

        const tx = await contracts.router.swapExactTokensForTokens(
          amountIn,
          minOut,
          [tokenMeta.rpt.address, tokenMeta.stable.address],
          wallet_address,
          deadline
        );
        setTxState((prev) => ({ ...prev, rptToStable: { status: "mining", message: "Swapping RPT for ETC..." } }));
        await tx.wait();
      }

      await refreshBalances(contracts.rpt, contracts.stable, wallet_address, tokenMeta.rpt.decimals, tokenMeta.stable.decimals);
      setTxState((prev) => ({ ...prev, [key]: { status: "success", message: "Swap completed." } }));
    } catch (err) {
      console.error(err);
      setTxState((prev) => ({
        ...prev,
        [key]: { status: "error", message: err.shortMessage || err.message || "Swap failed." },
      }));
    }
  };

  const handleAddLiquidity = async () => {
    if (!wallet_address) {
      setError("Connect your wallet first.");
      return;
    }
    if (!contracts.router) return;

    setTxState((prev) => ({ ...prev, addLiquidity: { status: "pending", message: "Awaiting confirmation..." } }));

    try {
      const deadline = Math.floor(Date.now() / 1000) + 600;
      console.log(deadline);
      const stableAmount = ethers.parseUnits(forms.addLiquidity.stable || "0", tokenMeta.stable.decimals);
      const rptAmount = ethers.parseUnits(forms.addLiquidity.rpt || "0", tokenMeta.rpt.decimals);

      if (stableAmount <= 0n || rptAmount <= 0n) throw new Error("Enter both ETC and RPT amounts.");

      await ensureAllowance("stable", stableAmount);
      await ensureAllowance("rpt", rptAmount);

      console.log("I am liquidity")
      console.log(await contracts.stable.allowance(wallet_address,tokenMeta.router));
      console.log(await contracts.rpt.allowance(wallet_address,tokenMeta.router));
      const minStable = applySlippage(stableAmount);
      const minRpt = applySlippage(rptAmount);
      console.log(minStable, minRpt);
      const tx = await contracts.router.addLiquidity(
        tokenMeta.stable.address,
        tokenMeta.rpt.address,
        stableAmount,
        rptAmount,
        0,
        0,
        wallet_address,
        deadline,
          { gasLimit: 3_000_000 }
      );

      setTxState((prev) => ({ ...prev, addLiquidity: { status: "mining", message: "Supplying liquidity..." } }));
      await tx.wait();

      await refreshBalances(
        contracts.rpt,
        contracts.stable,
        wallet_address,
        tokenMeta.rpt.decimals,
        tokenMeta.stable.decimals
      );
      setTxState((prev) => ({ ...prev, addLiquidity: { status: "success", message: "Liquidity added." } }));
    } catch (err) {
      console.error(err);
      setTxState((prev) => ({
        ...prev,
        addLiquidity: { status: "error", message: err.shortMessage || err.message || "Add liquidity failed." },
      }));
    }
  };

  const slippageOptions = useMemo(() => [0.5, 1, 3], []);

  const cards = [
    {
      key: "stableToRpt",
      title: "Swap EthioCoin → RPT",
      accent: "from-emerald-500/30 via-emerald-500/10 to-transparent",
      chip: "Buy reputation",
      color: "bg-gradient-to-br from-emerald-500 to-teal-500",
      labelIn: "Pay with EthioCoin (ETC)",
      labelOut: "You receive (RPT)",
      balance: `${formatNumber(balances.stable)} ${tokenMeta.stable.symbol}`,
      icon: ArrowUpRight,
    },
    {
      key: "rptToStable",
      title: "Swap RPT → EthioCoin",
      accent: "from-indigo-500/30 via-indigo-500/10 to-transparent",
      chip: "Realize gains",
      color: "bg-gradient-to-br from-indigo-600 to-blue-500",
      labelIn: "Pay with RPT",
      labelOut: "You receive (ETC)",
      balance: `${formatNumber(balances.rpt)} ${tokenMeta.rpt.symbol}`,
      icon: ArrowLeftRight,
    },
  ];
  const liquidityStatus = txState.addLiquidity;

  return (
    <div className="relative bg-white dark:bg-slate-950 min-h-[calc(100vh-64px)]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-24 -top-24 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-900/25 blur-[140px]" />
        <div className="absolute right-0 top-32 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-900/20 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 w-72 h-72 bg-blue-200/25 dark:bg-blue-900/15 blur-[140px]" />
      </div>

      <section className="relative container mx-auto px-4 py-14 md:py-18">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              Stable/RPT Desk
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-lg shadow-emerald-200/50 dark:shadow-none">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Exchange</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
                  Swap EthioCoins and Reputation Tokens
                </h1>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mt-2">
                  Move between the protocol stable (ETC) and RPT through the configured router. Slippage-aware, allowance-smart, and tuned for fast treasury interactions.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <Shield className="w-4 h-4 text-indigo-500" />
                Registry {config.registry.slice(0, 6)}...{config.registry.slice(-4)}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <Gauge className="w-4 h-4 text-emerald-500" />
                Chain {network?.chainId ?? "—"}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <BadgePercent className="w-4 h-4 text-amber-500" />
                Slippage {slippage}% 
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-none space-y-2 min-w-[240px]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{tokenMeta.stable.symbol}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(balances.stable)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{tokenMeta.rpt.symbol}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(balances.rpt)}</span>
            </div>
            <button
              onClick={bootstrap}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              Resync
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-200">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-8">
          <div className="space-y-6">
            <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Safety</p>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Price protection</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {slippageOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSlippage(opt)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        slippage === opt
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400"
                      }`}
                    >
                      {opt}% slippage
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Swaps route through the protocol router set in the Registry. Minimum output honors your slippage guard so you never receive less than expected after fees and impact.
              </p>
            </div>

            {loading ? (
              <div className="p-10 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading swap desk...
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {cards.map(({ key, title, accent, chip, color, labelIn, labelOut, balance, icon: Icon }) => (
                  <div
                    key={key}
                    className="relative p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/85 dark:bg-slate-900/60 overflow-hidden backdrop-blur"
                  >
                    <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${accent}`} />
                    <div className="relative space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg shadow-emerald-200/30 dark:shadow-none`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                              {chip}
                            </p>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                          Balance
                          <div className="font-semibold text-slate-900 dark:text-white">{balance}</div>
                        </div>
                      </div>

                      <label className="space-y-2 block">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{labelIn}</span>
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-4 py-3 focus-within:border-indigo-500/70 focus-within:shadow-[0_12px_40px_-24px_rgba(79,70,229,0.65)] transition-all">
                          <Coins className="w-4 h-4 text-slate-400" />
                          <input
                            value={forms[key].amountIn}
                            onChange={(e) => handleAmountChange(key, e.target.value)}
                            placeholder="0.0"
                            className="w-full bg-transparent outline-none text-sm"
                            type="number"
                            min="0"
                          />
                          <button
                            type="button"
                            onClick={() => handleMax(key)}
                            className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            Max
                          </button>
                        </div>
                      </label>

                      <label className="space-y-2 block">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{labelOut}</span>
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-4 py-3">
                          <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                          <input
                            value={forms[key].expectedOut}
                            readOnly
                            placeholder="—"
                            className="w-full bg-transparent outline-none text-sm"
                          />
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                            Est.
                          </span>
                        </div>
                      </label>

                      <div className="flex items-center justify-between gap-2">
                        <div className={`text-[11px] font-semibold ${statusTone(txState[key].status)} flex items-center gap-2`}>
                          {txState[key].status === "success" && <CheckCircle2 className="w-4 h-4" />}
                          {txState[key].status === "pending" && <Loader2 className="w-4 h-4 animate-spin" />}
                          {txState[key].status === "mining" && <Loader2 className="w-4 h-4 animate-spin" />}
                          {txState[key].status === "error" && <AlertCircle className="w-4 h-4" />}
                          <span>{txState[key].message || "Ready"}</span>
                        </div>
                        <button
                          onClick={() => handleSwap(key)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-95 transition-all dark:bg-white dark:text-slate-900 shadow-lg shadow-slate-200/40 dark:shadow-none"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          Execute swap
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <BadgePercent className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Router</p>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Swap plumbing</h3>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Router</span>
                  <span className="font-mono text-xs text-right">{tokenMeta.router}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">EthioCoin</span>
                  <span className="font-mono text-xs text-right">{tokenMeta.stable.address}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">RPT</span>
                  <span className="font-mono text-xs text-right">{tokenMeta.rpt.address}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Add liquidity (ETC/RPT)</p>
                  </div>
                  <span className={`text-[11px] font-semibold ${statusTone(liquidityStatus.status)} flex items-center gap-2`}>
                    {liquidityStatus.status === "success" && <CheckCircle2 className="w-4 h-4" />}
                    {liquidityStatus.status === "pending" && <Loader2 className="w-4 h-4 animate-spin" />}
                    {liquidityStatus.status === "mining" && <Loader2 className="w-4 h-4 animate-spin" />}
                    {liquidityStatus.status === "error" && <AlertCircle className="w-4 h-4" />}
                    <span>{liquidityStatus.message || "Ready"}</span>
                  </span>
                </div>
                <div className="space-y-3">
                  <label className="block space-y-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">EthioCoin amount</span>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2.5">
                      <input
                        value={forms.addLiquidity.stable}
                        onChange={(e) => setForms((prev) => ({ ...prev, addLiquidity: { ...prev.addLiquidity, stable: e.target.value } }))}
                        placeholder="0.0"
                        className="w-full bg-transparent outline-none text-sm"
                        type="number"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => setForms((prev) => ({ ...prev, addLiquidity: { ...prev.addLiquidity, stable: balances.stable } }))}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Max
                      </button>
                    </div>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">RPT amount</span>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2.5">
                      <input
                        value={forms.addLiquidity.rpt}
                        onChange={(e) => setForms((prev) => ({ ...prev, addLiquidity: { ...prev.addLiquidity, rpt: e.target.value } }))}
                        placeholder="0.0"
                        className="w-full bg-transparent outline-none text-sm"
                        type="number"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => setForms((prev) => ({ ...prev, addLiquidity: { ...prev.addLiquidity, rpt: balances.rpt } }))}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Max
                      </button>
                    </div>
                  </label>

                  <button
                    onClick={handleAddLiquidity}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/40 dark:shadow-none"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Supply liquidity
                  </button>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Router mints LP tokens to your address. Minimums follow the current slippage setting.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-900/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-200 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Pro tips
                </div>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
                  <li>Leave a little ETC aside for future swaps and approvals.</li>
                  <li>Resync if approvals complete in another tab.</li>
                  <li>Use lower slippage for large trades to limit price impact.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
