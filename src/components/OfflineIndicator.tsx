import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="no-print fixed bottom-20 lg:bottom-5 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/90 px-3.5 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 shadow-lg"
    >
      <WifiOff className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" />
      <span>Offline Mode — Local database active</span>
    </div>
  );
};
