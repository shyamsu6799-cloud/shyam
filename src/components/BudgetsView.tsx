import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type { BudgetConfig, Expense, ExpenseCategory } from '../types/expense';
import { formatINR, getTodayISO } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface BudgetsViewProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  budget: BudgetConfig;
  onSaveBudget: (budget: BudgetConfig) => Promise<void>;
  onOpenNewCategory: () => void;
  onEditCategory: (category: ExpenseCategory) => void;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  expenses,
  categories,
  budget,
  onSaveBudget,
  onOpenNewCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [monthlyLimit, setMonthlyLimit] = useState(
    budget.monthlyLimit > 0 ? String(budget.monthlyLimit) : ''
  );
  const [thresholdPct, setThresholdPct] = useState(String(budget.warningThresholdPct || 80));
  const [catLimits, setCatLimits] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(budget.categoryLimits || {})) {
      if (v > 0) out[k] = String(v);
    }
    return out;
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);

  useEffect(() => {
    setMonthlyLimit(budget.monthlyLimit > 0 ? String(budget.monthlyLimit) : '');
    setThresholdPct(String(budget.warningThresholdPct || 80));
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(budget.categoryLimits || {})) {
      if (v > 0) out[k] = String(v);
    }
    setCatLimits(out);
  }, [budget]);

  const currentMonthPrefix = getTodayISO().slice(0, 7);
  const { monthSpentTotal, monthSpentByCat } = useMemo(() => {
    let total = 0;
    const byCat: Record<string, number> = {};
    for (const e of expenses) {
      if (e.date.startsWith(currentMonthPrefix)) {
        total += e.amount;
        byCat[e.categoryId] = (byCat[e.categoryId] ?? 0) + e.amount;
      }
    }
    return { monthSpentTotal: total, monthSpentByCat: byCat };
  }, [expenses, currentMonthPrefix]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      const parsedMonthly = Math.max(0, Number(monthlyLimit) || 0);
      const parsedThresh = Math.min(99, Math.max(50, Number(thresholdPct) || 80));
      const cleanCatLimits: Record<string, number> = {};
      for (const [catId, raw] of Object.entries(catLimits)) {
        const val = Number(raw);
        if (Number.isFinite(val) && val > 0) {
          cleanCatLimits[catId] = val;
        }
      }

      await onSaveBudget({
        id: 'default',
        monthlyLimit: parsedMonthly,
        warningThresholdPct: parsedThresh,
        categoryLimits: cleanCatLimits,
        updatedAt: Date.now(),
      });
      setSavedMsg('Budgets saved to local database.');
      setTimeout(() => setSavedMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const activeMonthlyLimit = Number(monthlyLimit) || 0;
  const activeRemaining = activeMonthlyLimit > 0 ? activeMonthlyLimit - monthSpentTotal : 0;
  const activeUsedPct = activeMonthlyLimit > 0 ? (monthSpentTotal / activeMonthlyLimit) * 100 : 0;
  const warnAt = Number(thresholdPct) || 80;

  return (
    <div className="space-y-6">
      {/* Monthly Spending Limit & Budget Warning Card */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Monthly Spending Limit & Alerts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set an overall monthly budget and receive automatic warnings before overspending
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Budgets'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="monthly-limit-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Monthly Budget Limit (₹)
            </label>
            <input
              id="monthly-limit-input"
              type="number"
              min="0"
              step="100"
              placeholder="e.g., 25000"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-bold font-mono-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label
              htmlFor="warn-threshold"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Budget Warning Alert Threshold
            </label>
            <select
              id="warn-threshold"
              value={thresholdPct}
              onChange={(e) => setThresholdPct(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="70">Warn at 70% spent</option>
              <option value="80">Warn at 80% spent</option>
              <option value="90">Warn at 90% spent</option>
            </select>
          </div>
        </div>

        {activeMonthlyLimit > 0 && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300 font-mono-nums">
                This Month Spent: <strong>{formatINR(monthSpentTotal)}</strong> /{' '}
                {formatINR(activeMonthlyLimit)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 font-semibold font-mono-nums ${
                  activeRemaining < 0
                    ? 'text-red-600 dark:text-red-400'
                    : activeUsedPct >= warnAt
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {activeRemaining < 0 ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Exceeded by {formatINR(Math.abs(activeRemaining))}</span>
                  </>
                ) : activeUsedPct >= warnAt ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Warning: {formatINR(activeRemaining)} left</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>On track: {formatINR(activeRemaining)} remaining</span>
                  </>
                )}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  activeRemaining < 0
                    ? 'bg-red-600'
                    : activeUsedPct >= warnAt
                    ? 'bg-amber-500'
                    : 'bg-teal-600'
                }`}
                style={{ width: `${Math.min(100, activeUsedPct)}%` }}
              />
            </div>
          </div>
        )}

        {/* Category-Wise Budgets */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
            Category-Wise Monthly Budgets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const spent = monthSpentByCat[cat.id] ?? 0;
              const limit = Number(catLimits[cat.id]) || 0;
              const pct = limit > 0 ? (spent / limit) * 100 : 0;
              const isOver = limit > 0 && spent > limit;
              const isWarn = limit > 0 && !isOver && pct >= warnAt;

              return (
                <div
                  key={cat.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {cat.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-nums">
                          Spent: {formatINR(spent)}
                        </p>
                      </div>
                    </div>

                    <div className="w-32 shrink-0">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="Limit ₹"
                        aria-label={`${cat.name} monthly limit`}
                        value={catLimits[cat.id] ?? ''}
                        onChange={(e) =>
                          setCatLimits((prev) => ({ ...prev, [cat.id]: e.target.value }))
                        }
                        className="w-full min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 text-xs font-mono-nums text-right text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {limit > 0 && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isOver ? 'bg-red-600' : isWarn ? 'bg-amber-500' : 'bg-teal-600'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono-nums">
                        <span
                          className={
                            isOver
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : isWarn
                              ? 'text-amber-600 dark:text-amber-400 font-medium'
                              : 'text-slate-500 dark:text-slate-400'
                          }
                        >
                          {isOver
                            ? `Over by ${formatINR(spent - limit)}`
                            : isWarn
                            ? `Warning · ${formatINR(limit - spent)} left`
                            : `${formatINR(limit - spent)} remaining`}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {savedMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedMsg}</span>
          </div>
        )}
      </form>

      {/* Category Manager (15 Built-in + Custom Categories) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Expense Categories ({categories.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              15 built-in essential categories plus unlimited custom categories
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewCategory}
            className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Category</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {categories.map((cat) => {
            const confirming = confirmDeleteCatId === cat.id;
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {cat.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {cat.isCustom ? 'Custom Category' : 'Standard'}
                    </p>
                  </div>
                </div>

                {cat.isCustom && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditCategory(cat)}
                      className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {confirming ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteCategory(cat.id);
                          setConfirmDeleteCatId(null);
                        }}
                        className="min-h-[34px] px-2 rounded-lg bg-red-600 text-white text-[11px] font-medium"
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCatId(cat.id)}
                        className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        aria-label={`Delete ${cat.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
