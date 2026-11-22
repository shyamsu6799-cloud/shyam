import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  Lock,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { exportBackupData, hashPin } from '../db/indexedDb';
import type { AppSettings, BackupPayload } from '../types/expense';
import { downloadJsonBackup, parseAndValidateBackupFile } from '../utils/exporters';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsBackupViewProps {
  settings: AppSettings;
  expenseCount: number;
  incomeCount: number;
  categoryCount: number;
  onUpdateSettings: (next: AppSettings) => Promise<void>;
  onRestoreBackup: (payload: BackupPayload, mode: 'replace' | 'merge') => Promise<void>;
  onClearAllTransactions: () => Promise<void>;
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  settings,
  expenseCount,
  incomeCount,
  categoryCount,
  onUpdateSettings,
  onRestoreBackup,
  onClearAllTransactions,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [ownerName, setOwnerName] = useState(settings.ownerName || 'Shyam');
  const [pinInput, setPinInput] = useState('');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const showSuccess = (msg: string) => {
    setErrorMsg('');
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({ ...settings, ownerName: ownerName.trim() || 'Shyam' });
    showSuccess('Profile updated.');
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pinInput)) {
      setErrorMsg('Security PIN must be 4 to 6 digits.');
      return;
    }
    const hashed = await hashPin(pinInput);
    await onUpdateSettings({ ...settings, pinHash: hashed });
    setPinInput('');
    showSuccess('4-digit App Lock PIN enabled.');
  };

  const handleRemovePin = async () => {
    const next = { ...settings };
    delete next.pinHash;
    await onUpdateSettings(next);
    showSuccess('App Lock PIN removed.');
  };

  const handleDownloadBackup = async () => {
    try {
      const payload = await exportBackupData();
      downloadJsonBackup(payload);
      showSuccess('Backup JSON downloaded safely.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create backup.');
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    try {
      const text = await file.text();
      const payload = parseAndValidateBackupFile(text);
      await onRestoreBackup(payload, restoreMode);
      showSuccess(
        `Restored ${payload.data.expenses.length} expenses and ${payload.data.incomes.length} income records (${restoreMode} mode).`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Restore failed.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 text-xs font-medium text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Appearance & Owner Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Appearance & Profile
          </h2>

          <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Color Theme
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch between crisp Light Mode and Dark Mode
              </p>
            </div>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium ${
                  settings.theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium ${
                  settings.theme === 'dark'
                    ? 'bg-slate-900 text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="flex items-end gap-3">
            <div className="flex-1">
              <label
                htmlFor="owner-name"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Account Holder Name
              </label>
              <input
                id="owner-name"
                type="text"
                maxLength={50}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="min-h-[42px] px-4 rounded-xl bg-slate-900 dark:bg-teal-600 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-teal-500"
            >
              Save
            </button>
          </form>
        </div>

        {/* Security & App Lock */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Security & App Lock
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All records stay strictly offline inside your device&apos;s encrypted browser IndexedDB. Enable an optional PIN to lock the app on launch.
          </p>

          {settings.pinHash ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
                <span>App Lock PIN is Active</span>
              </div>
              <button
                type="button"
                onClick={handleRemovePin}
                className="min-h-[36px] px-3 rounded-lg border border-red-300 dark:border-red-800 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                Disable PIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleSetPin} className="flex items-end gap-3">
              <div className="flex-1">
                <label
                  htmlFor="new-pin"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Set 4–6 Digit Security PIN
                </label>
                <input
                  id="new-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4 digits"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm font-mono-nums text-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="min-h-[42px] px-4 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold whitespace-nowrap"
              >
                Enable Lock
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Local Database Backup & Restore */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Local Database Backup & Restore
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-nums">
                Stored locally: {expenseCount} expenses · {incomeCount} income · {categoryCount} categories
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Full Backup (.json)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-2">
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Restore Mode
            </span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setRestoreMode('merge')}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-medium ${
                  restoreMode === 'merge'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Merge with existing
              </button>
              <button
                type="button"
                onClick={() => setRestoreMode('replace')}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-medium ${
                  restoreMode === 'replace'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Replace all data
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start md:justify-end gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleRestoreFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Upload className="w-4 h-4" />
              <span>Restore from Backup File</span>
            </button>

            {confirmClear ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    await onClearAllTransactions();
                    setConfirmClear(false);
                    showSuccess('All transactions cleared.');
                  }}
                  className="min-h-[42px] px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  Yes, Reset Data
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="min-h-[42px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 px-4 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Transactions</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Android Mobile PWA & APK Packaging Guide */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Android Mobile Installation & APK Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Install directly as an offline Android App (PWA) or build a signed .APK using Capacitor
              </p>
            </div>
          </div>
          <div className="sm:w-44">
            <PWAInstallButton variant="full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Option 1: Instant Android Install (PWA)
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open SHYAM EXPENSE MANAGER in Chrome on Android.</li>
              <li>Tap the &ldquo;Install App&rdquo; button above or Chrome Menu (⋮) → Install app.</li>
              <li>Runs full-screen offline with automatic IndexedDB persistence.</li>
            </ol>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Option 2: Generate Android APK via Capacitor
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Run <code className="font-mono">npm run build</code> to output <code className="font-mono">dist/</code>.</li>
              <li>Install Capacitor: <code className="font-mono">npx cap init &amp;&amp; npx cap add android</code>.</li>
              <li>Sync &amp; open Android Studio: <code className="font-mono">npx cap sync android &amp;&amp; npx cap open android</code> → Build APK.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
