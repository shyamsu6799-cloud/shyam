export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Debit Card'
  | 'Credit Card'
  | 'Net Banking'
  | 'Wallet';

export type IncomeSource =
  | 'Salary'
  | 'Business'
  | 'Freelance'
  | 'Investment'
  | 'Rental'
  | 'Gift'
  | 'Other';

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom: boolean;
  createdAt: number;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
  paymentMethod: PaymentMethod;
  receiptImage?: string; // base64 JPEG data URL
  createdAt: number;
  updatedAt: number;
}

export interface Income {
  id: string;
  amount: number;
  source: IncomeSource;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
  paymentMethod: PaymentMethod;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetConfig {
  id: 'default';
  monthlyLimit: number; // 0 means unset
  warningThresholdPct: number; // e.g., 80
  categoryLimits: Record<string, number>;
  updatedAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  ownerName: string;
  pinHash?: string;
}

export type ReportPeriod =
  | 'daily'
  | 'datewise'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'halfyearly'
  | 'yearly'
  | 'custom';

export interface ExpenseFilter {
  searchQuery: string;
  categoryId: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export interface BackupPayload {
  app: 'SHYAM EXPENSE MANAGER';
  schemaVersion: 1;
  exportedAt: string;
  data: {
    expenses: Expense[];
    incomes: Income[];
    categories: ExpenseCategory[];
    budget: BudgetConfig;
  };
}

export type AppView =
  | 'dashboard'
  | 'transactions'
  | 'reports'
  | 'analytics'
  | 'budgets'
  | 'settings';
