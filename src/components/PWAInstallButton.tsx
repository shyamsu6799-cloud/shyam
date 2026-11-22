import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'full'
            ? 'w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 px-4 py-2.5 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0'
            : 'min-h-[40px] flex items-center gap-2 rounded-lg border border-teal-700/30 dark:border-teal-500/40 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 text-xs font-medium text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors whitespace-nowrap shrink-0'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS || variant === 'full') {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className={
            variant === 'full'
              ? 'w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0'
              : 'min-h-[40px] flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0'
          }
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>{isIOS ? 'Install on iOS' : 'Install Mobile App'}</span>
        </button>

        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Install SHYAM EXPENSE MANAGER
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close install guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {isIOS ? (
                <ol className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal pl-5">
                  <li>Open this app in Safari on your iPhone or iPad.</li>
                  <li>
                    Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                  </li>
                  <li>
                    Scroll down and select <strong>Add to Home Screen</strong>.
                  </li>
                </ol>
              ) : (
                <ol className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal pl-5">
                  <li>Open this URL in Google Chrome on Android or Desktop.</li>
                  <li>
                    Tap the browser menu (<strong>⋮</strong>) and choose{' '}
                    <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </li>
                  <li>It will launch offline like a native app with your local IndexedDB intact.</li>
                </ol>
              )}
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-teal-600 text-white text-sm font-medium hover:bg-slate-800 dark:hover:bg-teal-500 transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
