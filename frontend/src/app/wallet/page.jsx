"use client";

import Link from "next/link";
import {
  Wallet,
  Repeat2,
  Coins,
  Layers,
  PiggyBank,
  ArrowUpRight,
  Send,
} from "lucide-react";

const actions = [
  {
    href: "/wallet/swap",
    title: "Swap",
    description: "Move between ETC and RPT using the stable pool optimized for low slippage.",
    icon: Repeat2,
  },
  {
    href: "/wallet/transfer",
    title: "Transfer",
    description: "Send RPT or EthioCoin directly to other users by their address.",
    icon: Send,
  },
  {
    href: "/wallet/mint-burn",
    title: "Mint / Burn",
    description: "Access mint and burn controls for managing RPT supply.",
    icon: Coins,
  },
  {
    href: "/wallet/reward-vault",
    title: "Reward Vault",
    description: "Stake assets and claim rewards from the vault strategy.",
    icon: PiggyBank,
  },
];

export default function WalletHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-10 space-y-10">
        <header className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-300">
            <Wallet className="w-4 h-4" />
            Wallet Center
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Manage every wallet flow from one place
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Pick a destination below to swap assets, adjust token supply, move through the
              stable pool, or earn via the reward vault.
            </p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {actions.map(({ href, title, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_18px_60px_-38px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_70px_-36px_rgba(79,70,229,0.35)] dark:border-slate-800/80 dark:bg-slate-900/70"
            >
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-indigo-100/40 via-transparent to-slate-100/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:from-indigo-900/20 dark:to-slate-900/10" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-indigo-200/30 dark:bg-white dark:text-slate-900">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
                    <ArrowUpRight className="w-4 h-4 text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-indigo-300" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
