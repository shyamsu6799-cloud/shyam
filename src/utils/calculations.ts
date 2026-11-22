import type {
  BudgetConfig,
  Expense,
  ExpenseCategory,
  ExpenseFilter,
  Income,
} from '../types/expense';
import { getMonthName, getTodayISO } from './formatters';

export interface DashboardMetrics {
  totalExpenses: number;
  todayExpenses: number;
  monthExpenses: number;
  yearExpenses: number;
  totalTransactions: number;
  highestExpense: Expense | null;
  remainingMonthlyBudget: number | null;
  monthlyBudgetLimit: number;
  monthlyBudgetUsedPct: number;
  budgetStatus: 'unset' | 'safe' | 'warning' | 'exceeded';
  monthlyIncome: number;
  allTimeIncome: number;
  monthlyNetBalance: number;
  allTimeNetBalance: number;
  categoryAlerts: Array<{
    category: ExpenseCategory;
    spent: number;
    limit: number;
    pct: number;
    status: 'warning' | 'exceeded';
  }>;
}

export function computeDashboardMetrics(
  expenses: Expense[],
  incomes: Income[],
  categories: ExpenseCategory[],
  budget: BudgetConfig
): DashboardMetrics {
  const today = getTodayISO();
  const currentMonthPrefix = today.slice(0, 7); // YYYY-MM
  const currentYearPrefix = today.slice(0, 4); // YYYY

  let totalExpenses = 0;
  let todayExpenses = 0;
  let monthExpenses = 0;
  let yearExpenses = 0;
  let highestExpense: Expense | null = null;
  const monthCategorySpend: Record<string, number> = {};

  for (const exp of expenses) {
    totalExpenses += exp.amount;
    if (exp.date === today) todayExpenses += exp.amount;
    if (exp.date.startsWith(currentMonthPrefix)) {
      monthExpenses += exp.amount;
      monthCategorySpend[exp.categoryId] = (monthCategorySpend[exp.categoryId] ?? 0) + exp.amount;
    }
    if (exp.date.startsWith(currentYearPrefix)) yearExpenses += exp.amount;
    if (!highestExpense || exp.amount > highestExpense.amount) {
      highestExpense = exp;
    }
  }

  let monthlyIncome = 0;
  let allTimeIncome = 0;
  for (const inc of incomes) {
    allTimeIncome += inc.amount;
    if (inc.date.startsWith(currentMonthPrefix)) {
      monthlyIncome += inc.amount;
    }
  }

  const monthlyBudgetLimit = budget.monthlyLimit > 0 ? budget.monthlyLimit : 0;
  const threshold = budget.warningThresholdPct || 80;
  const monthlyBudgetUsedPct =
    monthlyBudgetLimit > 0 ? (monthExpenses / monthlyBudgetLimit) * 100 : 0;

  let budgetStatus: 'unset' | 'safe' | 'warning' | 'exceeded' = 'unset';
  if (monthlyBudgetLimit > 0) {
    if (monthExpenses > monthlyBudgetLimit) budgetStatus = 'exceeded';
    else if (monthlyBudgetUsedPct >= threshold) budgetStatus = 'warning';
    else budgetStatus = 'safe';
  }

  const categoryAlerts: DashboardMetrics['categoryAlerts'] = [];
  for (const cat of categories) {
    const limit = budget.categoryLimits[cat.id] ?? 0;
    if (limit > 0) {
      const spent = monthCategorySpend[cat.id] ?? 0;
      const pct = (spent / limit) * 100;
      if (spent > limit) {
        categoryAlerts.push({ category: cat, spent, limit, pct, status: 'exceeded' });
      } else if (pct >= threshold) {
        categoryAlerts.push({ category: cat, spent, limit, pct, status: 'warning' });
      }
    }
  }
  categoryAlerts.sort((a, b) => b.pct - a.pct);

  return {
    totalExpenses,
    todayExpenses,
    monthExpenses,
    yearExpenses,
    totalTransactions: expenses.length,
    highestExpense,
    remainingMonthlyBudget:
      monthlyBudgetLimit > 0 ? monthlyBudgetLimit - monthExpenses : null,
    monthlyBudgetLimit,
    monthlyBudgetUsedPct,
    budgetStatus,
    monthlyIncome,
    allTimeIncome,
    monthlyNetBalance: monthlyIncome - monthExpenses,
    allTimeNetBalance: allTimeIncome - totalExpenses,
    categoryAlerts,
  };
}

