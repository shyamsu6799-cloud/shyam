import React from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Edit2,
  Image as ImageIcon,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { DashboardMetrics } from '../utils/calculations';
import { buildCategoryAnalysis } from '../utils/calculations';
import type { BudgetConfig, Expense, ExpenseCategory, Income } from '../types/expense';
import { formatDateDisplay, formatINR, formatTimeDisplay, getTodayISO } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { PieDonutChart } from './ChartsSuite';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  expenses: Expense[];
  incomes: Income[];
  categories: ExpenseCategory[];
  budget: BudgetConfig;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onEditExpense: (expense: Expense) => void;
  onPreviewReceipt: (img: string, title: string) => void;
  onNavigate: (view: 'transactions' | 'reports' | 'analytics' | 'budgets') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  expenses,
  incomes,
  categories,
  budget,
  onAddExpense,
  onAddIncome,
  onEditExpense,
  onPreviewReceipt,
  onNavigate,
}) => {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const highestCat = metrics.highestExpense
    ? catMap.get(metrics.highestExpense.categoryId)
    : undefined;

  const currentMonthPrefix = getTodayISO().slice(0, 7);
  const thisMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const categoryBreakdown = buildCategoryAnalysis(
    thisMonthExpenses.length > 0 ? thisMonthExpenses : expenses,
    categories,
    budget
  );
  const pieItems = categoryBreakdown
    .filter((c) => c.total > 0)
    .map((c) => ({
      id: c.category.id,
      label: c.category.name,
      value: c.total,
      color: c.category.color,
      percentage: c.percentage,
    }));

  const recentExpenses = expenses.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Budget Warning Banners */}
      {metrics.budgetStatus === 'exceeded' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                Monthly Budget Exceeded
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 tabular-nums">
                Spent {formatINR(metrics.monthExpenses)} of {formatINR(metrics.monthlyBudgetLimit)} limit (over by{' '}
                {formatINR(Math.abs(metrics.remainingMonthlyBudget ?? 0))}).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('budgets')}
            className="min-h-[40px] px-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-medium whitespace-nowrap shrink-0"
          >
            Review Budgets
          </button>
        </div>
      )}

      {metrics.budgetStatus === 'warning' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Approaching Monthly Spending Limit ({metrics.monthlyBudgetUsedPct.toFixed(0)}% used)
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 tabular-nums">
                Remaining budget: {formatINR(metrics.remainingMonthlyBudget ?? 0)} out of{' '}
                {formatINR(metrics.monthlyBudgetLimit)}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('budgets')}
            className="min-h-[40px] px-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium whitespace-nowrap shrink-0"
          >
            Adjust Limit
          </button>
        </div>
      )}

      {/* Primary KPI Grid — 8 Dashboard Requirements */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Today&apos;s Expenses
          </p>
          <p className="mt-2 text-xl sm:text-2xl font-bold font-mono-nums text-slate-900 dark:text-slate-100">
            {formatINR(metrics.todayExpenses)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Recorded today
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            This Month&apos;s Expenses
          </p>
          <p className="mt-2 text-xl sm:text-2xl font-bold font-mono-nums text-slate-900 dark:text-slate-100">
            {formatINR(metrics.monthExpenses)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Current calendar month
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            This Year&apos;s Expenses
          </p>
          <p className="mt-2 text-xl sm:text-2xl font-bold font-mono-nums text-slate-900 dark:text-slate-100">
            {formatINR(metrics.yearExpenses)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Year-to-date spending
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Expenses (All Time)
          </p>
          <p className="mt-2 text-xl sm:text-2xl font-bold font-mono-nums text-slate-900 dark:text-slate-100">
            {formatINR(metrics.totalExpenses)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {metrics.totalTransactions} total transactions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Transactions
          </p>
          <p className="mt-2 text-xl sm:text-2xl font-bold font-mono-nums text-slate-900 dark:text-slate-100">
            {metrics.totalTransactions}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="mt-1 text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
          >
            Open ledger
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Highest Expense
          </p>
          <p className="mt-2 text-xl sm:text-2xl font-bold font-mono-nums text-slate-900 dark:text-slate-100">
            {metrics.highestExpense ? formatINR(metrics.highestExpense.amount) : formatINR(0)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
            {metrics.highestExpense
              ? `${highestCat?.name ?? 'Expense'} · ${formatDateDisplay(metrics.highestExpense.date)}`
              : 'No expenses yet'}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Remaining Monthly Budget
              </p>
              <p
                className={`mt-1.5 text-xl sm:text-2xl font-bold font-mono-nums ${
                  metrics.budgetStatus === 'exceeded'
                    ? 'text-red-600 dark:text-red-400'
                    : metrics.budgetStatus === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {metrics.remainingMonthlyBudget !== null
                  ? formatINR(metrics.remainingMonthlyBudget)
                  : 'Not Configured'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('budgets')}
              className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              {metrics.monthlyBudgetLimit > 0 ? 'Manage Budget' : 'Set Budget'}
            </button>
          </div>
          {metrics.monthlyBudgetLimit > 0 ? (
            <div className="mt-3">
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    metrics.budgetStatus === 'exceeded'
                      ? 'bg-red-600'
                      : metrics.budgetStatus === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-teal-600'
                  }`}
                  style={{ width: `${Math.min(100, metrics.monthlyBudgetUsedPct)}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono-nums">
                <span>{metrics.monthlyBudgetUsedPct.toFixed(1)}% used</span>
                <span>Limit: {formatINR(metrics.monthlyBudgetLimit)}</span>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Set a monthly spending limit to track remaining budget and receive warnings.
            </p>
          )}
        </div>
      </div>

      {/* Income and Expense Summary */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Income and Expense Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time cashflow calculated from your recorded income ({incomes.length}) and expenses ({expenses.length})
            </p>
          </div>
          <button
            type="button"
            onClick={onAddIncome}
            className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700/30 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Income</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>This Month Income</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="mt-1.5 text-lg font-bold font-mono-nums text-emerald-700 dark:text-emerald-400">
              {formatINR(metrics.monthlyIncome)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono-nums">
              All-time: {formatINR(metrics.allTimeIncome)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>This Month Expense</span>
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
            <p className="mt-1.5 text-lg font-bold font-mono-nums text-rose-700 dark:text-rose-400">
              {formatINR(metrics.monthExpenses)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono-nums">
              All-time: {formatINR(metrics.totalExpenses)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Net Balance (This Month)</span>
              <Wallet className="w-4 h-4 text-teal-600" />
            </div>
            <p
              className={`mt-1.5 text-lg font-bold font-mono-nums ${
                metrics.monthlyNetBalance >= 0
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatINR(metrics.monthlyNetBalance)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono-nums">
              All-time Net: {formatINR(metrics.allTimeNetBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State OR Category Chart + Recent Transactions */}
      {expenses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
            Ready to Track Your Expenses
          </h3>
          <p className="mt-1.5 max-w-md mx-auto text-sm text-slate-500 dark:text-slate-400">
            Your local database is initialized with all 15 categories and zero dummy entries. Add your first expense or income to unlock live analytics and reports.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onAddExpense}
              className="min-h-[46px] inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Expense</span>
            </button>
            <button
              type="button"
              onClick={onAddIncome}
              className="min-h-[46px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Income</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Category Spending Breakdown
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {thisMonthExpenses.length > 0 ? 'This month by category' : 'All-time by category'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('analytics')}
                className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
              >
                Full Charts
              </button>
            </div>
            <PieDonutChart items={pieItems} donut />
          </div>

          <div className="xl:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Expenses
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('transactions')}
                className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentExpenses.map((exp) => {
                const cat = catMap.get(exp.categoryId);
                return (
                  <div
                    key={exp.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat?.color ?? '#475569' }}
                      >
                        <CategoryIcon name={cat?.icon ?? 'Receipt'} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {exp.description || cat?.name || 'Expense'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {cat?.name ?? 'Other'} · {formatDateDisplay(exp.date)} · {formatTimeDisplay(exp.time)} · {exp.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {exp.receiptImage && (
                        <button
                          type="button"
                          onClick={() =>
                            onPreviewReceipt(
                              exp.receiptImage!,
                              `${cat?.name ?? 'Receipt'} (${formatDateDisplay(exp.date)})`
                            )
                          }
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View receipt photo"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      )}
                      <span className="text-sm font-bold font-mono-nums text-slate-900 dark:text-slate-100">
                        {formatINR(exp.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditExpense(exp)}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Edit expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="mt-4 w-full min-h-[42px] flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Open Date-Wise Reports</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
