import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useToast } from '../components/ToastNotifications';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { Mail, Lock, Key, ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle } from 'lucide-react';

type StepType = 'EMAIL' | 'OTP' | 'RESET' | 'SUCCESS';

export const ForgotPassword: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<StepType>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm({ defaultValues: { email: '' } });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm({ defaultValues: { otp: '' } });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    watch: watchReset,
    formState: { errors: resetErrors },
  } = useForm({ defaultValues: { password: '', confirmPassword: '' } });

  const passwordVal = watchReset('password', '');

  const onEmailSubmit = async (data: { email: string }) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/forgotpassword', { email: data.email });
      if (response.data?.success) {
        setEmail(data.email);
        showToast('Verification code sent to your email.', 'success');
        setStep('OTP');
      }
    } catch (err: any) {
      showToast(err.displayMessage || 'Could not send verification email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (data: { otp: string }) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/verifyotp', { email, otp: data.otp });
      if (response.data?.success) {
        setOtp(data.otp);
        showToast('OTP verified successfully.', 'success');
        setStep('RESET');
      }
    } catch (err: any) {
      showToast(err.displayMessage || 'Incorrect or expired OTP code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/resetpassword', {
        email,
        otp,
        password: data.password,
      });
      if (response.data?.success) {
        showToast('Password reset successful!', 'success');
        setStep('SUCCESS');
      }
    } catch (err: any) {
      showToast(err.displayMessage || 'Password reset failed. Please retry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 grid grid-cols-1 md:grid-cols-12 bg-background text-[#22d3ee] text-left overflow-hidden">
      <div className="hidden md:flex md:col-span-7 lg:col-span-6 relative flex-col justify-between px-10 py-10 border-r border-border bg-card overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),transparent_35%)] pointer-events-none" />
        <div className="absolute left-10 top-16 h-24 w-24 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-10 top-40 h-72 w-72 rounded-full bg-[#7c3aed]/10 blur-[100px]" />
        <div className="absolute left-20 bottom-16 h-44 w-44 rounded-full bg-[#a855f7]/10 blur-[100px]" />
        <div className="absolute right-8 bottom-20 h-4 w-4 rounded-full bg-[#d8b4fe]/50" />
        <div className="absolute left-24 top-52 h-3 w-3 rounded-full bg-[#c084fc]/50" />

        <div className="relative z-10 space-y-9 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/10 shadow-sm shadow-violet-500/10">
            <span>🔐</span>
            <span>Password Recovery</span>
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Recover access and keep generating smart SQL.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              Verify your identity with an email OTP, reset your password securely, and return to SQLGenie instantly.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[#0b1220]/90 shadow-[0_40px_120px_-70px_rgba(124,58,237,0.9)] backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f97316] shadow-[0_0_0_6px_rgba(249,115,22,0.14)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#facc15] shadow-[0_0_0_6px_rgba(250,204,21,0.14)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] shadow-[0_0_0_6px_rgba(34,197,94,0.14)]" />
              </div>
              <span className="font-medium text-slate-400">Recovery Preview</span>
            </div>
            <div className="px-6 py-6 bg-[#02040c]">
              <div className="rounded-3xl border border-white/10 bg-[#08111f]/95 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                <div className="text-sm text-slate-400 mb-3">Recovery experience</div>
                <div className="rounded-2xl bg-[#090f1e]/95 p-4 text-sm font-medium text-slate-100 leading-7">
                  <span className="text-slate-300">Secure OTP verification plus password reset in one smooth flow.</span>
                </div>
                <div className="mt-6 text-sm text-slate-400 mb-3">How it works</div>
                <pre className="overflow-x-auto rounded-2xl bg-[#02060f]/95 px-4 py-4 text-sm font-semibold leading-7 text-slate-100">
                  <code className="block whitespace-pre-wrap">
                    <span className="text-[#7c3aed]">--</span> Verify email ownership
                    <br />
                    <span className="text-[#7c3aed]">--</span> Confirm OTP code
                    <br />
                    <span className="text-[#7c3aed]">--</span> Reset password safely
                  </code>
                </pre>
              </div>
            </div>
          </div>

          <div className="grid gap-4 text-sm text-slate-300">
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm">
              <div className="mt-1 rounded-2xl bg-[#7c3aed]/10 p-2 text-[#c4b5fd]"><Sparkles className="h-4 w-4" /></div>
              <div>
                <h3 className="font-semibold text-white">Guided recovery</h3>
                <p className="text-slate-400">Step-by-step OTP flow keeps account reset simple.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm">
              <div className="mt-1 rounded-2xl bg-[#a855f7]/10 p-2 text-[#e9d5ff]"><Lock className="h-4 w-4" /></div>
              <div>
                <h3 className="font-semibold text-white">Secure by design</h3>
                <p className="text-slate-400">Protected reset requests with OTP and strong password validation.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm">
              <div className="mt-1 rounded-2xl bg-[#2563eb]/10 p-2 text-[#bfdbfe]"><CheckCircle className="h-4 w-4" /></div>
              <div>
                <h3 className="font-semibold text-white">Fast access</h3>
                <p className="text-slate-400">Get back to generating SQL with minimal friction.</p>
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
              <p className="mt-2 text-2xl font-extrabold text-white">Secure Password Recovery</p>
              <p className="mt-3 text-sm text-slate-400">Three easy steps to restore account access.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`rounded-2xl px-3 py-2 text-xs font-semibold text-slate-100 ${step === 'EMAIL' ? 'bg-[#7c3aed]/20 border border-[#7c3aed]/30' : 'bg-white/5'}`}>
                Email
              </div>
              <div className={`rounded-2xl px-3 py-2 text-xs font-semibold text-slate-100 ${step === 'OTP' ? 'bg-[#7c3aed]/20 border border-[#7c3aed]/30' : 'bg-white/5'}`}>
                OTP
              </div>
              <div className={`rounded-2xl px-3 py-2 text-xs font-semibold text-slate-100 ${step === 'RESET' ? 'bg-[#7c3aed]/20 border border-[#7c3aed]/30' : 'bg-white/5'}`}>
                Reset
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 'EMAIL' && (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#7c3aed]/10 text-[#7c3aed]">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Send verification code</h3>
                      <p className="text-sm text-slate-400">Enter the email address linked to your Genie account.</p>
                    </div>
                  </div>

                  <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="reset-email">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input
                          type="email"
                          id="reset-email"
                          placeholder="name@company.com"
                          className={`w-full rounded-2xl border px-12 py-3 text-sm text-[#22d3ee] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#BD2E95]/50 focus:border-[#BD2E95]/60 transition duration-200 ${
                            emailErrors.email ? 'border-rose-500 text-[#22d3ee]' : 'border-border bg-card'
                          }`}
                          {...registerEmail('email', {
                            required: 'Please provide email address',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email address',
                            },
                          })}
                          disabled={loading}
                        />
                      </div>
                      {emailErrors.email && (
                        <span className="text-[11px] text-rose-500 font-semibold">{emailErrors.email.message}</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-2xl bg-[#BD2E95] px-5 py-3 text-sm font-semibold text-[#22d3ee] border border-[#22d3ee] shadow-[0_0_15px_rgba(189,46,149,0.5)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#a3227f] hover:text-[#00e5ff] hover:border-[#00e5ff] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#22d3ee]/80 border-t-transparent" />
                      ) : (
                        'Send Verification Code'
                      )}
                    </button>
                  </form>

                  <div className="text-center text-xs text-slate-400">
                    Remembered your password?{' '}
                    <Link to="/login" className="font-semibold text-[#BD2E95] hover:text-[#d84fa8]">
                      Sign in
                    </Link>
                  </div>
                </motion.div>
              )}

              {step === 'OTP' && (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#7c3aed]/10 text-[#7c3aed]">
                      <Key className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Verify email code</h3>
                      <p className="text-sm text-slate-400">Enter the 6-digit OTP sent to <span className="font-semibold text-white">{email}</span>.</p>
                    </div>
                  </div>

                  <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="otp-code">
                        6-Digit Code
                      </label>
                      <div className="relative">
                        <Key className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          id="otp-code"
                          placeholder="123456"
                          maxLength={6}
                          className={`w-full rounded-2xl border px-12 py-3 text-sm text-[#22d3ee] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#BD2E95]/50 focus:border-[#BD2E95]/60 transition duration-200 tracking-[0.25em] text-center font-mono ${
                            otpErrors.otp ? 'border-rose-500 text-[#22d3ee]' : 'border-border bg-card'
                          }`}
                          {...registerOtp('otp', {
                            required: 'Please enter verification code',
                            pattern: {
                              value: /^\d{6}$/,
                              message: 'OTP must be exactly 6 digits',
                            },
                          })}
                          disabled={loading}
                        />
                      </div>
                      {otpErrors.otp && (
                        <span className="text-[11px] text-rose-500 font-semibold">{otpErrors.otp.message}</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-2xl bg-[#BD2E95] px-5 py-3 text-sm font-semibold text-[#22d3ee] border border-[#22d3ee] shadow-[0_0_15px_rgba(189,46,149,0.5)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#a3227f] hover:text-[#00e5ff] hover:border-[#00e5ff] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#22d3ee]/80 border-t-transparent" />
                      ) : (
                        'Verify Code'
                      )}
                    </button>
                  </form>

                  <div className="flex flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setStep('EMAIL')}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-100 hover:border-[#7c3aed] hover:text-white transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Change Email
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await api.post('/auth/forgotpassword', { email });
                          showToast('New OTP sent to your email.', 'success');
                        } catch (err: any) {
                          showToast(err.displayMessage || 'Resend failed.', 'error');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-100 hover:border-[#7c3aed] hover:text-white transition-colors"
                    >
                      Resend Code
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'RESET' && (
                <motion.div
                  key="reset-step"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#7c3aed]/10 text-[#7c3aed]">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Set a new password</h3>
                      <p className="text-sm text-slate-400">Choose a strong password to secure your SQLGenie account.</p>
                    </div>
                  </div>

                  <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="new-password">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="new-password"
                          placeholder="••••••••"
                          className={`w-full rounded-2xl border px-12 py-3 text-sm text-[#22d3ee] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#BD2E95]/50 focus:border-[#BD2E95]/60 transition duration-200 ${
                            resetErrors.password ? 'border-rose-500 text-[#22d3ee]' : 'border-border bg-card'
                          }`}
                          {...registerReset('password', {
                            required: 'New password is required',
                            minLength: {
                              value: 6,
                              message: 'Password must be at least 6 characters',
                            },
                          })}
                          disabled={loading}
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
                      {resetErrors.password && (
                        <span className="text-[11px] text-rose-500 font-semibold">{resetErrors.password.message}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="confirm-new-password">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input
                          type="password"
                          id="confirm-new-password"
                          placeholder="••••••••"
                          className={`w-full rounded-2xl border px-12 py-3 text-sm text-[#22d3ee] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#BD2E95]/50 focus:border-[#BD2E95]/60 transition duration-200 ${
                            resetErrors.confirmPassword ? 'border-rose-500 text-[#22d3ee]' : 'border-border bg-card'
                          }`}
                          {...registerReset('confirmPassword', {
                            required: 'Please confirm your new password',
                            validate: (value) => value === passwordVal || 'Passwords do not match',
                          })}
                          disabled={loading}
                        />
                      </div>
                      {resetErrors.confirmPassword && (
                        <span className="text-[11px] text-rose-500 font-semibold">{resetErrors.confirmPassword.message}</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-2xl bg-[#BD2E95] px-5 py-3 text-sm font-semibold text-[#22d3ee] border border-[#22d3ee] shadow-[0_0_15px_rgba(189,46,149,0.5)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#a3227f] hover:text-[#00e5ff] hover:border-[#00e5ff] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#22d3ee]/80 border-t-transparent" />
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 'SUCCESS' && (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-4"
                >
                  <div className="bg-emerald-500/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/25">
                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Password reset complete</h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      Your password has been updated. Use your new credentials to sign in and continue building intelligent SQL.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full rounded-2xl bg-[#BD2E95] px-5 py-3 text-sm font-semibold text-[#22d3ee] border border-[#22d3ee] shadow-[0_0_15px_rgba(189,46,149,0.5)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#a3227f] hover:text-[#00e5ff] hover:border-[#00e5ff]"
                  >
                    Go to Login
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
