import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { resolvePublicAssetPath } from '../utils/pwaLogic';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'subtle';
  showFallbackGuide?: boolean;
  onActionComplete?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  showFallbackGuide = false,
  onActionComplete,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const canShowButton = isInstallable || isIOS || showFallbackGuide;
  if (!canShowButton) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      if (onActionComplete) onActionComplete();
      return;
    }
    setShowGuideModal(true);
  };

  const logoSrc = resolvePublicAssetPath('simei-logo.png', import.meta.env.BASE_URL);

  return (
    <>
      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleClick}
          title="Install Aplikasi SIMEI di Perangkat Anda"
          className="flex items-center gap-1.5 rounded-xl border border-sky-500/35 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors shrink-0 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">Install App</span>
        </button>
      )}

      {variant === 'full' && (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-sky-500/40 bg-sky-500/15 text-xs font-semibold text-sky-200 hover:bg-sky-500/25 transition-colors cursor-pointer"
        >
          <Smartphone className="h-4 w-4 text-sky-400 shrink-0" />
          <span>Install Aplikasi SIMEI</span>
        </button>
      )}

      {variant === 'subtle' && (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 py-2.5 text-xs font-semibold text-sky-300 transition-colors cursor-pointer"
        >
          <Download className="h-4 w-4 text-sky-400 shrink-0" />
          <span>Install Aplikasi Mobile (SIMEI)</span>
        </button>
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
                  <img
                    src={logoSrc}
                    alt="Logo SIMEI"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install Aplikasi SIMEI</h3>
                  <p className="text-[11px] text-zinc-400">Akses lebih cepat dari layar utama HP</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Tutup Panduan Install"
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                <p className="font-semibold text-sky-300">Untuk pengguna iPhone / iPad (Safari):</p>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>
                    Ketuk ikon <strong className="inline-flex items-center gap-1 text-white"><Share className="h-3.5 w-3.5 text-sky-400" /> Bagikan (Share)</strong> di bilah bawah/atas Safari.
                  </li>
                  <li>
                    Gulir ke bawah lalu pilih <strong className="text-white">Tambah ke Layar Utama (Add to Home Screen)</strong>.
                  </li>
                  <li>
                    Ketuk <strong className="text-white">Tambah (Add)</strong> di pojok kanan atas.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                <p className="font-semibold text-sky-300">Untuk pengguna Android / Browser Desktop:</p>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>
                    Buka menu browser (ikon <strong className="text-white">⋮</strong> di pojok kanan atas Chrome/Edge).
                  </li>
                  <li>
                    Pilih <strong className="text-white">Tambahkan ke layar utama</strong> atau <strong className="text-white">Install SIMEI</strong>.
                  </li>
                  <li>
                    Aplikasi SIMEI akan muncul sebagai ikon mandiri di layar utama HP Anda.
                  </li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowGuideModal(false);
                if (onActionComplete) onActionComplete();
              }}
              className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
