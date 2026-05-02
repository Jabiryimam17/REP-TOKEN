"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PiggyBank,
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  Shield,
  RefreshCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Gauge,
  Sparkles,
} from "lucide-react";
import { ethers } from "ethers";
import { useApp } from "@/context/AppContext";
import { get_contracts, TOKEN_METADATA } from "@/services/compose_contracts.service";
import { get_addresses } from "@/services/system_addresses.service";
import { get_vault_stats, stake_lp, withdraw_lp } from "@/services/reward_vault.service";

const erc20Abi = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
];

export default function RewardVaultPage() {
  const { wallet_address, set_wallet_address } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [network, setNetwork] = useState(null);

  const [vaultContract, setVaultContract] = useState(null);
  const [lpContract, setLpContract] = useState(null);
  const [rptContract, setRptContract] = useState(null);

  const [tokenMeta, setTokenMeta] = useState({
    lp: { symbol: "LP", decimals: 18, address: "" },
    rpt: { symbol: "RPT", decimals: 18, address: "" },
    vault: "",
  });

  const [stats, setStats] = useState({
    lpBalance: "0",
    rptBalance: "0",
    allowance: "0",
    staked: "0",
    pending: "0",
    totalStaked: "0",
    rewardRate: "0",
    accPerShare: "0",
  });

  const [forms, setForms] = useState({
    stake: "",
    withdraw: "",
  });

  const [txState, setTxState] = useState({ status: "idle", message: "" });

  const short = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—");

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    setLoading(true);
    setError("");
    try {
      const { rpt_contract: rpt, reward_vault_contract: vault } = await get_contracts();
      const addr = await rpt.runner.getAddress();
      set_wallet_address(addr);
      
      const provider = rpt.runner.provider;
      if (provider) {
        const net = await provider.getNetwork();
        setNetwork(net);
      }

      const addresses = await get_addresses();
      const lpAddr = addresses.lp_token_address;
      const lp = new ethers.Contract(lpAddr, erc20Abi, rpt.runner);

      setVaultContract(vault);
      setLpContract(lp);
      setRptContract(rpt);
      setTokenMeta({
        lp: { symbol: "LP", decimals: 18, address: lpAddr },
        rpt: { symbol: TOKEN_METADATA.rpt.symbol, decimals: TOKEN_METADATA.rpt.decimals, address: await rpt.getAddress() },
        vault: await vault.getAddress(),
      });

      await refresh(vault, lp, rpt, addr, 18, TOKEN_METADATA.rpt.decimals);
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message || "Failed to load vault data.");
    } finally {
      setLoading(false);
    }
  };

  const computePending = ({ now, lastRewardTime, rewardRate, totalStaked, accRewardPerShare, user }) => {
    const total = BigInt(totalStaked);
    let acc = BigInt(accRewardPerShare);
    if (total > 0n && now > lastRewardTime) {
      const elapsed = BigInt(now - Number(lastRewardTime));
      acc += (elapsed * BigInt(rewardRate) * 1_000_000_000_000n) / total;
    }
    const pending = (BigInt(user.amount) * acc) / 1_000_000_000_000n - BigInt(user.reward_debt);
    return { pending: pending < 0n ? 0n : pending, acc };
  };

  const refresh = async (vault = vaultContract, lp = lpContract, rpt = rptContract, addr = wallet_address, lpDec = tokenMeta.lp.decimals, rptDec = tokenMeta.rpt.decimals) => {
    if (!vault || !lp || !rpt || !addr) return;
    try {
      const {
        lpBal,
        rptBal,
        allowance,
        user,
        totalStaked,
        rewardRate,
        accRewardPerShare,
        lastReward
      } = await get_vault_stats(addr);

      const now = Math.floor(Date.now() / 1000);
      const { pending, acc } = computePending({
        now,
        lastRewardTime: Number(lastReward),
        rewardRate,
        totalStaked,
        accRewardPerShare,
        user,
      });

      setStats({
        lpBalance: ethers.formatUnits(lpBal, lpDec),
        rptBalance: ethers.formatUnits(rptBal, rptDec),
        allowance: allowance.toString(),
        staked: ethers.formatUnits(user.amount, lpDec),
        pending: ethers.formatUnits(pending, rptDec),
        totalStaked: ethers.formatUnits(totalStaked, lpDec),
        rewardRate: ethers.formatUnits(rewardRate, rptDec),
        accPerShare: acc.toString(),
      });
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message || "Failed to refresh stats.");
    }
  };

  const setMessage = (status, message) => setTxState({ status, message });

  const handleStake = async () => {
    if (!vaultContract || !lpContract || !wallet_address) return;
    const amount = forms.stake;
    if (!amount || Number(amount) <= 0) {
      return setMessage("error", "Enter a stake amount > 0.");
    }
    try {
      const parsed = ethers.parseUnits(amount, tokenMeta.lp.decimals);
      setMessage("pending", "Confirm staking in wallet...");
      const tx = await stake_lp(parsed);
      setMessage("mining", "Staking...");
      await tx.wait();
      setMessage("success", "Staked successfully.");
      setForms((f) => ({ ...f, stake: "" }));
      await refresh();
    } catch (err) {
      console.error(err);
      setMessage("error", err.shortMessage || err.message || "Stake failed.");
    }
  };

  const handleWithdraw = async () => {
    if (!vaultContract || !wallet_address) return;
    const amount = forms.withdraw;
    if (!amount || Number(amount) <= 0) {
      return setMessage("error", "Enter a withdraw amount > 0.");
    }
    if (Number(amount) > Number(stats.staked || 0)) {
      return setMessage("error", "Cannot withdraw more than staked.");
    }
    try {
      const parsed = ethers.parseUnits(amount, tokenMeta.lp.decimals);
      setMessage("pending", "Confirm withdrawal in wallet...");
      const tx = await withdraw_lp(parsed);
      setMessage("mining", "Withdrawing...");
      await tx.wait();
      setMessage("success", "Withdrawn successfully.");
      setForms((f) => ({ ...f, withdraw: "" }));
      await refresh();
    } catch (err) {
      console.error(err);
      setMessage("error", err.shortMessage || err.message || "Withdraw failed.");
    }
  };

  const cards = useMemo(
    () => [
      { label: "LP Balance", value: stats.lpBalance, icon: PiggyBank },
      { label: "Staked", value: stats.staked, icon: Shield },
      { label: "Pending RPT", value: stats.pending, icon: Sparkles },
      { label: "Reward Rate /s", value: stats.rewardRate, icon: Gauge },
    ],
    [stats]
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
              <PiggyBank className="w-4 h-4" />
              Reward Vault
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Stake LP, earn RPT
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
              Deposit LP tokens into the vault to accrue reputation token rewards. Withdraw anytime; rewards harvest automatically on each action.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Chain ID: {network?.chainId ?? "—"}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Vault: {short(tokenMeta.vault)}
              </span>
            </div>
          </div>
          <div className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur w-full md:w-80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Status</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {wallet_address ? short(wallet_address) : "Connect wallet"}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              LP allowance updates automatically before staking. Pending rewards compound until you stake or withdraw.
            </p>
            <button
              onClick={() => refresh()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh data
            </button>
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
            Loading vault data...
          </div>
        ) : (
          <>
            <div className="relative z-10 grid md:grid-cols-4 gap-4">
              {cards.map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{Number(value || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative z-10 grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200/30 dark:shadow-none">
                      <ArrowUpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Stake</p>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Deposit LP</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setForms((f) => ({ ...f, stake: stats.lpBalance || "" }))}
                    className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Max
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    value={forms.stake}
                    onChange={(e) => setForms((f) => ({ ...f, stake: e.target.value }))}
                    placeholder="Amount to stake"
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleStake}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Stake {tokenMeta.lp.symbol}
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Allowance auto-approves if needed. Pending rewards are paid out when you stake or withdraw.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-red-500 text-white flex items-center justify-center shadow-lg shadow-amber-200/30 dark:shadow-none">
                      <ArrowDownCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Withdraw</p>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Unstake LP + Rewards</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setForms((f) => ({ ...f, withdraw: stats.staked || "" }))}
                    className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Max
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    value={forms.withdraw}
                    onChange={(e) => setForms((f) => ({ ...f, withdraw: e.target.value }))}
                    placeholder="Amount to withdraw"
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleWithdraw}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    Withdraw
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Withdraw pays out pending RPT first, then returns your LP. Amount must be ≤ your staked balance.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur flex items-center justify-between text-xs md:text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                {txState.status === "pending" && <Loader2 className="w-4 h-4 animate-spin" />}
                {txState.status === "mining" && <Loader2 className="w-4 h-4 animate-spin" />}
                {txState.status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {txState.status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                <span className="font-semibold">{txState.message || "Ready"}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>LP: {short(tokenMeta.lp.address)}</span>
                <span>RPT: {short(tokenMeta.rpt.address)}</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(tokenMeta.vault)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Copy vault address"
                >
                  <Copy className="w-3 h-3" />
                  Copy vault
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
