import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { INCOME_SOURCES, PAYMENT_METHODS } from '../constants/categories';
import type { Income, IncomeSource, PaymentMethod } from '../types/expense';
import { generateId, getCurrentTimeHHMM, getTodayISO } from '../utils/formatters';

interface IncomeModalProps {
  isOpen: boolean;
  editingIncome: Income | null;
  onClose: () => void;
  onSave: (income: Income) => Promise<void>;
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  editingIncome,
  onClose,
  onSave,
}) => {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<IncomeSource>('Salary');
  const [date, setDate] = useState(getTodayISO());
  const [time, setTime] = useState(getCurrentTimeHHMM());
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Net Banking');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingIncome) {
      setAmount(String(editingIncome.amount));
      setSource(editingIncome.source);
      setDate(editingIncome.date);
      setTime(editingIncome.time);
      setDescription(editingIncome.description);
      setPaymentMethod(editingIncome.paymentMethod);
    } else {
      setAmount('');
      setSource('Salary');
      setDate(getTodayISO());
      setTime(getCurrentTimeHHMM());
      setDescription('');
      setPaymentMethod('Net Banking');
    }
    setError('');
  }, [isOpen, editingIncome]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = Number(amount);
    if (!Number.isFinite(parsedAmt) || parsedAmt <= 0) {
      setError('Please enter a valid income amount greater than ₹0.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Please choose a valid date.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const now = Date.now();
      await onSave({
        id: editingIncome ? editingIncome.id : generateId('inc'),
        amount: Math.round(parsedAmt * 100) / 100,
        source,
        date,
        time: time || getCurrentTimeHHMM(),
        description: description.trim(),
        paymentMethod,
        createdAt: editingIncome ? editingIncome.createdAt : now,
        updatedAt: now,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save income.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {editingIncome ? 'Edit Income' : 'Add Income'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
          <div>
            <label
              htmlFor="inc-amount"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Income Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-500">
                ₹
              </span>
              <input
                id="inc-amount"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-9 pr-4 text-xl font-bold font-mono-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="inc-source"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Income Source
              </label>
              <select
                id="inc-source"
                value={source}
                onChange={(e) => setSource(e.target.value as IncomeSource)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="inc-method"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Received Via
              </label>
              <select
                id="inc-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="inc-date"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Date
              </label>
              <input
                id="inc-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label
                htmlFor="inc-time"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Time
              </label>
              <input
                id="inc-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="inc-desc"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Description
            </label>
            <input
              id="inc-desc"
              type="text"
              maxLength={140}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Monthly salary, Client invoice"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-3 text-xs font-medium text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 min-h-[46px] rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingIncome ? 'Update Income' : 'Save Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
