import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/95 px-3.5 py-2 text-xs font-semibold text-zinc-950 shadow-lg backdrop-blur-sm"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Mode Offline — Data tersimpan lokal tetap aktif</span>
    </div>
  );
};
