import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
} from 'lucide-react';
import type {
  BudgetConfig,
  Expense,
  ExpenseCategory,
  Income,
  ReportPeriod,
} from '../types/expense';
import { buildCategoryAnalysis, groupExpensesByDate } from '../utils/calculations';
import {
  exportExpensesToCSV,
  exportReportToPDF,
  exportToExcelWorkbook,
} from '../utils/exporters';
import {
  formatDateDisplay,
  formatINR,
  formatTimeDisplay,
  getFullMonthName,
  getHalfYearBounds,
  getMonthBounds,
  getQuarterBounds,
  getTodayISO,
  getWeekBounds,
  getYearBounds,
} from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface ReportsViewProps {
  expenses: Expense[];
  incomes: Income[];
  categories: ExpenseCategory[];
  budget: BudgetConfig;
}

const REPORT_TABS: Array<{ id: ReportPeriod; label: string }> = [
  { id: 'daily', label: 'Daily' },
  { id: 'datewise', label: 'Date-Wise' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'halfyearly', label: 'Half-Yearly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'custom', label: 'Custom Range' },
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  expenses,
  incomes,
  categories,
  budget,
}) => {
  const today = getTodayISO();
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7)) - 1;

  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [selectedDay, setSelectedDay] = useState(today);
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [monthIdx, setMonthIdx] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(
    (Math.floor(currentMonth / 3) + 1) as 1 | 2 | 3 | 4
  );
  const [half, setHalf] = useState<1 | 2>(currentMonth < 6 ? 1 : 2);
  const [customStart, setCustomStart] = useState(`${today.slice(0, 7)}-01`);
  const [customEnd, setCustomEnd] = useState(today);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const { start, end, label } = useMemo(() => {
    switch (period) {
      case 'daily':
        return {
          start: selectedDay,
          end: selectedDay,
          label: `Daily Report (${formatDateDisplay(selectedDay)})`,
        };
      case 'datewise':
        return {
          start: customStart,
          end: customEnd,
          label: `Date-Wise Summary (${formatDateDisplay(customStart)} – ${formatDateDisplay(customEnd)})`,
        };
      case 'weekly': {
        const b = getWeekBounds(weekAnchor);
        return {
          start: b.start,
          end: b.end,
          label: `Weekly Report (${formatDateDisplay(b.start)} – ${formatDateDisplay(b.end)})`,
        };
      }
      case 'monthly': {
        const b = getMonthBounds(year, monthIdx);
        return {
          start: b.start,
          end: b.end,
          label: `Monthly Report (${getFullMonthName(monthIdx)} ${year})`,
        };
      }
      case 'quarterly': {
        const b = getQuarterBounds(year, quarter);
        return {
          start: b.start,
          end: b.end,
          label: `Q${quarter} ${year} Quarterly Report`,
        };
      }
      case 'halfyearly': {
        const b = getHalfYearBounds(year, half);
        return {
          start: b.start,
          end: b.end,
          label: `H${half} ${year} Half-Yearly Report (${half === 1 ? 'Jan–Jun' : 'Jul–Dec'})`,
        };
      }
      case 'yearly': {
        const b = getYearBounds(year);
        return {
          start: b.start,
          end: b.end,
          label: `Yearly Report (${year})`,
        };
      }
      case 'custom':
      default:
        return {
          start: customStart <= customEnd ? customStart : customEnd,
          end: customStart <= customEnd ? customEnd : customStart,
          label: `Custom Range (${formatDateDisplay(customStart)} – ${formatDateDisplay(customEnd)})`,
        };
    }
  }, [period, selectedDay, weekAnchor, monthIdx, year, quarter, half, customStart, customEnd]);

  const periodExpenses = useMemo(
    () => expenses.filter((e) => e.date >= start && e.date <= end),
    [expenses, start, end]
  );

  const periodIncomes = useMemo(
    () => incomes.filter((i) => i.date >= start && i.date <= end),
    [incomes, start, end]
  );

  const totalSpent = useMemo(
    () => periodExpenses.reduce((s, e) => s + e.amount, 0),
    [periodExpenses]
  );
  const totalInc = useMemo(
    () => periodIncomes.reduce((s, i) => s + i.amount, 0),
    [periodIncomes]
  );

  const categoryAnalysis = useMemo(
    () => buildCategoryAnalysis(periodExpenses, categories, budget),
    [periodExpenses, categories, budget]
  );

  const dailyGroups = useMemo(() => groupExpensesByDate(periodExpenses), [periodExpenses]);

  const yearOptions = useMemo(() => {
    const ys = new Set<number>([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);
    for (const e of expenses) {
      const y = Number(e.date.slice(0, 4));
      if (Number.isFinite(y)) ys.add(y);
    }
    return Array.from(ys).sort((a, b) => b - a);
  }, [expenses, currentYear]);

  return (
    <div className="space-y-6">
      {/* Print-only Header */}
      <div className="hidden print-only border-b border-slate-300 pb-3 mb-4">
        <h1 className="text-xl font-bold">SHYAM EXPENSE MANAGER</h1>
        <p className="text-sm text-slate-600">{label}</p>
      </div>

      {/* Period Selector Tabs + Export Actions */}
      <div className="no-print rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {REPORT_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPeriod(t.id)}
              className={`min-h-[38px] px-3.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                period === t.id
                  ? 'bg-teal-700 text-white dark:bg-teal-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dynamic Period Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-end gap-3">
            {period === 'daily' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            {period === 'weekly' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Week Containing Date
                </label>
                <input
                  type="date"
                  value={weekAnchor}
                  onChange={(e) => setWeekAnchor(e.target.value)}
                  className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            {period === 'monthly' && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Month
                  </label>
                  <select
                    value={monthIdx}
                    onChange={(e) => setMonthIdx(Number(e.target.value))}
                    className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {Array.from({ length: 12 }, (_, idx) => (
                      <option key={idx} value={idx}>
                        {getFullMonthName(idx)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {period === 'quarterly' && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Quarter
                  </label>
                  <select
                    value={quarter}
                    onChange={(e) => setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)}
                    className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value={1}>Q1 (Jan – Mar)</option>
                    <option value={2}>Q2 (Apr – Jun)</option>
                    <option value={3}>Q3 (Jul – Sep)</option>
                    <option value={4}>Q4 (Oct – Dec)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {period === 'halfyearly' && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Half Year
                  </label>
                  <select
                    value={half}
                    onChange={(e) => setHalf(Number(e.target.value) as 1 | 2)}
                    className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value={1}>H1 (Jan – Jun)</option>
                    <option value={2}>H2 (Jul – Dec)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {period === 'yearly' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(period === 'custom' || period === 'datewise') && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportReportToPDF(periodExpenses, periodIncomes, categories, budget, label)}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 px-3.5 text-xs font-medium text-white whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Report</span>
            </button>
            <button
              type="button"
              onClick={() =>
                exportToExcelWorkbook(periodExpenses, periodIncomes, categories, budget, label)
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel (.xls)</span>
            </button>
            <button
              type="button"
              onClick={() => exportExpensesToCSV(periodExpenses, categories, `shyam-${period}-report`)}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Period Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Period Expenses</p>
          <p className="mt-1.5 text-xl font-bold font-mono-nums text-slate-900 dark:text-slate-100">
            {formatINR(totalSpent)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">{label}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Transactions</p>
          <p className="mt-1.5 text-xl font-bold font-mono-nums text-slate-900 dark:text-slate-100">
            {periodExpenses.length}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono-nums">
            Avg: {formatINR(periodExpenses.length > 0 ? totalSpent / periodExpenses.length : 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Period Income</p>
          <p className="mt-1.5 text-xl font-bold font-mono-nums text-emerald-700 dark:text-emerald-400">
            {formatINR(totalInc)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {periodIncomes.length} entries
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Net Savings</p>
          <p
            className={`mt-1.5 text-xl font-bold font-mono-nums ${
              totalInc - totalSpent >= 0
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatINR(totalInc - totalSpent)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Income minus expense
          </p>
        </div>
      </div>

      {/* Category-Wise Analysis with Expandable Transaction History */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Category-Wise Analysis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tap any category row to inspect its full transaction history for this period
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {categoryAnalysis.map((item) => {
            const isExpanded = expandedCategoryId === item.category.id;
            return (
              <div key={item.category.id} className="py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCategoryId((prev) =>
                      prev === item.category.id ? null : item.category.id
                    )
                  }
                  className="w-full flex items-center justify-between gap-3 text-left py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 px-1.5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: item.category.color }}
                    >
                      <CategoryIcon name={item.category.icon} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.category.name}
                        </span>
                        <span className="text-sm font-bold font-mono-nums text-slate-900 dark:text-slate-100 shrink-0">
                          {formatINR(item.total)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, item.percentage)}%`,
                              backgroundColor: item.category.color,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-nums shrink-0">
                          {item.percentage.toFixed(1)}% · {item.count} tx
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-2 ml-12 pl-3 border-l border-slate-200 dark:border-slate-700 space-y-2">
                    {item.transactions.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
                        No transactions in this category for {label}.
                      </p>
                    ) : (
                      item.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between gap-3 text-xs py-1"
                        >
                          <div className="min-w-0">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {tx.description || item.category.name}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 ml-2">
                              {formatDateDisplay(tx.date)} · {formatTimeDisplay(tx.time)} ·{' '}
                              {tx.paymentMethod}
                            </span>
                          </div>
                          <span className="font-mono-nums font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                            {formatINR(tx.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Date-Wise Grouped Ledger */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          Day-by-Day Expense Breakdown
        </h2>
        {dailyGroups.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
            No expenses found for {label}.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {dailyGroups.map((group) => {
              const open = expandedDate === group.date || period === 'daily';
              return (
                <div key={group.date} className="py-3 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDate((prev) => (prev === group.date ? null : group.date))
                    }
                    className="w-full flex items-center justify-between gap-3 py-1 text-left"
                  >
                    <div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatDateDisplay(group.date)}
                      </span>
                      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                        {group.count} {group.count === 1 ? 'transaction' : 'transactions'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono-nums text-slate-900 dark:text-slate-100">
                        {formatINR(group.total)}
                      </span>
                      {period !== 'daily' &&
                        (open ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        ))}
                    </div>
                  </button>

                  {open && (
                    <div className="mt-2 space-y-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                      {group.transactions.map((tx) => {
                        const cat = catMap.get(tx.categoryId);
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between gap-3 text-xs py-1"
                          >
                            <span className="text-slate-700 dark:text-slate-300 truncate">
                              <strong>{cat?.name ?? 'Other'}</strong>
                              {tx.description ? ` — ${tx.description}` : ''} ·{' '}
                              <span className="text-slate-500 dark:text-slate-400">
                                {formatTimeDisplay(tx.time)} · {tx.paymentMethod}
                              </span>
                            </span>
                            <span className="font-mono-nums font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                              {formatINR(tx.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
