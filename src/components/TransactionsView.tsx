import React, { useMemo, useState } from 'react';
import {
  Download,
  Edit2,
  Filter,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { PAYMENT_METHODS } from '../constants/categories';
import type { Expense, ExpenseCategory, ExpenseFilter, Income } from '../types/expense';
import { filterExpenses } from '../utils/calculations';
import { exportExpensesToCSV } from '../utils/exporters';
import { formatDateDisplay, formatINR, formatTimeDisplay } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionsViewProps {
  expenses: Expense[];
  incomes: Income[];
  categories: ExpenseCategory[];
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => Promise<void>;
  onAddIncome: () => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => Promise<void>;
  onPreviewReceipt: (img: string, title: string) => void;
}

const INITIAL_FILTER: ExpenseFilter = {
  searchQuery: '',
  categoryId: 'all',
  paymentMethod: 'all',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  sortBy: 'date_desc',
};

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  expenses,
  incomes,
  categories,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
  onPreviewReceipt,
}) => {
  const [ledgerTab, setLedgerTab] = useState<'expenses' | 'incomes'>('expenses');
  const [filter, setFilter] = useState<ExpenseFilter>(INITIAL_FILTER);
  const [showFilters, setShowFilters] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filteredExpenses = useMemo(() => {
    const q = filter.searchQuery.trim().toLowerCase();
    const base = filterExpenses(expenses, { ...filter, searchQuery: '' });
    if (!q) return base;
    return base.filter((exp) => {
      const catName = catMap.get(exp.categoryId)?.name ?? '';
      const haystack = `${exp.description} ${catName} ${exp.paymentMethod} ${exp.date} ${exp.amount}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [expenses, filter, catMap]);

  const filteredIncomes = useMemo(() => {
    const q = filter.searchQuery.trim().toLowerCase();
    return incomes.filter((inc) => {
      if (filter.paymentMethod !== 'all' && inc.paymentMethod !== filter.paymentMethod) {
        return false;
      }
      if (filter.startDate && inc.date < filter.startDate) return false;
      if (filter.endDate && inc.date > filter.endDate) return false;
      if (filter.minAmount !== '' && inc.amount < Number(filter.minAmount)) return false;
      if (filter.maxAmount !== '' && inc.amount > Number(filter.maxAmount)) return false;
      if (q) {
        const haystack = `${inc.description} ${inc.source} ${inc.paymentMethod} ${inc.date} ${inc.amount}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [incomes, filter]);

  const filteredTotal = useMemo(
    () =>
      ledgerTab === 'expenses'
        ? filteredExpenses.reduce((s, e) => s + e.amount, 0)
        : filteredIncomes.reduce((s, i) => s + i.amount, 0),
    [ledgerTab, filteredExpenses, filteredIncomes]
  );

  const hasActiveFilters =
    filter.searchQuery !== '' ||
    filter.categoryId !== 'all' ||
    filter.paymentMethod !== 'all' ||
    filter.startDate !== '' ||
    filter.endDate !== '' ||
    filter.minAmount !== '' ||
    filter.maxAmount !== '';

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 self-start">
          <button
            type="button"
            onClick={() => setLedgerTab('expenses')}
            className={`min-h-[38px] px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              ledgerTab === 'expenses'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Expenses ({expenses.length})
          </button>
          <button
            type="button"
            onClick={() => setLedgerTab('incomes')}
            className={`min-h-[38px] px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              ledgerTab === 'incomes'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Income ({incomes.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>

          {ledgerTab === 'expenses' && filteredExpenses.length > 0 && (
            <button
              type="button"
              onClick={() => exportExpensesToCSV(filteredExpenses, categories, 'shyam-filtered-expenses')}
              className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={ledgerTab === 'expenses' ? onAddExpense : onAddIncome}
            className="min-h-[40px] inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 px-4 text-xs font-semibold text-white whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{ledgerTab === 'expenses' ? 'Add Expense' : 'Add Income'}</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Panel */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter.searchQuery}
                onChange={(e) => setFilter((f) => ({ ...f, searchQuery: e.target.value }))}
                placeholder="Search description, date, amount..."
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {ledgerTab === 'expenses' && (
              <select
                value={filter.categoryId}
                onChange={(e) => setFilter((f) => ({ ...f, categoryId: e.target.value }))}
                aria-label="Filter by category"
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filter.paymentMethod}
              onChange={(e) => setFilter((f) => ({ ...f, paymentMethod: e.target.value }))}
              aria-label="Filter by payment method"
              className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">All Payment Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {ledgerTab === 'expenses' && (
              <select
                value={filter.sortBy}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    sortBy: e.target.value as ExpenseFilter['sortBy'],
                  }))
                }
                aria-label="Sort transactions"
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="date_desc">Sort: Newest First</option>
                <option value="date_asc">Sort: Oldest First</option>
                <option value="amount_desc">Sort: Highest Amount</option>
                <option value="amount_asc">Sort: Lowest Amount</option>
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Min Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={filter.minAmount}
                onChange={(e) => setFilter((f) => ({ ...f, minAmount: e.target.value }))}
                className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 text-xs font-mono-nums text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Max Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Any"
                value={filter.maxAmount}
                onChange={(e) => setFilter((f) => ({ ...f, maxAmount: e.target.value }))}
                className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 text-xs font-mono-nums text-slate-900 dark:text-slate-100"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setFilter(INITIAL_FILTER)}
                className="col-span-2 sm:col-span-4 lg:col-span-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Result Summary Strip */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-600 dark:text-slate-400">
        <span>
          Showing{' '}
          <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
            {ledgerTab === 'expenses' ? filteredExpenses.length : filteredIncomes.length}
          </strong>{' '}
          {ledgerTab === 'expenses' ? 'expense' : 'income'} entries
        </span>
        <span className="font-mono-nums">
          Total:{' '}
          <strong className="text-sm text-slate-900 dark:text-slate-100">
            {formatINR(filteredTotal)}
          </strong>
        </span>
      </div>

      {/* Ledger List / Table */}
      {ledgerTab === 'expenses' ? (
        filteredExpenses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {hasActiveFilters
                ? 'No expenses match your search or filter criteria.'
                : 'No expenses recorded yet.'}
            </p>
            <button
              type="button"
              onClick={hasActiveFilters ? () => setFilter(INITIAL_FILTER) : onAddExpense}
              className="mt-4 min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 text-xs font-semibold text-white"
            >
              {hasActiveFilters ? 'Clear All Filters' : 'Add First Expense'}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((exp) => {
                const cat = catMap.get(exp.categoryId);
                const confirming = confirmDeleteId === exp.id;
                return (
                  <div
                    key={exp.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat?.color ?? '#475569' }}
                      >
                        <CategoryIcon name={cat?.icon ?? 'Receipt'} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {exp.description || cat?.name || 'Expense'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {cat?.name ?? 'Other'} · {formatDateDisplay(exp.date)} ·{' '}
                          {formatTimeDisplay(exp.time)} · {exp.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-13 sm:pl-0">
                      <span className="text-base font-bold font-mono-nums text-slate-900 dark:text-slate-100 mr-2">
                        {formatINR(exp.amount)}
                      </span>

                      {exp.receiptImage && (
                        <button
                          type="button"
                          onClick={() =>
                            onPreviewReceipt(
                              exp.receiptImage!,
                              `${cat?.name ?? 'Receipt'} · ${formatDateDisplay(exp.date)}`
                            )
                          }
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View receipt photo"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onEditExpense(exp)}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Edit expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {confirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteExpense(exp.id);
                              setConfirmDeleteId(null);
                            }}
                            className="min-h-[40px] px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[40px] px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(exp.id)}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                          aria-label="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : filteredIncomes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            No income entries recorded for this filter.
          </p>
          <button
            type="button"
            onClick={onAddIncome}
            className="mt-4 min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 text-xs font-semibold text-white"
          >
            Add Income Entry
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredIncomes.map((inc) => {
            const confirming = confirmDeleteId === inc.id;
            return (
              <div
                key={inc.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {inc.description || inc.source}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {inc.source} · {formatDateDisplay(inc.date)} · {formatTimeDisplay(inc.time)} ·{' '}
                    {inc.paymentMethod}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <span className="text-base font-bold font-mono-nums text-emerald-700 dark:text-emerald-400 mr-2">
                    +{formatINR(inc.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditIncome(inc)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Edit income"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {confirming ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteIncome(inc.id);
                          setConfirmDeleteId(null);
                        }}
                        className="min-h-[40px] px-2.5 rounded-lg bg-red-600 text-white text-xs font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-[40px] px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(inc.id)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                      aria-label="Delete income"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
