import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Shield, Coins, Users, Scale, Github, Twitter, Linkedin, Mail } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "REP TOKEN | Decentralized Freelance Marketplace",
  description: "Connect, Work, and Pay with Stablecoins and Reputation Tokens. Decentralized dispute resolution by the community.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen">
            {/* Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">REP TOKEN</span>
                </div>
                
                <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
                  <a href="/jobs" className="hover:text-indigo-600 transition-colors">Find Work</a>
                  <a href="/freelancers" className="hover:text-indigo-600 transition-colors">Find Talent</a>
                  <a href="/disputes" className="hover:text-indigo-600 transition-colors">Transparency</a>
                  <a href="/verifier" className="hover:text-indigo-600 transition-colors">Verifier</a>
                  <a href="/freelancer/dashboard" className="hover:text-indigo-600 transition-colors">Freelancer</a>
                  <a href="/employer" className="hover:text-indigo-600 transition-colors">Employer</a>
                </nav>

                <div className="flex items-center space-x-4">
                  <ThemeToggle />
                  <a href="/login" className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 px-5 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    Login
                  </a>
                  <a href="/register" className="hidden sm:inline-flex items-center justify-center rounded-full bg-slate-900 dark:bg-white px-5 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                    Join Platform
                  </a>
                  <button className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 px-5 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    Connect Wallet
                  </button>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                  <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center space-x-2 mb-4">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      <span className="text-lg font-bold">REP TOKEN</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      The future of freelance work. Powered by blockchain, secured by reputation, and governed by the community.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-4">Platform</h4>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <li><a href="/" className="hover:text-indigo-600">How it Works</a></li>
                      <li><a href="/" className="hover:text-indigo-600">Reputation System</a></li>
                      <li><a href="/" className="hover:text-indigo-600">Fees & Payments</a></li>
                      <li><a href="/" className="hover:text-indigo-600">Dispute Resolution</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold mb-4">Resources</h4>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <li><a href="/" className="hover:text-indigo-600">Documentation</a></li>
                      <li><a href="/" className="hover:text-indigo-600">Help Center</a></li>
                      <li><a href="/" className="hover:text-indigo-600">Security</a></li>
                      <li><a href="/" className="hover:text-indigo-600">Governance</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold mb-4">Community</h4>
                    <div className="flex space-x-4">
                      <a href="/" className="text-slate-400 hover:text-indigo-600"><Twitter className="w-5 h-5" /></a>
                      <a href="/" className="text-slate-400 hover:text-indigo-600"><Github className="w-5 h-5" /></a>
                      <a href="/" className="text-slate-400 hover:text-indigo-600"><Linkedin className="w-5 h-5" /></a>
                      <a href="/" className="text-slate-400 hover:text-indigo-600"><Mail className="w-5 h-5" /></a>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-slate-500 dark:text-slate-400">
                  <p>© 2025 REP TOKEN. All rights reserved.</p>
                  <div className="flex space-x-6">
                    <a href="/" className="hover:text-indigo-600">Privacy Policy</a>
                    <a href="/" className="hover:text-indigo-600">Terms of Service</a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
