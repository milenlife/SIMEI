import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  FileSpreadsheet,
  Globe,
  Layers,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/endorsement';
import { canManageTalentAccounts } from '../utils/accountLogic';
import { resolvePublicAssetPath } from '../utils/pwaLogic';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentTab: 'dashboard' | 'endorsements' | 'reports' | 'ai-tools';
  onSelectTab: (tab: 'dashboard' | 'endorsements' | 'reports' | 'ai-tools') => void;
  currentUser: UserProfile;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  unreadNotifCount: number;
  onOpenNotifications: () => void;
  onOpenSheetsModal: () => void;
  isSheetsConnected: boolean;
  onOpenTalentManager: () => void;
  onOpenProfileModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onGoogleSignIn,
  onLogout,
  unreadNotifCount,
  onOpenNotifications,
  onOpenSheetsModal,
  isSheetsConnected,
  onOpenTalentManager,
  onOpenProfileModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock background body scroll when mobile drawer is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return {
          label: 'Owner',
          fullLabel: '👑 Owner',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'admin':
        return {
          label: 'Admin',
          fullLabel: '⚡ Admin',
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        };
      case 'talent':
        return {
          label: 'Talent',
          fullLabel: '⭐ Talent',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
    }
  };

  const activeBadge = getRoleBadge(currentUser.role);
  const logoSrc = resolvePublicAssetPath('simei-logo.png', import.meta.env.BASE_URL);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Left Side: Mobile Menu Button (LEFT) + Brand & Logo + Desktop Nav */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Mobile Hamburger Button on the LEFT (Visible on mobile & tablet < lg) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 active:bg-zinc-800 transition-colors shrink-0"
              aria-label="Buka Menu Navigasi"
              title="Buka Menu Navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Brand & Logo */}
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className="flex cursor-pointer items-center gap-2 sm:gap-2.5 text-left transition-transform hover:scale-[1.02] shrink-0"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white p-1 shadow-md shadow-sky-500/15 shrink-0 overflow-hidden">
                <img
                  src={logoSrc}
                  alt="Logo SIMEI"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
                    SIMEI
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 hidden 2xl:block">Sistem Manajemen Endorsement</p>
              </div>
            </button>

            {/* Desktop Navigation Tabs (Visible on lg: 1024px and above) */}
            <nav className="hidden lg:flex items-center gap-1 ml-1 xl:ml-3 shrink-0">
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`flex items-center gap-1.5 xl:gap-2 rounded-lg px-2.5 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm font-medium transition-all shrink-0 ${
                  currentTab === 'dashboard'
                    ? 'bg-zinc-800/90 text-white shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Layers className="h-4 w-4 text-violet-400 shrink-0" />
                <span className="whitespace-nowrap"><span className="hidden xl:inline">Pipeline & </span>Dashboard</span>
              </button>

              <button
                onClick={() => onSelectTab('endorsements')}
                className={`flex items-center gap-1.5 xl:gap-2 rounded-lg px-2.5 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm font-medium transition-all shrink-0 ${
                  currentTab === 'endorsements'
                    ? 'bg-zinc-800/90 text-white shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Users className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="whitespace-nowrap"><span className="hidden xl:inline">Daftar </span>Endorsement</span>
              </button>

              <button
                onClick={() => onSelectTab('reports')}
                className={`flex items-center gap-1.5 xl:gap-2 rounded-lg px-2.5 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm font-medium transition-all shrink-0 ${
                  currentTab === 'reports'
                    ? 'bg-zinc-800/90 text-white shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <TrendingUp className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="whitespace-nowrap"><span className="hidden xl:inline">Laporan </span>Bulanan</span>
              </button>

              <button
                onClick={() => onSelectTab('ai-tools')}
                className={`flex items-center gap-1.5 xl:gap-2 rounded-lg px-2.5 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm font-medium transition-all shrink-0 ${
                  currentTab === 'ai-tools'
                    ? 'bg-violet-950/60 text-violet-200 border border-violet-800/50 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="h-4 w-4 text-pink-400 animate-pulse shrink-0" />
                <span className="whitespace-nowrap">Gemini AI</span>
              </button>
            </nav>
          </div>

          {/* Right side controls: Clean, non-colliding, and perfectly aligned */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
            {/* Google Sheets Sync Button - Owner & Admin only */}
            {currentUser.role !== 'talent' && (
              <button
                onClick={onOpenSheetsModal}
                title="Sinkronisasi Google Sheets"
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors shrink-0"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="hidden 2xl:inline whitespace-nowrap">Google Sheets</span>
                {isSheetsConnected && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            )}

            {/* Talent Account Manager Button - Owner & Admin only */}
            {canManageTalentAccounts(currentUser.role) && (
              <button
                onClick={onOpenTalentManager}
                title="Kelola & Tambah Akun Talent (Tersimpan di Sheet Akun_Talent)"
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors shrink-0"
              >
                <UserPlus className="h-4 w-4 text-violet-400 shrink-0" />
                <span className="hidden 2xl:inline whitespace-nowrap">Akun Talent</span>
              </button>
            )}

            {/* Install App Button (Desktop / Tablet, hidden on < sm to keep 390px header spacious) */}
            <div className="hidden sm:block shrink-0">
              <PWAInstallButton variant="compact" showFallbackGuide />
            </div>

            {/* Notification Button */}
            <button
              onClick={onOpenNotifications}
              className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors shrink-0"
              title="Notifikasi Perubahan Tahapan"
              aria-label="Notifikasi"
            >
              <Bell className="h-4 sm:h-4.5 w-4 sm:w-4.5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm shadow-rose-500/50">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Role Badge (Neat & Compact) */}
            <div
              className={`flex items-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold select-none shrink-0 ${activeBadge.color}`}
              title={`Peran Anda: ${activeBadge.fullLabel} (Terkunci sesuai akun login)`}
            >
              <Shield className="h-3 w-3 shrink-0" />
              <span className="whitespace-nowrap">{activeBadge.fullLabel}</span>
            </div>

            {/* User Profile Button */}
            {currentUser.email ? (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  onClick={onOpenProfileModal}
                  className="flex items-center gap-1.5 p-0.5 sm:p-1 pr-1 sm:pr-2.5 rounded-full border border-zinc-800 bg-zinc-900/90 hover:border-violet-500/60 hover:bg-zinc-800 transition-all text-xs shrink-0"
                  title="Lihat & Edit Profil Saya (Foto, Nama, Alamat, HP)"
                  aria-label="Profil Saya"
                >
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full overflow-hidden bg-violet-600/30 border border-violet-500/40 flex items-center justify-center font-bold text-violet-300 text-xs shrink-0">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>{currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  <span className="hidden xl:inline text-zinc-200 font-medium max-w-[100px] truncate text-left">
                    {currentUser.displayName}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  title="Keluar / Logout"
                  className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-xl transition-colors hidden sm:block shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors shadow-sm shrink-0"
              >
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modern Slide-Over Drawer on the LEFT (Mobile & Tablet) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel Sliding in from the LEFT */}
          <div className="fixed inset-y-0 left-0 w-72 sm:w-80 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 shadow-2xl flex flex-col p-4 sm:p-5 overflow-y-auto animate-in slide-in-from-left duration-200 z-50">
            {/* Drawer Header: Logo + Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  onSelectTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 text-left cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1 shadow-md shadow-sky-500/15 overflow-hidden shrink-0">
                  <img
                    src={logoSrc}
                    alt="Logo SIMEI"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="block text-base font-bold leading-tight text-white">SIMEI</span>
                  <span className="block text-[10px] text-zinc-400">Manajemen Endorsement</span>
                </div>
              </button>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                aria-label="Tutup Menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Profile Card inside Drawer */}
            {currentUser.email && (
              <div className="mt-4 p-3 rounded-2xl border border-zinc-800 bg-zinc-900/70">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-violet-600/30 border border-violet-500/40 flex items-center justify-center font-bold text-violet-300 text-sm shrink-0">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      currentUser.displayName?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{currentUser.displayName}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{currentUser.email}</p>
                    <span
                      className={`inline-block mt-1 rounded-full px-2 py-0.2 text-[9px] font-semibold border ${activeBadge.color}`}
                    >
                      {activeBadge.fullLabel}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfileModal();
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/10 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Lihat & Edit Profil</span>
                </button>
              </div>
            )}

            {/* Navigation links */}
            <div className="mt-5 space-y-1.5 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 pb-1">
                Navigasi Utama
              </p>

              <button
                onClick={() => {
                  onSelectTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                  currentTab === 'dashboard'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white text-left'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Pipeline & Dashboard</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('endorsements');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                  currentTab === 'endorsements'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white text-left'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Daftar Endorsement (10 Tahap)</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('reports');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                  currentTab === 'reports'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white text-left'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Laporan Bulanan & Keuangan</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('ai-tools');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                  currentTab === 'ai-tools'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white text-left'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Gemini AI Studio</span>
              </button>
            </div>

            {/* Quick Tools & Logout at Bottom */}
            <div className="pt-4 mt-4 border-t border-zinc-800/80 flex flex-col gap-2">
              {currentUser.role !== 'talent' && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSheetsModal();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    <span>Google Sheets Sync</span>
                  </span>
                  {isSheetsConnected && (
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                      Terhubung
                    </span>
                  )}
                </button>
              )}

              {canManageTalentAccounts(currentUser.role) && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTalentManager();
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors"
                >
                  <UserPlus className="h-4 w-4 text-violet-400" />
                  <span>Kelola & Tambah Akun Talent</span>
                </button>
              )}

              <PWAInstallButton
                variant="full"
                showFallbackGuide
                onActionComplete={() => setMobileMenuOpen(false)}
              />

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
