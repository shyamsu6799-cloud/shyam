import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { hashPin } from '../db/indexedDb';

interface PinLockScreenProps {
  expectedPinHash: string;
  ownerName: string;
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  expectedPinHash,
  ownerName,
  onUnlock,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('Enter your 4-digit security PIN.');
      return;
    }
    setChecking(true);
    setError('');
    try {
      const hashed = await hashPin(pin);
      if (hashed === expectedPinHash) {
        onUnlock();
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
            SHYAM EXPENSE MANAGER
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Locked for {ownerName || 'Owner'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="unlock-pin"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              4-Digit Security PIN
            </label>
            <input
              id="unlock-pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 text-center text-2xl tracking-[0.5em] font-mono-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={checking}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{checking ? 'Verifying...' : 'Unlock Ledger'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
