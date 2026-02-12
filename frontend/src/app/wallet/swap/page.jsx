"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeftRight,
  ArrowRightLeft,
  ArrowUpRight,
  BadgePercent,
  AlertCircle,
  CheckCircle2,
  Coins,
  DollarSign,
  Droplets,
  Gauge,
  Loader2,
  RefreshCcw,
  Shield,
  Sparkles,
  SwitchCamera,
} from "lucide-react";
import { ethers } from "ethers";
import { useApp } from "@/context/AppContext";
import connect_wallet from "@/services/connect_wallet.service";
import config from "@/configs/registry_address.json" with { type: "json" };
import { abi as registryAbi } from "@/abis/Registry.json" with { type: "json" };
import { abi as rptAbi } from "@/abis/ReputationToken.json" with { type: "json" };

const erc20Abi = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
];

const wethAbi = [
  ...erc20Abi,
  "function deposit() payable",
  "function withdraw(uint256)",
];

const routerAbi = [
  "function WETH() view returns (address)",
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)",
];

const formatNumber = (value) => {
  const num = Number(value || 0);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
};

export default function SwapPage() {
  const { wallet_address, set_wallet_address } = useApp();

  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [contracts, setContracts] = useState({ router: null, rpt: null, weth: null, provider: null });
  const [tokenMeta, setTokenMeta] = useState({
    rpt: { symbol: "RPT", decimals: 18, address: "" },
    weth: { symbol: "WETH", decimals: 18, address: "" },
    router: "",
  });
  const [balances, setBalances] = useState({ eth: "0", rpt: "0", weth: "0" });
  const [allowances, setAllowances] = useState({ rpt: 0n, weth: 0n });
  const [slippage, setSlippage] = useState(1);

  const [forms, setForms] = useState({
    ethToRpt: { amountIn: "", expectedOut: "" },
    rptToEth: { amountIn: "", expectedOut: "" },
    wethToRpt: { amountIn: "", expectedOut: "" },
    addLiquidity: { eth: "", rpt: "" },
  });

  const [txState, setTxState] = useState({
    ethToRpt: { status: "idle", message: "" },
    rptToEth: { status: "idle", message: "" },
    wethToRpt: { status: "idle", message: "" },
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
    setLoading(true);
    setError("");
    try {
      const { provider, signer } = await connect_wallet();
      const address = await signer.getAddress();
      set_wallet_address(address);

      const net = await provider.getNetwork();
      setNetwork(net);

      const registry = new ethers.Contract(config.registry, registryAbi, signer);
      const [, rptAddr, , , , , , , routerAddr] = await registry.get_system_addresses();

      const router = new ethers.Contract(routerAddr, routerAbi, signer);
      const wethAddr = await router.WETH();
      const rpt = new ethers.Contract(rptAddr, rptAbi, signer);
      const weth = new ethers.Contract(wethAddr, wethAbi, signer);

      const [rptSymbol, rptDecimals, wethSymbol, wethDecimals, rptAllowance, wethAllowance] = await Promise.all([
        rpt.symbol(),
        rpt.decimals(),
        weth.symbol(),
        weth.decimals(),
        rpt.allowance(address, routerAddr),
        weth.allowance(address, routerAddr),
      ]);

      setContracts({ router, rpt, weth, provider });
      setTokenMeta({
        rpt: { symbol: rptSymbol, decimals: Number(rptDecimals), address: rptAddr },
        weth: { symbol: wethSymbol, decimals: Number(wethDecimals), address: wethAddr },
        router: routerAddr,
      });
      setAllowances({ rpt: rptAllowance, weth: wethAllowance });

      await refreshBalances(provider, rpt, weth, address, Number(rptDecimals), Number(wethDecimals));
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message || "Unable to load swap data.");
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async (provider, rpt, weth, user, rptDecimals, wethDecimals) => {
    try {
      const [ethBal, rptBal, wethBal] = await Promise.all([
        provider.getBalance(user),
        rpt.balanceOf(user),
        weth.balanceOf(user),
      ]);
      setBalances({
        eth: ethers.formatEther(ethBal),
        rpt: ethers.formatUnits(rptBal, rptDecimals),
        weth: ethers.formatUnits(wethBal, wethDecimals),
      });
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message || "Failed to refresh balances.");
    }
  };

  const handleAmountChange = (key, value) => {
    setForms((prev) => ({
      ...prev,
      [key]: { ...prev[key], amountIn: value },
    }));
    quote(key, value);
  };

  const handleMax = (key) => {
    const amount =
      key === "ethToRpt"
        ? balances.eth
        : key === "rptToEth"
        ? balances.rpt
        : key === "wethToRpt"
        ? balances.weth
        : balances.rpt;
    handleAmountChange(key, amount || "0");
  };

  const quote = async (key, value) => {
    if (!contracts.router || !value || Number(value) <= 0) {
      setForms((prev) => ({ ...prev, [key]: { ...prev[key], expectedOut: "" } }));
      return null;
    }

    try {
      let amountIn;
      let path;
      let outDecimals;

      if (key === "ethToRpt") {
        amountIn = ethers.parseEther(value);
        path = [tokenMeta.weth.address, tokenMeta.rpt.address];
        outDecimals = tokenMeta.rpt.decimals;
      } else if (key === "rptToEth") {
        amountIn = ethers.parseUnits(value, tokenMeta.rpt.decimals);
        path = [tokenMeta.rpt.address, tokenMeta.weth.address];
        outDecimals = 18;
      } else {
        amountIn = ethers.parseUnits(value, tokenMeta.weth.decimals);
        path = [tokenMeta.weth.address, tokenMeta.rpt.address];
        outDecimals = tokenMeta.rpt.decimals;
      }

      const amounts = await contracts.router.getAmountsOut(amountIn, path);
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

  const handleAddLiquidity = async () => {
    if (!wallet_address) {
      setError("Connect your wallet first.");
      return;
    }
    if (!contracts.router) return;

    setTxState((prev) => ({ ...prev, addLiquidity: { status: "pending", message: "Awaiting confirmation..." } }));
    try {
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const rptAmount = ethers.parseUnits(forms.addLiquidity.rpt || "0", tokenMeta.rpt.decimals);
      const ethAmount = ethers.parseEther(forms.addLiquidity.eth || "0");

      if (rptAmount <= 0n || ethAmount <= 0n) throw new Error("Enter both ETH and RPT amounts.");

      await ensureAllowance("rpt", rptAmount);

      const minRpt = applySlippage(rptAmount);
      const minEth = applySlippage(ethAmount);

      const tx = await contracts.router.addLiquidityETH(
        tokenMeta.rpt.address,
        rptAmount,
        minRpt,
        minEth,
        wallet_address,
        deadline,
        { value: ethAmount }
      );
      setTxState((prev) => ({ ...prev, addLiquidity: { status: "mining", message: "Supplying liquidity..." } }));
      await tx.wait();

      await refreshBalances(
        contracts.provider,
        contracts.rpt,
        contracts.weth,
        wallet_address,
        tokenMeta.rpt.decimals,
        tokenMeta.weth.decimals
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

  const applySlippage = (amountOut) => {
    const bps = Math.max(0, Math.min(10_000, Math.round(slippage * 100)));
    return amountOut - (amountOut * BigInt(bps)) / 10_000n;
  };

  const ensureAllowance = async (key, amountNeeded) => {
    const tokenContract = key === "rpt" ? contracts.rpt : contracts.weth;
    const currentAllowance = allowances[key] || 0n;
    if (currentAllowance >= amountNeeded) return;

    setTxState((prev) => ({
      ...prev,
      [`${key}To${key === "rpt" ? "Eth" : "Rpt"}`]: { status: "pending", message: "Approving tokens..." },
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

    setTxState((prev) => ({ ...prev, [key]: { status: "pending", message: "Awaiting confirmation..." } }));
    setError("");

    try {
      const deadline = Math.floor(Date.now() / 1000) + 600;

      if (key === "ethToRpt") {
        const ethAmount = ethers.parseEther(forms.ethToRpt.amountIn || "0");
        if (ethAmount <= 0n) throw new Error("Enter an ETH amount.");

        const amounts = await contracts.router.getAmountsOut(ethAmount, [
          tokenMeta.weth.address,
          tokenMeta.rpt.address,
        ]);
        const minOut = applySlippage(amounts[1]);

        const tx = await contracts.router.swapExactETHForTokens(
          minOut,
          [tokenMeta.weth.address, tokenMeta.rpt.address],
          wallet_address,
          deadline,
          { value: ethAmount }
        );
        setTxState((prev) => ({ ...prev, ethToRpt: { status: "mining", message: "Swapping ETH for RPT..." } }));
        await tx.wait();
      } else if (key === "rptToEth") {
        const rptAmount = ethers.parseUnits(forms.rptToEth.amountIn || "0", tokenMeta.rpt.decimals);
        if (rptAmount <= 0n) throw new Error("Enter an RPT amount.");

        await ensureAllowance("rpt", rptAmount);
        const amounts = await contracts.router.getAmountsOut(rptAmount, [
          tokenMeta.rpt.address,
          tokenMeta.weth.address,
        ]);
        const minOut = applySlippage(amounts[1]);

        const tx = await contracts.router.swapExactTokensForETH(
          rptAmount,
          minOut,
          [tokenMeta.rpt.address, tokenMeta.weth.address],
          wallet_address,
          deadline
        );
        setTxState((prev) => ({ ...prev, rptToEth: { status: "mining", message: "Swapping RPT for ETH..." } }));
        await tx.wait();
      } else {
        const wethAmount = ethers.parseUnits(forms.wethToRpt.amountIn || "0", tokenMeta.weth.decimals);
        if (wethAmount <= 0n) throw new Error("Enter a WETH amount.");

        await ensureAllowance("weth", wethAmount);
        const amounts = await contracts.router.getAmountsOut(wethAmount, [
          tokenMeta.weth.address,
          tokenMeta.rpt.address,
        ]);
        const minOut = applySlippage(amounts[1]);

        const tx = await contracts.router.swapExactTokensForTokens(
          wethAmount,
          minOut,
          [tokenMeta.weth.address, tokenMeta.rpt.address],
          wallet_address,
          deadline
        );
        setTxState((prev) => ({ ...prev, wethToRpt: { status: "mining", message: "Buying RPT with WETH..." } }));
        await tx.wait();
      }

      await refreshBalances(
        contracts.provider,
        contracts.rpt,
        contracts.weth,
        wallet_address,
        tokenMeta.rpt.decimals,
        tokenMeta.weth.decimals
      );
      setTxState((prev) => ({ ...prev, [key]: { status: "success", message: "Swap completed." } }));
    } catch (err) {
      console.error(err);
      setTxState((prev) => ({
        ...prev,
        [key]: { status: "error", message: err.shortMessage || err.message || "Swap failed." },
      }));
    }
  };

  const wrapEth = async () => {
    if (!contracts.weth) return;
    try {
      const amount = ethers.parseEther(forms.wethToRpt.amountIn || "0");
      if (amount <= 0n) throw new Error("Enter an ETH amount to wrap.");
      const tx = await contracts.weth.deposit({ value: amount });
      setTxState((prev) => ({ ...prev, wethToRpt: { status: "mining", message: "Wrapping ETH to WETH..." } }));
      await tx.wait();
      await refreshBalances(
        contracts.provider,
        contracts.rpt,
        contracts.weth,
        wallet_address,
        tokenMeta.rpt.decimals,
        tokenMeta.weth.decimals
      );
      setTxState((prev) => ({ ...prev, wethToRpt: { status: "success", message: "Wrapped to WETH." } }));
    } catch (err) {
      console.error(err);
      setTxState((prev) => ({
        ...prev,
        wethToRpt: { status: "error", message: err.shortMessage || err.message || "Wrap failed." },
      }));
    }
  };

  const slippageOptions = useMemo(() => [0.5, 1, 3], []);

  const cards = [
    {
      key: "ethToRpt",
      title: "Swap ETH → RPT",
      icon: ArrowUpRight,
      accent: "from-indigo-500/30 via-indigo-500/10 to-transparent",
      chip: "Direct swap",
      color: "bg-gradient-to-br from-indigo-600 to-blue-500",
      labelIn: "Pay with ETH",
      labelOut: "You receive (RPT)",
      balance: `${formatNumber(balances.eth)} ETH`,
    },
    {
      key: "rptToEth",
      title: "Swap RPT → ETH",
      icon: SwitchCamera,
      accent: "from-amber-400/30 via-amber-400/10 to-transparent",
      chip: "Sell reputation",
      color: "bg-gradient-to-br from-amber-500 to-orange-500",
      labelIn: "Pay with RPT",
      labelOut: "You receive (ETH)",
      balance: `${formatNumber(balances.rpt)} ${tokenMeta.rpt.symbol}`,
    },
    {
      key: "wethToRpt",
      title: "Buy RPT with WETH",
      icon: Droplets,
      accent: "from-emerald-500/30 via-emerald-500/10 to-transparent",
      chip: "For LPs & power users",
      color: "bg-gradient-to-br from-emerald-500 to-teal-500",
      labelIn: "Pay with WETH",
      labelOut: "You receive (RPT)",
      balance: `${formatNumber(balances.weth)} ${tokenMeta.weth.symbol}`,
    },
  ];

  const liquidityStatus = txState.addLiquidity;

  return (
    <div className="relative bg-white dark:bg-slate-950 min-h-[calc(100vh-64px)]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-24 -top-24 w-96 h-96 bg-indigo-300/25 dark:bg-indigo-900/25 blur-[140px]" />
        <div className="absolute right-0 top-32 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-900/20 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 w-72 h-72 bg-blue-200/25 dark:bg-blue-900/15 blur-[140px]" />
      </div>

      <section className="relative container mx-auto px-4 py-14 md:py-18">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              RPT Liquidity Hub
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none">
                <ArrowDownUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Exchange</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
                  Swap ETH, WETH, and RPT with grace
                </h1>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mt-2">
                  Move between native ETH, wrapped ETH, and Reputation Tokens through the protocol&apos;s Uniswap
                  router. Smart defaults, clear slippage, and crisp feedback keep you in control.
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
              <span className="text-slate-500 dark:text-slate-400">ETH</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(balances.eth)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{tokenMeta.weth.symbol}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(balances.weth)}</span>
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
                    <Coins className="w-5 h-5" />
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
                Each swap uses the protocol router set in the Registry. Minimum output honors your slippage guard so you
                never receive less than expected after fees and price impact.
              </p>
            </div>

            {loading ? (
              <div className="p-10 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading swap desk...
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {cards.map(({ key, title, icon: Icon, accent, chip, color, labelIn, labelOut, balance }) => (
                  <div
                    key={key}
                    className="relative p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/85 dark:bg-slate-900/60 overflow-hidden backdrop-blur"
                  >
                    <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${accent}`} />
                    <div className="relative space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg shadow-indigo-200/30 dark:shadow-none`}>
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
                          <DollarSign className="w-4 h-4 text-slate-400" />
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

                      {key === "wethToRpt" && (
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 px-3 py-2 rounded-xl">
                          <span>Need WETH? Wrap your ETH first.</span>
                          <button
                            onClick={wrapEth}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all"
                            type="button"
                          >
                            <Droplets className="w-3 h-3" />
                            Wrap
                          </button>
                        </div>
                      )}

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
                  <span className="text-slate-500 dark:text-slate-400">WETH</span>
                  <span className="font-mono text-xs text-right">{tokenMeta.weth.address}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">RPT</span>
                  <span className="font-mono text-xs text-right">{tokenMeta.rpt.address}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Add liquidity (ETH/RPT)</p>
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
                    <span className="text-xs text-slate-500 dark:text-slate-400">ETH amount</span>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2.5">
                      <input
                        value={forms.addLiquidity.eth}
                        onChange={(e) => setForms((prev) => ({ ...prev, addLiquidity: { ...prev.addLiquidity, eth: e.target.value } }))}
                        placeholder="0.0"
                        className="w-full bg-transparent outline-none text-sm"
                        type="number"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => setForms((prev) => ({ ...prev, addLiquidity: { ...prev.addLiquidity, eth: balances.eth } }))}
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
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/40 dark:shadow-none"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Supply liquidity
                  </button>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Router mints LP tokens to your address. Minimums follow the current slippage setting.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-900/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-200 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Pro tips
                </div>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
                  <li>Keep a little ETH for gas even when swapping into RPT.</li>
                  <li>Use Wrap before WETH trades so approvals succeed.</li>
                  <li>Resync if a transaction completes in another tab.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
