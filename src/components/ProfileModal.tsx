import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { UserAccount, UserProfile, UserRole } from '../types/endorsement';
import { updateUserProfile } from '../utils/accountLogic';

interface ProfileModalProps {
  currentUser: UserProfile;
  accounts: UserAccount[];
  onClose: () => void;
  onUpdateProfile: (updatedProfile: UserProfile, updatedAccounts: UserAccount[]) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentUser,
  accounts,
  onClose,
  onUpdateProfile,
}) => {
  // Find current user account from accounts list if available
  const existingAccount = accounts.find(
    (a) => a.email.toLowerCase() === currentUser.email.toLowerCase()
  );

  const [displayName, setDisplayName] = useState(
    existingAccount?.displayName || currentUser.displayName || ''
  );
  const [phone, setPhone] = useState(existingAccount?.phone || currentUser.phone || '');
  const [address, setAddress] = useState(existingAccount?.address || currentUser.address || '');
  const [photoURL, setPhotoURL] = useState(
    existingAccount?.photoURL || currentUser.photoURL || ''
  );
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock background body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Ukuran foto maksimal 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoURL(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    // Strict validation: Only owner of the account can update!
    const result = updateUserProfile(
      currentUser.email,
      currentUser.email,
      {
        displayName,
        phone,
        address,
        photoURL,
      },
      accounts
    );

    if (result.success && result.updatedAccounts) {
      const updatedProfile: UserProfile = {
        ...currentUser,
        displayName: displayName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        photoURL: photoURL.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProfile(updatedProfile, result.updatedAccounts);
      setFeedback({
        type: 'success',
        message: 'Profil dan kontak berhasil diperbarui!',
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'Gagal menyimpan perubahan profil.',
      });
    }
    setIsSubmitting(false);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return {
          label: '👑 Owner (Hak Akses Penuh)',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'admin':
        return {
          label: '⚡ Admin (Manajemen Operasional)',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        };
      case 'talent':
        return {
          label: '⭐ Talent (Akses Proyek Sendiri)',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 sm:px-7 py-4.5 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Profil Pengguna
              </h2>
              <p className="text-xs text-zinc-400">
                Hanya Anda sebagai pemilik akun yang dapat mengedit data ini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-5 sm:p-7 space-y-6 text-xs">
          {feedback && (
            <div
              className={`flex items-center gap-2.5 rounded-xl border p-3.5 ${
                feedback.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
              <div className="relative group shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-2 border-violet-500/40 bg-zinc-900 shadow-md flex items-center justify-center">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      onError={() => setPhotoURL('')}
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-extrabold text-violet-400">
                      {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="avatar-file"
                  className="absolute bottom-0 right-0 p-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg cursor-pointer transition-transform hover:scale-110"
                  title="Upload foto profil"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <input
                    id="avatar-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <span className="font-semibold text-zinc-200 block text-xs">Pilih Foto Profil:</span>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoURL(preset)}
                      className={`h-8 w-8 rounded-lg overflow-hidden border-2 transition-transform hover:scale-105 ${
                        photoURL === preset
                          ? 'border-violet-500 ring-2 ring-violet-500/30'
                          : 'border-zinc-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="preset" className="h-full w-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                    className="px-2.5 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-[11px] text-zinc-300 font-medium"
                  >
                    URL Kustom
                  </button>
                </div>

                {showCustomUrlInput && (
                  <div className="pt-2 flex gap-2">
                    <input
                      type="url"
                      value={customPhotoInput}
                      onChange={(e) => setCustomPhotoInput(e.target.value)}
                      placeholder="https://example.com/foto.jpg"
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPhotoInput) setPhotoURL(customPhotoInput);
                        setShowCustomUrlInput(false);
                      }}
                      className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Pasang
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-zinc-400">
                  Format gambar JPG, PNG, atau WebP (Maks 2MB).
                </p>
              </div>
            </div>

            {/* Account Role & Email (Protected / Read Only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl border border-zinc-800/60 bg-zinc-900/20">
              <div>
                <label className="text-zinc-400 text-[11px] flex items-center gap-1.5 mb-1">
                  <Mail className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Email Akun (Terkunci)</span>
                  <Lock className="h-3 w-3 text-zinc-500 ml-auto" />
                </label>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-zinc-300 font-mono text-[11px] truncate">
                  {currentUser.email || 'user@simei.id'}
                </div>
              </div>

              <div>
                <label className="text-zinc-400 text-[11px] flex items-center gap-1.5 mb-1">
                  <Shield className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Hak Akses / Peran</span>
                  <Lock className="h-3 w-3 text-zinc-500 ml-auto" />
                </label>
                <div
                  className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold flex items-center ${roleInfo.bg}`}
                >
                  {roleInfo.label}
                </div>
              </div>
            </div>

            {/* Editable Fields: Nama, Nomor HP, Alamat */}
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-zinc-200 block mb-1">
                  Nama Lengkap <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nama Lengkap Anda"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-zinc-200 block mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-zinc-200 block mb-1">
                    Kota / Wilayah Domisili
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Jakarta Selatan, DKI Jakarta"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800/80 px-5 sm:px-7 py-4 bg-zinc-900/60">
          <p className="text-[11px] text-zinc-400 text-center sm:text-left">
            Perubahan profil tersimpan otomatis pada data sesi dan akun Anda.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="profile-form"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>Simpan Profil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
