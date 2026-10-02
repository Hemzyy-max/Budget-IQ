import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Flame,
  TrendingUp,
  ShieldCheck,
  Brain,
  ChevronRight,
  Zap,
  Lock,
  User,
  Mail,
  Key,
  Wallet,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register, seedAndLoginDemo, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [income, setIncome] = useState(35000);
  const [balance, setBalance] = useState(24580);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (authMode === 'login') {
        const ok = await login(email, password);
        if (!ok) setError('Invalid email or password. Please try again.');
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setSubmitting(false);
          return;
        }
        const ok = await register({
          name,
          email,
          password,
          monthly_income: parseFloat(income || 0),
          income_type: 'Salary',
          expected_income_date: 1,
          current_balance: parseFloat(balance || 0),
        });
        if (!ok) setError('Registration failed. Email may already be in use.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoClick = async () => {
    setSubmitting(true);
    setError('');
    await seedAndLoginDemo();
    setSubmitting(false);
  };

  const switchMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setError('');
  };

  const features = [
    { icon: Brain, title: 'Predictive Intelligence', desc: 'Know your month-end balance before it happens' },
    { icon: Flame, title: 'Budget Streak Tracking', desc: 'Build financial discipline with daily streaks' },
    { icon: ShieldCheck, title: 'Financial Pressure Alerts', desc: 'Get warned before cash crunches hit' },
    { icon: TrendingUp, title: 'Spending Velocity Analysis', desc: 'Understand how fast your money moves' },
  ];

  return (
    <div className="min-h-screen bg-iq-darkest flex selection:bg-indigo-500 selection:text-white">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[52%] relative overflow-hidden flex-col justify-between p-10 xl:p-14">
        {/* Animated Background Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, #6366F1 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
        </div>

        {/* Top: Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-glow-indigo">
              IQ
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-2xl">BUDGET<span className="text-indigo-400">.IQ</span></span>
              <span className="block text-[10px] tracking-widest uppercase font-semibold text-slate-400">Predictive Financial Intelligence</span>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight max-w-lg">
            Don't just track money.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Understand it.
            </span>
          </h1>
          <p className="mt-5 text-base text-slate-400 max-w-md leading-relaxed">
            Predict your future balance, get warned before cash crunches, and build lasting financial discipline — all powered by intelligent analytics.
          </p>
        </div>

        {/* Middle: Feature Cards */}
        <div className="relative z-10 space-y-3 mt-10">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-indigo-500/30 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600/25 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{f.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom: Quote */}
        <div className="relative z-10 mt-10 p-4 rounded-xl bg-slate-900/30 border border-slate-800/40">
          <p className="text-sm text-slate-300 italic">
            "Most budgeting apps explain your past. Budget IQ helps you prepare for your future."
          </p>
          <div className="mt-2 text-xs font-bold text-indigo-400 tracking-wider uppercase">
            Track → Understand → Predict → Warn → Improve
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-12 relative">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-iq-darkest via-iq-darkest to-indigo-950/20 pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile Brand (shows only on small screens) */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-base shadow-glow-indigo">
              IQ
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-xl">BUDGET<span className="text-indigo-400">.IQ</span></span>
              <span className="block text-[10px] tracking-wider uppercase font-semibold text-slate-400">Predictive Finance</span>
            </div>
          </div>

          {/* Auth Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white">
              {authMode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-slate-400 mt-1.5">
              {authMode === 'login'
                ? 'Sign in to access your predictive financial dashboard'
                : 'Start your journey toward smarter financial decisions'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Hemachandran"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authMode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Monthly Income (₹)</label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Balance (₹)</label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-glow-indigo transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Demo Button */}
          <button
            onClick={handleDemoClick}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 text-slate-200 text-sm font-semibold border border-slate-700/80 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Explore with Realistic Demo Data</span>
          </button>

          {/* Switch Mode */}
          <div className="text-center mt-6">
            <p className="text-sm text-slate-400">
              {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={switchMode}
                className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
              >
                {authMode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {/* Security Badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5" />
            <span>256-bit encrypted • Your data stays private</span>
          </div>
        </div>
      </div>
    </div>
  );
}
