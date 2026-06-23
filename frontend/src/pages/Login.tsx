import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useInView, Variants } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastNotifications';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { Mail, Lock, Eye, EyeOff, Sparkles, Terminal, ShieldCheck, Zap, CheckCircle } from 'lucide-react';

const featureChips = [
  'Natural Language to SQL',
  'Query Optimization',
  'Explain SQL',
  'Multi Database Support',
  'Secure Execution',
];

const trustMetrics = [
  { value: '10K+', label: 'Queries Generated' },
  { value: '95%', label: 'Query Accuracy' },
  { value: '50+', label: 'SQL Functions Supported' },
  { value: '99.9%', label: 'Uptime' },
];

const demoExamples = [
  {
    prompt: 'Show top 10 customers by revenue',
    sql: `SELECT customer_name,
  SUM(revenue)
FROM customers
GROUP BY customer_name
ORDER BY revenue DESC
LIMIT 10;`,
  },
  {
    prompt: 'Find inactive users',
    sql: `SELECT *
FROM users
WHERE last_login < NOW() - INTERVAL 90 DAY;`,
  },
  {
    prompt: 'Monthly sales report',
    sql: `SELECT month,
  SUM(sales)
FROM orders
GROUP BY month;`,
  },
];

const supportedDatabases = ['MySQL', 'PostgreSQL', 'SQLite', 'MongoDB', 'Oracle', 'SQL Server'];

const testimonials = [
  {
    quote: 'Reduced SQL writing time by 80%.',
    author: 'Data Analyst',
  },
  {
    quote: 'Perfect for learning SQL concepts.',
    author: 'Student',
  },
  {
    quote: 'Generated production-ready queries instantly.',
    author: 'Developer',
  },
];

const workflowSteps = [
  'Describe Requirement',
  'AI Understands Intent',
  'Generates SQL',
  'Optimizes Query',
  'Ready to Execute',
];

const scrollVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const sqlKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'LIMIT', 'INTERVAL', 'NOW', 'SUM', 'AS', 'AND', 'OR'];

