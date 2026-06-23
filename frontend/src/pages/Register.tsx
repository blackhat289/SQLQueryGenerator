import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastNotifications';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Terminal, CheckCircle, ShieldCheck, Zap } from 'lucide-react';

export const Register: React.FC = () => {
  const { register: signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const passwordVal = watch('password', '');

  const onSubmit = async (data: any) => {
    if (!data.terms) {
      showToast('You must accept the terms of service.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await signup(data.name, data.email, data.password);
      showToast('Account registered successfully! Welcome to Genie.', 'success');
      navigate('/');
    } catch (err: any) {
      const msg = err.displayMessage || 'Sign up failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 grid grid-cols-1 md:grid-cols-12 bg-[#030712] text-left overflow-hidden">
      <div className="hidden md:flex md:col-span-7 lg:col-span-6 relative flex-col justify-between px-10 py-10 border-r border-slate-800 bg-[#05070f] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),transparent_35%)] pointer-events-none" />
        <div className="absolute left-10 top-16 h-24 w-24 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-10 top-40 h-72 w-72 rounded-full bg-[#7c3aed]/10 blur-[100px]" />
        <div className="absolute left-20 bottom-16 h-44 w-44 rounded-full bg-[#a855f7]/10 blur-[100px]" />
        <div className="absolute right-8 bottom-20 h-4 w-4 rounded-full bg-[#d8b4fe]/50" />
        <div className="absolute left-24 top-52 h-3 w-3 rounded-full bg-[#c084fc]/50" />

        <div className="relative z-10 space-y-9 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/10 shadow-sm shadow-violet-500/10">
            <span>✨</span>
            <span>AI-Powered SQL Generation</span>
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Chat with Your Database
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              Describe what you need in natural language and instantly receive optimized SQL queries, schema-aware suggestions, and database insights.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[#0b1220]/90 shadow-[0_40px_120px_-70px_rgba(124,58,237,0.9)] backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f97316] shadow-[0_0_0_6px_rgba(249,115,22,0.14)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#facc15] shadow-[0_0_0_6px_rgba(250,204,21,0.14)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] shadow-[0_0_0_6px_rgba(34,197,94,0.14)]" />
              </div>
              <span className="font-medium text-slate-400">SQL Preview</span>
            </div>
            <div className="px-6 py-6 bg-[#02040c]">
              <div className="rounded-3xl border border-white/10 bg-[#08111f]/95 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                <div className="text-sm text-slate-400 mb-3">User Input</div>
                <div className="rounded-2xl bg-[#090f1e]/95 p-4 text-sm font-medium text-slate-100 leading-7">
                  <span className="text-slate-300">"Show top 10 customers by revenue this year"</span>
                </div>
                <div className="mt-6 text-sm text-slate-400 mb-3">Generated SQL</div>
                <pre className="overflow-x-auto rounded-2xl bg-[#02060f]/95 px-4 py-4 text-sm font-semibold leading-7 text-slate-100">
                  <code className="block whitespace-pre-wrap">
                    <span className="text-[#7c3aed]">SELECT</span> <span className="text-[#f8fafc]">customer_name,</span>
                    <br />
                    <span className="text-[#a855f7]">       SUM</span><span className="text-[#f8fafc]">(revenue) AS total_revenue</span>
                    <br />
                    <span className="text-[#7c3aed]">FROM</span> <span className="text-[#f8fafc]">customers</span>
                    <br />
                    <span className="text-[#7c3aed]">WHERE</span> <span className="text-[#f8fafc]">YEAR(order_date)=2026</span>
                    <br />
                    <span className="text-[#7c3aed]">GROUP BY</span> <span className="text-[#f8fafc]">customer_name</span>
                    <br />
                    <span className="text-[#7c3aed]">ORDER BY</span> <span className="text-[#f8fafc]">total_revenue DESC</span>
                    <br />
                    <span className="text-[#7c3aed]">LIMIT</span> <span className="text-[#f8fafc]">10;</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>

          <div className="grid gap-4 text-sm text-slate-300">
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm">
              <div className="mt-1 rounded-2xl bg-[#7c3aed]/10 p-2 text-[#c4b5fd]"><Zap className="h-4 w-4" /></div>
              <div>
                <h3 className="font-semibold text-white">Instant SQL Generation</h3>
                <p className="text-slate-400">Convert natural language into production-ready SQL.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm">
              <div className="mt-1 rounded-2xl bg-[#a855f7]/10 p-2 text-[#e9d5ff]"><Sparkles className="h-4 w-4" /></div>
              <div>
                <h3 className="font-semibold text-white">AI Query Optimization</h3>
                <p className="text-slate-400">Receive cleaner and faster SQL suggestions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm">
              <div className="mt-1 rounded-2xl bg-[#2563eb]/10 p-2 text-[#bfdbfe]"><ShieldCheck className="h-4 w-4" /></div>
              <div>
                <h3 className="font-semibold text-white">Enterprise Security</h3>
                <p className="text-slate-400">Protected with JWT authentication and secure APIs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-5 lg:col-span-6 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-[#8b5cf6]/10 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-12 left-8 h-64 w-64 rounded-full bg-[#7c3aed]/10 blur-[90px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="relative w-full max-w-[480px] rounded-[32px] border border-white/10 bg-[#0f172a]/95 p-8 shadow-[0_40px_120px_-60px_rgba(124,58,237,0.9)] backdrop-blur-xl"
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.22),transparent_40%)] pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="text-center">
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c4b5fd]">
                SQLGenie
              </div>
              <p className="mt-2 text-2xl font-extrabold text-white">Natural Language → SQL</p>
              <p className="mt-3 text-sm text-slate-400">Continue building smarter queries with AI.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100">
                <CheckCircle className="h-4 w-4 text-[#7c3aed]" />
                Secure Login
              </div>
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100">
                <Sparkles className="h-4 w-4 text-[#a855f7]" />
                AI Powered
              </div>
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100">
                <Terminal className="h-4 w-4 text-[#93c5fd]" />
                Free Tier Available
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="name">
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    id="name"
                    placeholder="Alex Johnson"
                    className={`w-full rounded-2xl border border-white/10 bg-[#020413] px-12 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50 focus:border-[#7c3aed]/60 transition duration-200 ${
                      errors.name ? 'border-rose-500 text-white' : 'border-white/10'
                    }`}
                    {...register('name', {
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                    })}
                    disabled={submitting}
                  />
                </div>
                {errors.name && (
                  <span className="text-[11px] text-rose-500 font-semibold">{errors.name.message}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    id="email"
                    placeholder="name@company.com"
                    className={`w-full rounded-2xl border border-white/10 bg-[#020413] px-12 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50 focus:border-[#7c3aed]/60 transition duration-200 ${
                      errors.email ? 'border-rose-500 text-white' : 'border-white/10'
                    }`}
                    {...register('email', {
                      required: 'Email address is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    disabled={submitting}
                  />
                </div>
                {errors.email && (
                  <span className="text-[11px] text-rose-500 font-semibold">{errors.email.message}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Enter your password"
                    className={`w-full rounded-2xl border border-white/10 bg-[#020413] px-12 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50 focus:border-[#7c3aed]/60 transition duration-200 ${
                      errors.password ? 'border-rose-500 text-white' : 'border-white/10'
                    }`}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordVal && <PasswordStrengthMeter password={passwordVal} />}
                {errors.password && (
                  <span className="text-[11px] text-rose-500 font-semibold">{errors.password.message}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm your password"
                    className={`w-full rounded-2xl border border-white/10 bg-[#020413] px-12 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50 focus:border-[#7c3aed]/60 transition duration-200 ${
                      errors.confirmPassword ? 'border-rose-500 text-white' : 'border-white/10'
                    }`}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === passwordVal || 'Passwords do not match',
                    })}
                    disabled={submitting}
                  />
                </div>
                {errors.confirmPassword && (
                  <span className="text-[11px] text-rose-500 font-semibold">{errors.confirmPassword.message}</span>
                )}
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-white/15 bg-[#020413] text-[#7c3aed] focus:ring-0"
                  {...register('terms', { required: true })}
                />
                <label className="leading-relaxed cursor-pointer">
                  I accept the{' '}
                  <span className="text-[#a855f7] hover:underline font-semibold">Terms of Service</span> and{' '}
                  <span className="text-[#a855f7] hover:underline font-semibold">Privacy Policy</span>.
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#d8b4fe] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_60px_-30px_rgba(124,58,237,0.9)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_80px_-30px_rgba(168,85,247,0.85)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white/80 border-t-transparent" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              <div className="text-center text-xs text-slate-400 pt-4">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[#a855f7] hover:text-[#d8b4fe]">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default Register;
