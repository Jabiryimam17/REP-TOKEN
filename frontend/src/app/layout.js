import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/Header";
import { Shield, Coins, Users, Scale, Github, Twitter, Linkedin, Mail } from "lucide-react";
import { AppProvider } from "@/context/AppContext";

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
          <AppProvider>
            <div className="flex flex-col min-h-screen">
              {/* Navbar */}
              <Header />

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
                        <li><a href="/jobs" className="hover:text-indigo-600">Find Work</a></li>
                        <li><a href="/freelancers" className="hover:text-indigo-600">Find Talent</a></li>
                        <li><a href="/disputes" className="hover:text-indigo-600">Transparency</a></li>
                        <li><a href="/verifier" className="hover:text-indigo-600">Verifier</a></li>
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
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