export function filterExpenses(expenses: Expense[], filter: ExpenseFilter): Expense[] {
  const q = filter.searchQuery.trim().toLowerCase();
  const minAmt = filter.minAmount !== '' ? Number(filter.minAmount) : null;
  const maxAmt = filter.maxAmount !== '' ? Number(filter.maxAmount) : null;

  const filtered = expenses.filter((exp) => {
    if (filter.categoryId && filter.categoryId !== 'all' && exp.categoryId !== filter.categoryId) {
      return false;
    }
    if (
      filter.paymentMethod &&
      filter.paymentMethod !== 'all' &&
      exp.paymentMethod !== filter.paymentMethod
    ) {
      return false;
    }
    if (filter.startDate && exp.date < filter.startDate) {
      return false;
    }
    if (filter.endDate && exp.date > filter.endDate) {
      return false;
    }
    if (minAmt !== null && Number.isFinite(minAmt) && exp.amount < minAmt) {
      return false;
    }
    if (maxAmt !== null && Number.isFinite(maxAmt) && exp.amount > maxAmt) {
      return false;
    }
    if (q) {
      const haystack = `${exp.description} ${exp.paymentMethod} ${exp.date} ${exp.amount}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return filtered.sort((a, b) => {
    if (filter.sortBy === 'date_asc') {
      return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
    }
    if (filter.sortBy === 'amount_desc') {
      return b.amount - a.amount;
    }
    if (filter.sortBy === 'amount_asc') {
      return a.amount - b.amount;
    }
    return `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`);
  });
}

export interface CategorySummaryItem {
  category: ExpenseCategory;
  total: number;
  count: number;
  percentage: number;
  budgetLimit: number;
  transactions: Expense[];
}

export function buildCategoryAnalysis(
  expenses: Expense[],
  categories: ExpenseCategory[],
  budget: BudgetConfig
): CategorySummaryItem[] {
  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCat = new Map<string, Expense[]>();

  for (const exp of expenses) {
    const list = byCat.get(exp.categoryId) ?? [];
    list.push(exp);
    byCat.set(exp.categoryId, list);
  }

  return categories
    .map((category) => {
      const txList = byCat.get(category.id) ?? [];
      const total = txList.reduce((s, e) => s + e.amount, 0);
      return {
        category,
        total,
        count: txList.length,
        percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
        budgetLimit: budget.categoryLimits[category.id] ?? 0,
        transactions: txList,
      };
    })
    .sort((a, b) => b.total - a.total || a.category.createdAt - b.category.createdAt);
}

export interface DailyGroup {
  date: string;
  total: number;
  count: number;
  transactions: Expense[];
}

export function groupExpensesByDate(expenses: Expense[]): DailyGroup[] {
  const map = new Map<string, Expense[]>();
  for (const exp of expenses) {
    const arr = map.get(exp.date) ?? [];
    arr.push(exp);
    map.set(exp.date, arr);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, transactions]) => ({
      date,
      total: transactions.reduce((s, e) => s + e.amount, 0),
      count: transactions.length,
      transactions,
    }));
}

export interface MonthlyComparisonPoint {
  monthIndex: number;
  label: string;
  expense: number;
  income: number;
}

export function buildMonthlyComparison(
  expenses: Expense[],
  incomes: Income[],
  year: number
): MonthlyComparisonPoint[] {
  const yearPrefix = `${year}-`;
  const expBuckets = new Array<number>(12).fill(0);
  const incBuckets = new Array<number>(12).fill(0);

  for (const exp of expenses) {
    if (exp.date.startsWith(yearPrefix)) {
      const m = Number(exp.date.slice(5, 7)) - 1;
      if (m >= 0 && m < 12) expBuckets[m] += exp.amount;
    }
  }
  for (const inc of incomes) {
    if (inc.date.startsWith(yearPrefix)) {
      const m = Number(inc.date.slice(5, 7)) - 1;
      if (m >= 0 && m < 12) incBuckets[m] += inc.amount;
    }
  }

  return Array.from({ length: 12 }, (_, idx) => ({
    monthIndex: idx,
    label: getMonthName(idx),
    expense: expBuckets[idx],
    income: incBuckets[idx],
  }));
}

export interface YearlyComparisonPoint {
  year: number;
  expense: number;
  income: number;
}

export function buildYearlyComparison(
  expenses: Expense[],
  incomes: Income[]
): YearlyComparisonPoint[] {
  const currentYear = new Date().getFullYear();
  const yearsSet = new Set<number>([currentYear - 1, currentYear]);
  for (const exp of expenses) {
    const y = Number(exp.date.slice(0, 4));
    if (Number.isFinite(y)) yearsSet.add(y);
  }
  for (const inc of incomes) {
    const y = Number(inc.date.slice(0, 4));
    if (Number.isFinite(y)) yearsSet.add(y);
  }

  const years = Array.from(yearsSet).sort((a, b) => a - b);
  return years.map((year) => {
    const prefix = `${year}-`;
    const expense = expenses
      .filter((e) => e.date.startsWith(prefix))
      .reduce((s, e) => s + e.amount, 0);
    const income = incomes
      .filter((i) => i.date.startsWith(prefix))
      .reduce((s, i) => s + i.amount, 0);
    return { year, expense, income };
  });
}
