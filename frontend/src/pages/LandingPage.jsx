import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Zap,
  Lock,
  User,
  Mail,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage({ onExploreApp }) {
  const { login, register, seedAndLoginDemo, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState(null); // 'login' | 'register' | null
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [income, setIncome] = useState(35000);
  const [balance, setBalance] = useState(24580);
  const [submitting, setSubmitting] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (authMode === 'login') {
        const ok = await login(email, password);
        if (ok && onExploreApp) onExploreApp();
      } else {
        const ok = await register({
          name,
          email,
          password,
          monthly_income: parseFloat(income || 0),
          income_type: 'Salary',
          expected_income_date: 1,
          current_balance: parseFloat(balance || 0),
        });
        if (ok && onExploreApp) onExploreApp();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoClick = async () => {
    const ok = await seedAndLoginDemo();
    if (ok && onExploreApp) onExploreApp();
  };

  return (
    <div className="min-h-screen bg-iq-darkest text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-glow-indigo">
            IQ
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-white text-xl">BUDGET<span className="text-indigo-400">.IQ</span></span>
            <span className="block text-[10px] tracking-wider uppercase font-semibold text-slate-400">Predictive Intelligence</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAuthMode('login')}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={handleDemoClick}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explore Live Demo</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-20 text-center">
        {/* Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Don't just track your money. Understand where it's going.</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Your money has a pattern. <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            See it before it becomes a problem.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Track your spending, understand your financial velocity, and predict your month-end balance with explainable artificial intelligence.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={handleDemoClick}
            disabled={isLoading}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-glow-indigo transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Demo with Realistic Data</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAuthMode('register')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-bold border border-slate-700/80 transition-all"
          >
            Create Free Account
          </button>
        </div>

        {/* Core Differentiation Quote */}
        <div className="mt-14 max-w-3xl mx-auto p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <p className="text-sm font-medium text-slate-300 italic">
            "Most budgeting apps explain your past. Budget IQ helps you prepare for your future."
          </p>
          <div className="mt-2 text-xs font-bold text-indigo-400 tracking-wider uppercase">
            Track → Understand → Predict → Warn → Improve
          </div>
        </div>

        {/* Interactive Interactive Preview Card */}
        <div className="mt-12 rounded-2xl bg-iq-card border border-iq-border p-6 shadow-2xl text-left max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-iq-border pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-400 font-medium ml-2">Executive Preview • Hemachandran's Dashboard</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              62 / 100 • Moderate Pressure
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Current Balance</span>
              <div className="text-2xl font-black text-white mt-1">₹24,580</div>
              <span className="text-[11px] text-emerald-400 mt-0.5 block">Income: ₹35,000/mo</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Predicted Month-End</span>
              <div className="text-2xl font-black text-indigo-300 mt-1">₹8,420</div>
              <span className="text-[11px] text-indigo-400 mt-0.5 block">Confidence: 82%</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Spending Velocity</span>
              <div className="text-2xl font-black text-rose-400 mt-1">₹720<span className="text-xs font-normal text-slate-400">/day</span></div>
              <span className="text-[11px] text-rose-300 mt-0.5 block">+33% above normal (₹540/day)</span>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3 text-xs text-slate-200">
            <Clock className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-white font-bold">Predictive Notice: </strong>
              "Financial pressure may increase in 8 days because of ₹2,499 in upcoming recurring commitments and elevated food spending."
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Grid Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-iq-border">
        <h2 className="text-xs uppercase font-bold tracking-widest text-indigo-400 text-center mb-3">
          The Architectural Difference
        </h2>
        <h3 className="text-3xl font-extrabold text-white text-center mb-12">
          Why Traditional Expense Trackers Fall Short
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-2">Traditional Expense Trackers</span>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-rose-400">✕</span>
                "What did I spend?" (Purely backward-looking)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400">✕</span>
                "You spent ₹8,000 this month." (No context)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400">✕</span>
                Static charts that break without months of manual tagging
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400">✕</span>
                Surprise cash shortages at the end of the month
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-iq-card border border-indigo-500/30 shadow-glow-indigo">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">Budget IQ Intelligence</span>
            <ul className="space-y-3 text-sm text-white">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                "What am I likely to have left?" (Forward-looking forecast)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                "You are spending 32% more on food than normal." (Behavioral context)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                "Financial pressure may increase in 8 days." (Early warning)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Actionable recommendations that preserve your cash buffer
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {authMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {authMode === 'login' ? 'Sign In to Budget IQ' : 'Create Budget IQ Account'}
              </h3>
              <button
                onClick={() => setAuthMode(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Hemachandran"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {authMode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Monthly Income (₹)</label>
                    <input
                      type="number"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Initial Balance (₹)</label>
                    <input
                      type="number"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-glow-indigo flex items-center justify-center gap-1.5"
              >
                {submitting ? 'Authenticating...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <div className="text-center pt-2">
                {authMode === 'login' ? (
                  <p className="text-xs text-slate-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-indigo-400 hover:underline font-bold"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-indigo-400 hover:underline font-bold"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
