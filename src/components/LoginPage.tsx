import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { UserAccount, UserProfile } from '../types/endorsement';
import { authenticateUser, changeAccountPassword } from '../utils/accountLogic';
import { resolvePublicAssetPath } from '../utils/pwaLogic';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginPageProps {
  accounts: UserAccount[];
  onLoginSuccess: (userProfile: UserProfile) => void;
  onUpdateAccounts: (updatedAccounts: UserAccount[]) => void;
  onGoogleSignIn: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  accounts,
  onLoginSuccess,
  onUpdateAccounts,
  onGoogleSignIn,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Change Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(
    null
  );

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = authenticateUser(email, password, accounts);
    if (result.success && result.account) {
      onLoginSuccess({
        uid: result.account.id,
        email: result.account.email,
        displayName: result.account.displayName,
        role: result.account.role,
        category: result.account.category,
        phone: result.account.phone,
        address: result.account.address,
        photoURL: result.account.photoURL,
      });
    } else {
      setErrorMessage(result.message || 'Login gagal.');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);

    if (newPassword !== confirmPassword) {
      setResetStatus({ type: 'error', msg: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    const res = changeAccountPassword(resetEmail, newPassword, accounts);
    if (res.success && res.updatedAccounts) {
      onUpdateAccounts(res.updatedAccounts);
      setResetStatus({ type: 'success', msg: 'Password berhasil diperbarui! Silakan login.' });
      setTimeout(() => {
        setIsResetModalOpen(false);
        setPassword(newPassword);
        setEmail(resetEmail);
      }, 1500);
    } else {
      setResetStatus({ type: 'error', msg: res.message || 'Gagal mengubah password.' });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 font-sans selection:bg-violet-500/30 selection:text-violet-200 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-pink-600/15 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-xl shadow-sky-500/20 ring-1 ring-white/20">
            <img
              src={resolvePublicAssetPath('simei-logo.png', import.meta.env.BASE_URL)}
              alt="Logo SIMEI"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            SIMEI
          </h1>
          <p className="text-xs text-zinc-400">
            Sistem Manajemen Endorsement Influencer & Brand (10 Tahapan)
          </p>
        </div>

        {/* Main Login Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Masuk ke Akun Anda</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Silakan masukkan email dan password akun Anda untuk melanjutkan
            </p>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            {/* Email Field */}
            <div>
              <label className="font-semibold text-zinc-300 block mb-1.5">Email Pengguna</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@simei.id atau creator.id"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-zinc-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(true);
                    setResetEmail(email);
                    setResetStatus(null);
                  }}
                  className="text-[11px] font-medium text-violet-400 hover:text-violet-300 hover:underline"
                >
                  Ganti Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-10 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 py-3 font-bold text-white shadow-lg shadow-violet-600/30 hover:opacity-95 transition-all text-xs cursor-pointer"
            >
              <span>Masuk Sekarang</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-zinc-800" />
            <span className="bg-zinc-900 px-3 text-[11px] text-zinc-500 uppercase tracking-wider">
              Atau
            </span>
          </div>

          {/* Google Sign-in Official Button */}
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-200 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>Masuk dengan Akun Google (Workspace & Sheets)</span>
          </button>

          {/* Mobile App (PWA) Install Option */}
          <PWAInstallButton variant="subtle" showFallbackGuide />
        </div>
      </div>

      {/* Change Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-violet-400" />
                  Ganti Password Akun
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Perbarui kata sandi untuk akun login Anda
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetStatus && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
                  resetStatus.type === 'success'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                {resetStatus.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{resetStatus.msg}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Email Akun Terdaftar *</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Contoh: clarissa@creator.id"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Password Baru *</label>
                <input
                  type="password"
                  required
                  minLength={5}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 5 karakter"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300 block mb-1">
                  Ulangi Password Baru *
                </label>
                <input
                  type="password"
                  required
                  minLength={5}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-zinc-300 hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 font-bold text-white shadow-md shadow-violet-600/30"
                >
                  Simpan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
