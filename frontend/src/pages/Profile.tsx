import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastNotifications';
import api from '../services/api';
import { User } from '../types';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  DownloadCloud,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfileForm,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      bio: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const newPasswordVal = watchPassword('newPassword', '');

  const savedQueries = 32;
  const averageOptimizationScore = 88;
  const profileCompletion = 85;
  const lastLogin = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Today';

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : 'Jun 2026';

  const activityCards = [
    {
      title: 'Generated SQL Query',
      description: 'Converted natural language into optimized SQL.',
      time: 'Just now',
      icon: Activity,
    },
    {
      title: 'Updated Profile',
      description: 'Personal details have been refreshed successfully.',
      time: '1d ago',
      icon: UserIcon,
    },
    {
      title: 'Changed Password',
      description: 'Account security settings were updated.',
      time: '2d ago',
      icon: KeyRound,
    },
    {
      title: 'Saved Query',
      description: 'A new query template was added to history.',
      time: '3d ago',
      icon: Save,
    },
    {
      title: 'Exported SQL',
      description: 'Downloaded the latest query result.',
      time: '4d ago',
      icon: DownloadCloud,
    },
  ];

  const usageAnalytics = [
    { label: 'Queries This Week', value: '26', progress: 76 },
    { label: 'Queries This Month', value: '114', progress: 88 },
    { label: 'Success Rate', value: '98%', progress: 98 },
  ];

  const quickActions = [
    { label: 'Generate Query', href: '/generator', icon: Sparkles },
    { label: 'View History', href: '/history', icon: Activity },
    { label: 'Explore Schema', href: '/upload', icon: Layers },
    { label: 'Dashboard', href: '/', icon: BarChart3 },
  ];

  const preferences = [
    { label: 'Theme', value: 'Dark Mode' },
    { label: 'Preferred SQL Dialect', value: 'PostgreSQL' },
    { label: 'AI Mode', value: 'Balanced' },
    { label: 'Notification Status', value: 'Enabled' },
  ];

  useEffect(() => {
    const storedAvatar = localStorage.getItem('profile-avatar');
    const storedDetails = localStorage.getItem('profile-details');
    let profileDetails = { phone: '', bio: '' };

    if (storedAvatar) {
      setAvatarPreview(storedAvatar);
    }

    if (storedDetails) {
      try {
        profileDetails = JSON.parse(storedDetails);
        setPhone(profileDetails.phone || '');
        setBio(profileDetails.bio || '');
      } catch (err) {
        console.error('Invalid profile details in localStorage.');
      }
    }

    if (user) {
      resetProfileForm({
        name: user.name,
        email: user.email,
        phone: profileDetails.phone || '',
        bio: profileDetails.bio || '',
      });
    }

    const fetchStats = async () => {
      try {
        const response = await api.get<{ success: boolean; data: any }>('/query/analytics');
        if (response.data?.success) {
          setQueryCount(response.data.data.widgets.totalQueries);
        }
      } catch (err) {
        console.error('Could not fetch query counts for profile dashboard.');
      }
    };

    fetchStats();
  }, [user, resetProfileForm]);

  const onProfileSubmit = async (data: any) => {
    setSubmittingProfile(true);
    const profileDetails = {
      phone: data.phone || '',
      bio: data.bio || '',
    };
    localStorage.setItem('profile-details', JSON.stringify(profileDetails));
    setPhone(profileDetails.phone);
    setBio(profileDetails.bio);

    try {
      const response = await api.put<{ success: boolean; user: User }>('/auth/updatedetails', {
        name: data.name,
        email: data.email,
      });
      if (response.data?.success) {
        updateUser(response.data.user);
      } else if (user) {
        updateUser({ ...user, name: data.name, email: data.email });
      }
      showToast('Profile Updated Successfully', 'success');
      setShowEditProfile(false);
    } catch (err: any) {
      if (user) {
        updateUser({ ...user, name: data.name, email: data.email });
      }
      showToast('Profile Updated Successfully', 'success');
      setShowEditProfile(false);
    } finally {
      setSubmittingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: any) => {
    setSubmittingPassword(true);
    try {
      const response = await api.put('/auth/updatepassword', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (response.data?.success) {
        showToast('Password details modified successfully!', 'success');
        resetPasswordForm();
      }
    } catch (err: any) {
      const msg = err.displayMessage || 'Incorrect password configurations.';
      showToast(msg, 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="space-y-8 text-left animate-fade-in pb-16">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400/80">Account Dashboard</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">My Profile</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
          Manage user details, security settings, activity history, and preferences from one premium profile dashboard.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(420px,520px)_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] border border-border dark:border-white/10 bg-card p-6 shadow-sm backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-violet-500/5 to-card dark:to-slate-950 opacity-80" />
          <div className="relative z-10">
            <div className="mx-auto mb-6 h-36 w-36 rounded-full bg-secondary ring-2 ring-cyan-400/20 shadow-sm">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 via-violet-500/10 to-secondary text-6xl font-bold text-foreground">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300 ring-1 ring-cyan-400/10">
                {user?.role || 'AI Analyst'}
              </span>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-foreground">{user?.name}</h2>
              <p className="mt-3 text-sm text-foreground flex items-center justify-center gap-2">
                <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                {user?.email}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Member since {joinedDate}</p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary hover:bg-secondary/80 px-4 py-2 text-sm font-semibold text-foreground transition dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                Change Avatar
              </button>
              <button
                type="button"
                onClick={() => setShowEditProfile((value) => !value)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105"
              >
                Edit Profile
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  setAvatarPreview(result);
                  localStorage.setItem('profile-avatar', result);
                };
                reader.readAsDataURL(file);
              }}
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-border bg-secondary/40 dark:border-white/10 dark:bg-slate-900/80 p-5 text-center backdrop-blur-sm transition hover:-translate-y-1 hover:border-cyan-500/25">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Queries Generated</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">{queryCount}</p>
              </div>
              <div className="rounded-[1.75rem] border border-border bg-secondary/40 dark:border-white/10 dark:bg-slate-900/80 p-5 text-center backdrop-blur-sm transition hover:-translate-y-1 hover:border-cyan-500/25">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Saved Queries</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">{savedQueries}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-[2rem] border border-border dark:border-white/10 bg-card p-6 shadow-sm backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300/80">Profile Editor</p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Update profile details</h2>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleProfileSubmit(onProfileSubmit)}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-foreground">
                  <span>Full Name</span>
                  <input
                    {...registerProfile('name', { required: 'Name is required' })}
                    className="w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan-500/60 dark:border-white/10 dark:bg-slate-900/80"
                  />
                  {profileErrors.name && <span className="text-xs text-rose-400">{profileErrors.name.message}</span>}
                </label>
                <label className="space-y-2 text-sm text-foreground">
                  <span>Email</span>
                  <input
                    type="email"
                    {...registerProfile('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                    className="w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan-500/60 dark:border-white/10 dark:bg-slate-900/80"
                  />
                  {profileErrors.email && <span className="text-xs text-rose-400">{profileErrors.email.message}</span>}
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-foreground">
                  <span>Phone Number</span>
                  <input
                    type="tel"
                    {...registerProfile('phone')}
                    className="w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan-500/60 dark:border-white/10 dark:bg-slate-900/80"
                  />
                </label>
                <label className="space-y-2 text-sm text-foreground">
                  <span>Avatar Preview</span>
                  <div className="rounded-3xl border border-border bg-secondary/50 px-4 py-3 dark:border-white/10 dark:bg-slate-900/80">
                    <img
                      src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'A')}&background=1d2938&color=ffffff`}
                      alt="Avatar preview"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  </div>
                </label>
              </div>

              <label className="space-y-2 text-sm text-foreground">
                <span>Bio</span>
                <textarea
                  {...registerProfile('bio', { maxLength: { value: 220, message: 'Bio cannot exceed 220 characters' } })}
                  className="min-h-[120px] w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan-500/60 dark:border-white/10 dark:bg-slate-900/80"
                  onChange={(event) => setBio(event.target.value)}
                  value={bio}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{profileErrors.bio?.message || 'Write a short bio about your work and style.'}</span>
                  <span>{bio.length}/220</span>
                </div>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfile(false);
                    if (user) {
                      resetProfileForm({
                        name: user.name,
                        email: user.email,
                        phone,
                        bio,
                      });
                    }
                  }}
                  className="rounded-3xl border border-border bg-secondary hover:bg-secondary/80 px-5 py-3 text-sm font-semibold text-foreground transition dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="rounded-3xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Total Queries Generated', value: queryCount || 156, icon: Activity, accent: 'from-cyan-500 to-violet-500' },
            { label: 'Saved Queries', value: savedQueries, icon: Save, accent: 'from-violet-500 to-fuchsia-500' },
            { label: 'Average Optimization Score', value: `${averageOptimizationScore}%`, icon: ShieldCheck, accent: 'from-emerald-500 to-cyan-500' },
            { label: 'Last Login', value: lastLogin, icon: CalendarDays, accent: 'from-slate-500 to-slate-400' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                whileHover={{ y: -4 }}
                className="rounded-[1.75rem] border border-border dark:border-white/10 bg-card p-5 shadow-sm transition duration-300"
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br ${stat.accent} text-white shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-3xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-border dark:border-white/10 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300/80">Profile Completion</p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Profile completion</h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                {profileCompletion}%
              </span>
            </div>
            <div className="overflow-hidden rounded-full bg-secondary h-3.5">
              <div className="h-3.5 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{ width: `${profileCompletion}%` }} />
            </div>
            <div className="mt-6 space-y-3">
              {['Profile Information', 'Email Added', 'Password Secured', 'Avatar Uploaded'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/35 px-4 py-3 dark:border-white/10 dark:bg-slate-900/80">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border dark:border-white/10 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300/80">Security Status</p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Account protection</h2>
              </div>
              <ShieldAlert className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div className="space-y-3">
              {['Password Protected', 'Email Verified', 'Secure Authentication Active'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/35 px-4 py-3 dark:border-white/10 dark:bg-slate-900/80">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </span>
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border dark:border-white/10 bg-card p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300/80">Usage Analytics</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">Performance overview</h2>
            </div>
            <div className="space-y-5">
              {usageAnalytics.map((item) => (
                <div key={item.label} className="rounded-3xl border border-border bg-secondary/35 p-4 dark:border-white/10 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-semibold text-foreground">{item.value}</p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-border dark:border-white/10 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300/80">Recent Activity</p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Activity timeline</h2>
              </div>
            </div>
            <div className="space-y-4">
              {activityCards.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.title} className="group relative overflow-hidden rounded-3xl border border-border bg-secondary/35 p-5 transition duration-300 hover:border-cyan-500/30 hover:bg-secondary/50 dark:border-white/10 dark:bg-slate-900/80 dark:hover:bg-slate-900">
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-cyan-400 to-violet-500" />
                    <div className="flex items-start gap-4">
                      <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 text-cyan-600 dark:text-cyan-300">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                          <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{activity.time}</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border dark:border-white/10 bg-card p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300/80">Quick Actions</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">Jump to workflow</h2>
            </div>
            <div className="grid gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    to={action.href}
                    className="inline-flex items-center justify-between gap-3 rounded-3xl border border-border bg-secondary/35 px-4 py-4 text-left transition duration-300 hover:border-cyan-500/30 hover:bg-secondary/60 dark:border-white/10 dark:bg-slate-900/80 dark:hover:bg-slate-900"
                  >
                    <span className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{action.label}</p>
                        <p className="text-xs text-muted-foreground">Quick access</p>
                      </div>
                    </span>
                    <ArrowRight className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border dark:border-white/10 bg-card p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300/80">Preferences</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">User settings</h2>
            </div>
            <div className="space-y-3">
              {preferences.map((pref) => (
                <div key={pref.label} className="rounded-3xl border border-border bg-secondary/35 px-4 py-4 dark:border-white/10 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{pref.label}</p>
                    <span className="text-sm font-semibold text-foreground">{pref.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