const renderSql = (sql: string) =>
  sql.split('\n').map((line, lineIndex) => (
    <div key={`line-${lineIndex}`} className="leading-6">
      {line.split(/(\s+)/g).map((token, tokenIndex) => {
        const trimmed = token.trim().toUpperCase();
        if (sqlKeywords.includes(trimmed)) {
          return (
            <span key={`token-${tokenIndex}`} className="text-[#7c3aed]">
              {token}
            </span>
          );
        }
        if (/^\d+$/.test(trimmed)) {
          return (
            <span key={`token-${tokenIndex}`} className="text-[#a855f7]">
              {token}
            </span>
          );
        }
        return token;
      })}
    </div>
  ));

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthError, setOauthError] = useState('');
  const [capsLock, setCapsLock] = useState(false);
  const [activeDemo, setActiveDemo] = useState(0);
  const [typedPrompt, setTypedPrompt] = useState('');
  const [typedSql, setTypedSql] = useState('');
  const [showSql, setShowSql] = useState(false);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef<HTMLDivElement | null>(null);
  const demosRef = useRef<HTMLDivElement | null>(null);
  const supportRef = useRef<HTMLDivElement | null>(null);
  const testimonialsRef = useRef<HTMLDivElement | null>(null);
  const workflowRef = useRef<HTMLDivElement | null>(null);

  const heroInView = useInView(heroRef, { once: true, margin: '-120px' });
  const cardInView = useInView(cardRef, { once: true, margin: '-120px' });
  const metricsInView = useInView(metricsRef, { once: true, margin: '-120px' });
  const demosInView = useInView(demosRef, { once: true, margin: '-120px' });
  const supportInView = useInView(supportRef, { once: true, margin: '-120px' });
  const testimonialsInView = useInView(testimonialsRef, { once: true, margin: '-120px' });
  const workflowInView = useInView(workflowRef, { once: true, margin: '-120px' });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '', rememberMe: false } });

  const passwordValue = watch('password');

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get('error');
    if (error) {
      setOauthError(error);
      showToast(`OAuth error: ${error}`, 'error');
    }
  }, [location.search, showToast]);

  useEffect(() => {
    const example = demoExamples[activeDemo];
    let promptIndex = 0;
    let sqlIndex = 0;
    const timers: number[] = [];

    setTypedPrompt('');
    setTypedSql('');
    setShowSql(false);

    const typePrompt = () => {
      const nextChar = example.prompt[promptIndex];
      if (nextChar !== undefined) {
        timers.push(
          window.setTimeout(() => {
            setTypedPrompt((value) => value + nextChar);
            promptIndex += 1;
            typePrompt();
          }, 35),
        );
      } else {
        timers.push(
          window.setTimeout(() => {
            setShowSql(true);
            typeSql();
          }, 500),
        );
      }
    };

    const typeSql = () => {
      if (sqlIndex < example.sql.length) {
        timers.push(
          window.setTimeout(() => {
            setTypedSql((value) => value + example.sql[sqlIndex]);
            sqlIndex += 1;
            typeSql();
          }, 22),
        );
      }
    };

    typePrompt();
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [activeDemo]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveDemo((current) => (current + 1) % demoExamples.length);
    }, 9000);
    return () => window.clearInterval(interval);
  }, []);

  const handleCapsCheck = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState('CapsLock'));
  };

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      showToast('Welcome back to Genie!', 'success');
      const redirectPath = (location.state as any)?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      const msg = err.displayMessage || 'Invalid email or password details.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentDemo = demoExamples[activeDemo];
  const safePrompt = typedPrompt.replace(/undefined/g, '');
  const demoPrompt = safePrompt || currentDemo.prompt;
  const demoSql = showSql ? typedSql : '';

  return (
    <div className="relative isolate overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: [0, -18, 0], x: [0, 10, -6, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/4 top-10 h-64 w-64 rounded-full bg-[#7c3aed]/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 12, 0], x: [0, -8, 6, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-10 top-28 h-64 w-64 rounded-full bg-[#0ea5e9]/10 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 10, 0], x: [0, 4, -4, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-6 bottom-20 h-48 w-48 rounded-full bg-[#a855f7]/15 blur-3xl"
        />
        {['SELECT', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'UNION', 'INDEX', 'VIEW', 'TRIGGER'].map((word, index) => (
          <motion.span
            key={word}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.05, 0.18, 0.05] }}
            transition={{ duration: 10 + index * 0.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
            className={`absolute text-[clamp(10px,1.2vw,18px)] font-semibold uppercase tracking-[0.35em] text-slate-300/10`}
            style={{
              top: `${15 + index * 6}%`,
              left: `${10 + (index * 9) % 70}%`,
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>

      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.95fr] lg:gap-8 xl:gap-12">
          <motion.section
            ref={heroRef}
            initial={{ opacity: 0, y: 24 }}
            animate={heroInView ? { opacity: 1, y: 0, transition: { duration: 0.6 } } : { opacity: 0, y: 24 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm shadow-violet-500/10">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#7c3aed]/20 text-[#d8b4fe]">AI</span>
              AI-Powered SQL Generation
            </div>

            <div className="max-w-3xl space-y-6">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Chat with Your Database
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Convert natural language into optimized SQL queries with AI-powered schema awareness, query optimization, and database intelligence.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featureChips.map((chip) => (
                <div key={chip} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 shadow-[0_15px_40px_-30px_rgba(124,58,237,0.8)] transition-all duration-300 hover:-translate-y-1 hover:border-[#7c3aed]/20">
                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7c3aed]/15 text-[#7c3aed]">✓</span>
                  {chip}
                </div>
              ))}
            </div>

            <div ref={demosRef} className="space-y-6 rounded-[32px] border border-white/10 bg-[#07111e]/90 p-5 shadow-[0_25px_80px_-50px_rgba(124,58,237,0.9)] backdrop-blur-xl sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Live SQL demo</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">AI query examples in motion</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
                  <Zap className="h-4 w-4 text-[#a855f7]" />
                  Auto-rotating examples
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.95fr_0.65fr]">
                <div className="rounded-3xl border border-white/10 bg-[#02050d]/95 p-5 shadow-inner shadow-black/20">
                  <div className="mb-4 rounded-3xl border border-white/10 bg-[#0b1220]/95 px-4 py-3 text-sm text-slate-300">
                    <p className="text-slate-400">Prompt</p>
                    <p className="mt-2 font-medium text-white">{demoPrompt}</p>
                  </div>
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#02060f]/95 p-4 text-sm text-slate-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                    <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                      <span>Generated SQL</span>
                      <span className="text-slate-400">AI preview</span>
                    </div>
                    <pre className="max-h-[320px] overflow-y-auto font-mono text-[0.92rem] leading-6 text-slate-100">
                      <code>
                        {renderSql(demoSql || currentDemo.sql)}
                      </code>
                    </pre>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#061025]/95 p-5 shadow-[0_30px_80px_-50px_rgba(59,130,246,0.35)]">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Status</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">AI-assisted generation with grammar-aware completion.</div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Schema-aware suggestions for safe database usage.</div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Optimized for production workflows.</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            ref={cardRef}
            variants={scrollVariant}
            initial="hidden"
            animate={cardInView ? 'visible' : 'hidden'}
            className="lg:sticky lg:top-12"
          >
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_40px_120px_-80px_rgba(124,58,237,0.85)] backdrop-blur-2xl transition-all duration-300 sm:p-8">
              <div className="mb-6 flex items-center gap-3 text-sm text-slate-300">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7c3aed]/10 text-[#c4b5fd]">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">Secure login with premium AI workflows</p>
                  <p className="text-slate-400">Fast authentication for data teams and analysts.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-500" />
                    <input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      className={`w-full rounded-3xl border px-4 py-4 pl-12 text-sm text-white outline-none transition duration-200 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30 ${
                        errors.email ? 'border-rose-500 text-white' : 'border-white/10 bg-[#020413]'
                      }`}
                      {...register('email', {
                        required: 'Please enter your email',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      disabled={submitting}
                    />
                  </div>
                  {errors.email && <p className="mt-2 text-sm text-rose-500">{errors.email.message}</p>}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <label htmlFor="password">Password</label>
                    <span className="text-slate-400">{capsLock ? 'Caps Lock is on' : 'Show password'}</span>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-500" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className={`w-full rounded-3xl border px-4 py-4 pl-12 pr-12 text-sm text-white outline-none transition duration-200 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30 ${
                        errors.password ? 'border-rose-500 text-white' : 'border-white/10 bg-[#020413]'
                      }`}
                      {...register('password', {
                        required: 'Password is required',
                      })}
                      onKeyUp={handleCapsCheck}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-4 top-4 text-slate-500 transition duration-200 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {(passwordValue || errors.password) && <PasswordStrengthMeter password={passwordValue} />}
                  {errors.password && <p className="mt-2 text-sm text-rose-500">{errors.password.message}</p>}
                </div>

                <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/15 bg-[#020413] text-[#7c3aed] focus:ring-0"
                      {...register('rememberMe')}
                    />
                    Remember me
                  </label>
                   <Link to="/forgotpassword" className="font-semibold text-[#a855f7] transition hover:text-[#d8b4fe]">
                    Forgot password?
                  </Link>
                </div>

                 <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-3xl bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#d8b4fe] px-5 py-4 text-sm font-semibold text-white shadow-[0_24px_60px_-30px_rgba(124,58,237,0.9)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_30px_90px_-30px_rgba(168,85,247,0.7)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Signing in...' : 'Sign In to Genie'}
                </button>

                <div className="relative flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-500">
                  <span className="h-px flex-1 bg-slate-700" />
                  or continue with
                  <span className="h-px flex-1 bg-slate-700" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/auth/google';
                    }}
                    className="group flex items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-25px_rgba(66,133,244,0.35)]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/auth/github';
                    }}
                    className="group flex items-center justify-center gap-3 rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-25px_rgba(15,23,42,0.6)]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.024A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.293 2.747-1.024 2.747-1.024.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    GitHub
                  </button>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#020413] px-5 py-4 text-center text-sm text-slate-400">
                  Trusted by developers, students, analysts, and data teams.
                </div>

                <div className="text-center text-xs text-slate-500">
                  Don&apos;t have an account?{' '}
                   <Link to="/register" className="font-semibold text-[#a855f7] hover:text-[#d8b4fe]">
                    Sign up
                  </Link>
                </div>
                {oauthError && (
                  <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-rose-100">
                    OAuth error: {oauthError}
                  </div>
                )}
              </form>
            </div>
          </motion.section>
        </div>

        <motion.section
          ref={metricsRef}
          initial={{ opacity: 0, y: 24 }}
          animate={metricsInView ? { opacity: 1, y: 0, transition: { duration: 0.6 } } : { opacity: 0, y: 24 }}
          className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {trustMetrics.map((metric) => (
            <div key={metric.label} className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center shadow-[0_25px_60px_-45px_rgba(124,58,237,0.9)] transition-all duration-300 hover:border-[#7c3aed]/20 hover:bg-white/10">
              <p className="text-3xl font-semibold text-white">{metric.value}</p>
              <p className="mt-3 text-sm text-slate-300">{metric.label}</p>
            </div>
          ))}
        </motion.section>

        <motion.section
          ref={supportRef}
          initial={{ opacity: 0, y: 24 }}
          animate={supportInView ? { opacity: 1, y: 0, transition: { duration: 0.6 } } : { opacity: 0, y: 24 }}
          className="mt-16 rounded-[32px] border border-white/10 bg-[#07101d]/90 p-6 shadow-[0_40px_120px_-80px_rgba(124,58,237,0.8)] backdrop-blur-xl sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Supported databases</p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Plug into your stack with confidence.</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              <Sparkles className="h-4 w-4 text-[#a855f7]" />
              Monochrome brand-ready cards
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {supportedDatabases.map((db) => (
              <div key={db} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center text-sm font-semibold text-slate-100 shadow-[0_24px_64px_-40px_rgba(59,130,246,0.24)] transition hover:-translate-y-1 hover:border-[#7c3aed]/20">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e293b]/80 text-xl text-[#a5b4fc]">{db[0]}</div>
                {db}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          ref={testimonialsRef}
          initial={{ opacity: 0, y: 24 }}
          animate={testimonialsInView ? { opacity: 1, y: 0, transition: { duration: 0.6 } } : { opacity: 0, y: 24 }}
          className="mt-16"
        >
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Customer love</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Trusted by teams building modern SQL workflows.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {testimonials.map((item) => (
                <div key={item.author} className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_-55px_rgba(124,58,237,0.85)] transition duration-300 hover:-translate-y-1">
                  <div className="mb-4 flex items-center gap-3 text-[#a855f7]">
                    <span className="text-lg">★★★★★</span>
                    <span className="text-sm uppercase tracking-[0.25em] text-slate-400">Real results</span>
                  </div>
                  <p className="text-base leading-7 text-slate-200">“{item.quote}”</p>
                  <p className="mt-4 text-sm font-semibold text-white">— {item.author}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          ref={workflowRef}
          initial={{ opacity: 0, y: 24 }}
          animate={workflowInView ? { opacity: 1, y: 0, transition: { duration: 0.6 } } : { opacity: 0, y: 24 }}
          className="mt-16 rounded-[32px] border border-white/10 bg-[#071017]/90 p-6 text-white shadow-[0_40px_120px_-80px_rgba(124,58,237,0.8)] backdrop-blur-xl sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">How it works</p>
              <h2 className="text-3xl font-semibold sm:text-4xl">Five steps to polished SQL.</h2>
              <p className="max-w-xl text-slate-300">
                SQLGenie turns your requirements into safe, optimized queries and helps you ship with confidence.
              </p>
            </div>
            <div className="grid gap-4">
              {workflowSteps.map((label, index) => (
                <div key={label} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-100 transition duration-300 hover:-translate-y-1 hover:border-[#7c3aed]/20">
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7c3aed]/10 text-[#c4b5fd] font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-lg font-semibold">{label}</p>
                  <div className="mt-3 h-1 w-14 rounded-full bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#d8b4fe] opacity-20 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <footer className="mt-16 border-t border-white/10 py-8 text-slate-400">
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr_1fr] lg:grid-cols-[1.6fr_0.8fr_0.8fr]">
            <div>
              <p className="text-lg font-semibold text-white">SQLGenie</p>
              <p className="mt-3 max-w-md text-sm text-slate-400">
                AI-powered SQL generation for data teams, analysts, and developers who want faster, smarter query workflows.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Resources</p>
              <div className="space-y-2 text-sm">
                <a href="#" className="transition hover:text-white">Features</a>
                <a href="#" className="transition hover:text-white">Documentation</a>
                <a href="#" className="transition hover:text-white">GitHub</a>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Company</p>
              <div className="space-y-2 text-sm">
                <a href="#" className="transition hover:text-white">Privacy Policy</a>
                <a href="#" className="transition hover:text-white">Terms</a>
                <a href="#" className="transition hover:text-white">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Login;
