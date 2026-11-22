import React, { useEffect, useState } from 'react';
import { AlertTriangle, Camera, Plus, Trash2, Upload, X } from 'lucide-react';
import { PAYMENT_METHODS } from '../constants/categories';
import type { BudgetConfig, Expense, ExpenseCategory, PaymentMethod } from '../types/expense';
import {
  compressReceiptImage,
  formatINR,
  generateId,
  getCurrentTimeHHMM,
  getTodayISO,
} from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseModalProps {
  isOpen: boolean;
  editingExpense: Expense | null;
  categories: ExpenseCategory[];
  budget: BudgetConfig;
  currentMonthExpenses: number;
  monthCategorySpend: Record<string, number>;
  onClose: () => void;
  onSave: (expense: Expense) => Promise<void>;
  onOpenNewCategory: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  editingExpense,
  categories,
  budget,
  currentMonthExpenses,
  monthCategorySpend,
  onClose,
  onSave,
  onOpenNewCategory,
}) => {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [time, setTime] = useState(getCurrentTimeHHMM());
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingExpense) {
      setAmount(String(editingExpense.amount));
      setCategoryId(editingExpense.categoryId);
      setDate(editingExpense.date);
      setTime(editingExpense.time);
      setDescription(editingExpense.description);
      setPaymentMethod(editingExpense.paymentMethod);
      setReceiptImage(editingExpense.receiptImage);
    } else {
      setAmount('');
      setCategoryId(categories[0]?.id ?? 'cat_grocery');
      setDate(getTodayISO());
      setTime(getCurrentTimeHHMM());
      setDescription('');
      setPaymentMethod('UPI');
      setReceiptImage(undefined);
    }
    setError('');
  }, [isOpen, editingExpense, categories]);

  if (!isOpen) return null;

  const numericAmount = Number(amount);
  const todayMonthPrefix = getTodayISO().slice(0, 7);
  const isCurrentMonthEntry = date.startsWith(todayMonthPrefix);
  const oldAmountSameMonth =
    editingExpense && editingExpense.date.startsWith(todayMonthPrefix) ? editingExpense.amount : 0;

  let budgetWarningText = '';
  if (isCurrentMonthEntry && Number.isFinite(numericAmount) && numericAmount > 0) {
    const projectedMonth = currentMonthExpenses - oldAmountSameMonth + numericAmount;
    if (budget.monthlyLimit > 0 && projectedMonth > budget.monthlyLimit) {
      budgetWarningText = `This entry exceeds your monthly limit (${formatINR(budget.monthlyLimit)}) by ${formatINR(projectedMonth - budget.monthlyLimit)}.`;
    } else {
      const catLimit = budget.categoryLimits[categoryId] ?? 0;
      if (catLimit > 0) {
        const oldCatAmt =
          editingExpense && editingExpense.categoryId === categoryId && editingExpense.date.startsWith(todayMonthPrefix)
            ? editingExpense.amount
            : 0;
        const projectedCat = (monthCategorySpend[categoryId] ?? 0) - oldCatAmt + numericAmount;
        if (projectedCat > catLimit) {
          const catName = categories.find((c) => c.id === categoryId)?.name ?? 'this category';
          budgetWarningText = `This entry exceeds your ${catName} budget (${formatINR(catLimit)}) by ${formatINR(projectedCat - catLimit)}.`;
        }
      }
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError('');
    try {
      const compressed = await compressReceiptImage(file);
      setReceiptImage(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process receipt image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmt = Number(amount);
    if (!Number.isFinite(parsedAmt) || parsedAmt <= 0) {
      setError('Please enter a valid expense amount greater than ₹0.');
      return;
    }
    if (!categoryId) {
      setError('Please select an expense category.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Please choose a valid date.');
      return;
    }

    setSaving(true);
    try {
      const now = Date.now();
      const payload: Expense = {
        id: editingExpense ? editingExpense.id : generateId('exp'),
        amount: Math.round(parsedAmt * 100) / 100,
        categoryId,
        date,
        time: time || getCurrentTimeHHMM(),
        description: description.trim(),
        paymentMethod,
        receiptImage,
        createdAt: editingExpense ? editingExpense.createdAt : now,
        updatedAt: now,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCat = categories.find((c) => c.id === categoryId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {editingExpense ? 'Edit Expense' : 'Add Expense'}
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
              htmlFor="exp-amount"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-500 dark:text-slate-400">
                ₹
              </span>
              <input
                id="exp-amount"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-9 pr-4 text-xl font-bold font-mono-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="exp-category"
                className="text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Expense Category *
              </label>
              <button
                type="button"
                onClick={onOpenNewCategory}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
            </div>
            <div className="relative flex items-center gap-2">
              {selectedCat && (
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white"
                  style={{ backgroundColor: selectedCat.color }}
                >
                  <CategoryIcon name={selectedCat.icon} className="w-5 h-5" />
                </div>
              )}
              <select
                id="exp-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="exp-date"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Date *
              </label>
              <input
                id="exp-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label
                htmlFor="exp-time"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Time
              </label>
              <input
                id="exp-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Payment Method
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const active = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`min-h-[40px] rounded-lg px-2.5 text-xs font-medium border transition-colors whitespace-nowrap truncate ${
                      active
                        ? 'border-teal-700 bg-teal-700 text-white dark:border-teal-500 dark:bg-teal-600'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="exp-desc"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Description / Notes
            </label>
            <input
              id="exp-desc"
              type="text"
              maxLength={140}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Monthly ration, IndianOil fuel, Electricity bill"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Optional Receipt Photo
            </span>
            {receiptImage ? (
              <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-950 flex items-center gap-3">
                <img
                  src={receiptImage}
                  alt="Receipt preview"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Receipt attached
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Compressed & stored in local database
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptImage(undefined)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  aria-label="Remove receipt photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <label className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingImage ? 'Processing...' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <label className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <span>Camera Snap</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {budgetWarningText && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 p-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>{budgetWarningText}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-3 text-xs font-medium text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="flex-1 min-h-[46px] rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
