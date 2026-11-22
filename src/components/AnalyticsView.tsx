import React, { useMemo, useState } from 'react';
import type { BudgetConfig, Expense, ExpenseCategory, Income } from '../types/expense';
import {
  buildCategoryAnalysis,
  buildMonthlyComparison,
  buildYearlyComparison,
} from '../utils/calculations';
import { formatDateDisplay, formatINR, getTodayISO } from '../utils/formatters';
import {
  DualComparisonChart,
  PieDonutChart,
  SimpleBarChart,
  TrendLineChart,
} from './ChartsSuite';

interface AnalyticsViewProps {
  expenses: Expense[];
  incomes: Income[];
  categories: ExpenseCategory[];
  budget: BudgetConfig;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  expenses,
  incomes,
  categories,
  budget,
}) => {
  const currentYear = Number(getTodayISO().slice(0, 4));
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [pieStyle, setPieStyle] = useState<'donut' | 'pie'>('donut');
  const [scope, setScope] = useState<'year' | 'all'>('year');

  const yearOptions = useMemo(() => {
    const ys = new Set<number>([currentYear - 1, currentYear]);
    for (const e of expenses) {
      const y = Number(e.date.slice(0, 4));
      if (Number.isFinite(y)) ys.add(y);
    }
    return Array.from(ys).sort((a, b) => b - a);
  }, [expenses, currentYear]);

  const scopedExpenses = useMemo(() => {
    if (scope === 'all') return expenses;
    const prefix = `${selectedYear}-`;
    return expenses.filter((e) => e.date.startsWith(prefix));
  }, [expenses, scope, selectedYear]);

  const categorySummary = useMemo(
    () => buildCategoryAnalysis(scopedExpenses, categories, budget),
    [scopedExpenses, categories, budget]
  );

  const pieItems = useMemo(
    () =>
      categorySummary
        .filter((c) => c.total > 0)
        .map((c) => ({
          id: c.category.id,
          label: c.category.name,
          value: c.total,
          color: c.category.color,
          percentage: c.percentage,
        })),
    [categorySummary]
  );

  const categoryBars = useMemo(
    () =>
      categorySummary
        .filter((c) => c.total > 0)
        .slice(0, 12)
        .map((c) => ({
          label: c.category.name,
          value: c.total,
          color: c.category.color,
        })),
    [categorySummary]
  );

  const dailyTrendPoints = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const e of scopedExpenses) {
      byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.amount);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, value]) => ({
        label: formatDateDisplay(date).slice(0, 6),
        value,
      }));
  }, [scopedExpenses]);

  const monthlyComparison = useMemo(
    () => buildMonthlyComparison(expenses, incomes, selectedYear),
    [expenses, incomes, selectedYear]
  );

  const yearlyComparison = useMemo(
    () => buildYearlyComparison(expenses, incomes),
    [expenses, incomes]
  );

  const currentMonthPrefix = getTodayISO().slice(0, 7);
  const currentMonthCatSpend = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      if (e.date.startsWith(currentMonthPrefix)) {
        map[e.categoryId] = (map[e.categoryId] ?? 0) + e.amount;
      }
    }
    return map;
  }, [expenses, currentMonthPrefix]);

  const maxCatCompare = useMemo(() => {
    let maxVal = 1;
    for (const item of categorySummary) {
      maxVal = Math.max(maxVal, item.total, item.budgetLimit);
    }
    return maxVal;
  }, [categorySummary]);

  return (
    <div className="space-y-6">
      {/* Scope Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setScope('year')}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold ${
                scope === 'year'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Selected Year
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold ${
                scope === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Time
            </button>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            aria-label="Select year for comparison"
            className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-slate-100"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-nums">
          Total analyzed:{' '}
          <strong className="text-slate-900 dark:text-slate-100">
            {formatINR(scopedExpenses.reduce((s, e) => s + e.amount, 0))}
          </strong>
        </span>
      </div>

      {/* 1. Pie Chart & 2. Bar Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                1. Category Share (Pie Chart)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Proportional breakdown across categories
              </p>
            </div>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setPieStyle('donut')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                  pieStyle === 'donut'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Donut
              </button>
              <button
                type="button"
                onClick={() => setPieStyle('pie')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                  pieStyle === 'pie'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Pie
              </button>
            </div>
          </div>
          <PieDonutChart items={pieItems} donut={pieStyle === 'donut'} />
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              2. Category Spend (Bar Chart)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Top spending categories side by side
            </p>
          </div>
          <SimpleBarChart data={categoryBars} />
        </div>
      </div>

      {/* 3. Line Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            3. Daily Spending Trend (Line Chart)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Latest 30 active spending dates in selected scope
          </p>
        </div>
        <TrendLineChart data={dailyTrendPoints} />
      </div>

      {/* 4. Monthly Comparison & 5. Yearly Comparison */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              4. Monthly Comparison ({selectedYear})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Jan–Dec Income vs Expense comparison
            </p>
          </div>
          <DualComparisonChart
            data={monthlyComparison.map((m) => ({
              label: m.label,
              expense: m.expense,
              income: m.income,
            }))}
          />
        </div>

        <div className="xl:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              5. Yearly Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-year Income vs Expense overview
            </p>
          </div>
          <DualComparisonChart
            data={yearlyComparison.map((y) => ({
              label: String(y.year),
              expense: y.expense,
              income: y.income,
            }))}
          />
        </div>
      </div>

      {/* 6. Category-Wise Comparison (Spend vs Budget) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            6. Category-Wise Comparison
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparing category totals against configured monthly budgets (where set)
          </p>
        </div>

        <div className="space-y-3.5">
          {categorySummary
            .filter((item) => item.total > 0 || item.budgetLimit > 0)
            .map((item) => {
              const monthSpend = currentMonthCatSpend[item.category.id] ?? 0;
              const widthPct = (item.total / maxCatCompare) * 100;
              const budgetPct = item.budgetLimit > 0 ? (item.budgetLimit / maxCatCompare) * 100 : 0;

              return (
                <div key={item.category.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.category.name}
                    </span>
                    <span className="font-mono-nums text-slate-600 dark:text-slate-300 shrink-0">
                      Spent: <strong className="text-slate-900 dark:text-slate-100">{formatINR(item.total)}</strong>
                      {item.budgetLimit > 0 && (
                        <span className="text-slate-500 dark:text-slate-400">
                          {' '}
                          · This Month: {formatINR(monthSpend)} / {formatINR(item.budgetLimit)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="relative h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {budgetPct > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 bg-slate-300/60 dark:bg-slate-700/60 rounded-full"
                        style={{ width: `${Math.min(100, budgetPct)}%` }}
                        title={`Monthly budget: ${formatINR(item.budgetLimit)}`}
                      />
                    )}
                    <div
                      className="relative h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, widthPct)}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}

          {categorySummary.every((c) => c.total === 0 && c.budgetLimit === 0) && (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
              Add expenses or set category budgets to compare categories.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
