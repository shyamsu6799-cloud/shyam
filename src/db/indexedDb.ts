import { DEFAULT_CATEGORIES } from '../constants/categories';
import type {
  AppSettings,
  BackupPayload,
  BudgetConfig,
  Expense,
  ExpenseCategory,
  Income,
} from '../types/expense';

const DB_NAME = 'shyam_expense_manager_db';
const DB_VERSION = 1;

const STORES = {
  EXPENSES: 'expenses',
  INCOMES: 'incomes',
  CATEGORIES: 'categories',
  BUDGETS: 'budgets',
  SETTINGS: 'settings',
} as const;

const DEFAULT_BUDGET: BudgetConfig = {
  id: 'default',
  monthlyLimit: 0,
  warningThresholdPct: 80,
  categoryLimits: {},
  updatedAt: Date.now(),
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  ownerName: 'Shyam',
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
        const expStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
        expStore.createIndex('date', 'date', { unique: false });
        expStore.createIndex('categoryId', 'categoryId', { unique: false });
        expStore.createIndex('paymentMethod', 'paymentMethod', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.INCOMES)) {
        const incStore = db.createObjectStore(STORES.INCOMES, { keyPath: 'id' });
        incStore.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.BUDGETS)) {
        db.createObjectStore(STORES.BUDGETS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open local database.'));
  });

  return dbPromise;
}

function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Database operation failed.'));
  });
}

function waitTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Database transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('Database transaction aborted.'));
  });
}

export async function initializeDatabase(): Promise<{
  expenses: Expense[];
  incomes: Income[];
  categories: ExpenseCategory[];
  budget: BudgetConfig;
  settings: AppSettings;
}> {
  const db = await openDatabase();

  // Seed default 15 categories if empty (only categories, zero fake expenses)
  const existingCats = await getAllCategories();
  if (existingCats.length === 0) {
    const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
    const store = tx.objectStore(STORES.CATEGORIES);
    for (const cat of DEFAULT_CATEGORIES) {
      store.put(cat);
    }
    await waitTransaction(tx);
  } else {
    // Ensure all 15 default categories exist if missing
    const existingIds = new Set(existingCats.map((c) => c.id));
    const missingDefaults = DEFAULT_CATEGORIES.filter((d) => !existingIds.has(d.id));
    if (missingDefaults.length > 0) {
      const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
      const store = tx.objectStore(STORES.CATEGORIES);
      for (const cat of missingDefaults) {
        store.put(cat);
      }
      await waitTransaction(tx);
    }
  }

  const [expenses, incomes, categories, budget, settings] = await Promise.all([
    getAllExpenses(),
    getAllIncomes(),
    getAllCategories(),
    getBudget(),
    getSettings(),
  ]);

  return { expenses, incomes, categories, budget, settings };
}

export async function getAllExpenses(): Promise<Expense[]> {
  const db = await openDatabase();
  const tx = db.transaction(STORES.EXPENSES, 'readonly');
  const rows = await promisifyRequest(tx.objectStore(STORES.EXPENSES).getAll());
  return (rows as Expense[]).sort((a, b) => {
    const dtA = `${a.date}T${a.time || '00:00'}`;
    const dtB = `${b.date}T${b.time || '00:00'}`;
    if (dtB !== dtA) return dtB.localeCompare(dtA);
    return b.createdAt - a.createdAt;
  });
}

export async function saveExpense(expense: Expense): Promise<void> {
  if (!Number.isFinite(expense.amount) || expense.amount <= 0) {
    throw new Error('Expense amount must be greater than zero.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expense.date)) {
    throw new Error('Invalid expense date format.');
  }
  if (!expense.categoryId) {
    throw new Error('Please select an expense category.');
  }
  const db = await openDatabase();
  const tx = db.transaction(STORES.EXPENSES, 'readwrite');
  tx.objectStore(STORES.EXPENSES).put({
    ...expense,
    description: expense.description.trim(),
  });
  await waitTransaction(tx);
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORES.EXPENSES, 'readwrite');
  tx.objectStore(STORES.EXPENSES).delete(id);
  await waitTransaction(tx);
}

export async function getAllIncomes(): Promise<Income[]> {
  const db = await openDatabase();
  const tx = db.transaction(STORES.INCOMES, 'readonly');
  const rows = await promisifyRequest(tx.objectStore(STORES.INCOMES).getAll());
  return (rows as Income[]).sort((a, b) => {
    const dtA = `${a.date}T${a.time || '00:00'}`;
    const dtB = `${b.date}T${b.time || '00:00'}`;
    if (dtB !== dtA) return dtB.localeCompare(dtA);
    return b.createdAt - a.createdAt;
  });
}

export async function saveIncome(income: Income): Promise<void> {
  if (!Number.isFinite(income.amount) || income.amount <= 0) {
    throw new Error('Income amount must be greater than zero.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(income.date)) {
    throw new Error('Invalid income date format.');
  }
  const db = await openDatabase();
  const tx = db.transaction(STORES.INCOMES, 'readwrite');
  tx.objectStore(STORES.INCOMES).put({
    ...income,
    description: income.description.trim(),
  });
  await waitTransaction(tx);
}

export async function deleteIncome(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORES.INCOMES, 'readwrite');
  tx.objectStore(STORES.INCOMES).delete(id);
  await waitTransaction(tx);
}

export async function getAllCategories(): Promise<ExpenseCategory[]> {
  const db = await openDatabase();
  const tx = db.transaction(STORES.CATEGORIES, 'readonly');
  const rows = await promisifyRequest(tx.objectStore(STORES.CATEGORIES).getAll());
  return (rows as ExpenseCategory[]).sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveCategory(category: ExpenseCategory): Promise<void> {
  if (!category.name.trim()) {
    throw new Error('Category name cannot be empty.');
  }
  const db = await openDatabase();
  const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
  tx.objectStore(STORES.CATEGORIES).put({
    ...category,
    name: category.name.trim(),
  });
  await waitTransaction(tx);
}

export async function deleteCustomCategory(categoryId: string): Promise<void> {
  const db = await openDatabase();
  const categories = await getAllCategories();
  const target = categories.find((c) => c.id === categoryId);
  if (!target) return;
  if (!target.isCustom) {
    throw new Error('Default categories cannot be deleted.');
  }

  // Reassign any expenses in this custom category to Other Expenses ('cat_other')
  const expenses = await getAllExpenses();
  const affected = expenses.filter((e) => e.categoryId === categoryId);

  const tx = db.transaction([STORES.CATEGORIES, STORES.EXPENSES], 'readwrite');
  tx.objectStore(STORES.CATEGORIES).delete(categoryId);
  const expStore = tx.objectStore(STORES.EXPENSES);
  for (const exp of affected) {
    expStore.put({ ...exp, categoryId: 'cat_other', updatedAt: Date.now() });
  }
  await waitTransaction(tx);
}

export async function getBudget(): Promise<BudgetConfig> {
  const db = await openDatabase();
  const tx = db.transaction(STORES.BUDGETS, 'readonly');
  const res = await promisifyRequest(tx.objectStore(STORES.BUDGETS).get('default'));
  return (res as BudgetConfig) ?? { ...DEFAULT_BUDGET };
}

export async function saveBudget(budget: BudgetConfig): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORES.BUDGETS, 'readwrite');
  tx.objectStore(STORES.BUDGETS).put({
    ...budget,
    id: 'default',
    updatedAt: Date.now(),
  });
  await waitTransaction(tx);
}

export async function getSettings(): Promise<AppSettings> {
  const db = await openDatabase();
  const tx = db.transaction(STORES.SETTINGS, 'readonly');
  const res = await promisifyRequest(tx.objectStore(STORES.SETTINGS).get('app_settings'));
  if (res && typeof res === 'object' && 'value' in res) {
    return res.value as AppSettings;
  }
  let localTheme: 'light' | 'dark' = 'light';
  try {
    const saved = localStorage.getItem('shyam_expense_theme');
    if (saved === 'dark') localTheme = 'dark';
  } catch {
    // ignore storage errors
  }
  return { ...DEFAULT_SETTINGS, theme: localTheme };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    localStorage.setItem('shyam_expense_theme', settings.theme);
  } catch {
    // ignore
  }
  const db = await openDatabase();
  const tx = db.transaction(STORES.SETTINGS, 'readwrite');
  tx.objectStore(STORES.SETTINGS).put({ key: 'app_settings', value: settings });
  await waitTransaction(tx);
}

export async function exportBackupData(): Promise<BackupPayload> {
  const [expenses, incomes, categories, budget] = await Promise.all([
    getAllExpenses(),
    getAllIncomes(),
    getAllCategories(),
    getBudget(),
  ]);
  return {
    app: 'SHYAM EXPENSE MANAGER',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {
      expenses,
      incomes,
      categories,
      budget,
    },
  };
}

export async function restoreBackupData(
  payload: BackupPayload,
  mode: 'replace' | 'merge'
): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(
    [STORES.EXPENSES, STORES.INCOMES, STORES.CATEGORIES, STORES.BUDGETS],
    'readwrite'
  );

  const expStore = tx.objectStore(STORES.EXPENSES);
  const incStore = tx.objectStore(STORES.INCOMES);
  const catStore = tx.objectStore(STORES.CATEGORIES);
  const budStore = tx.objectStore(STORES.BUDGETS);

  if (mode === 'replace') {
    expStore.clear();
    incStore.clear();
    catStore.clear();
    budStore.clear();
    for (const def of DEFAULT_CATEGORIES) {
      catStore.put(def);
    }
  }

  for (const cat of payload.data.categories) {
    catStore.put(cat);
  }
  for (const exp of payload.data.expenses) {
    expStore.put(exp);
  }
  for (const inc of payload.data.incomes) {
    incStore.put(inc);
  }
  if (payload.data.budget) {
    budStore.put({ ...payload.data.budget, id: 'default' });
  }

  await waitTransaction(tx);
}

export async function clearAllTransactions(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction([STORES.EXPENSES, STORES.INCOMES, STORES.BUDGETS], 'readwrite');
  tx.objectStore(STORES.EXPENSES).clear();
  tx.objectStore(STORES.INCOMES).clear();
  tx.objectStore(STORES.BUDGETS).clear();
  await waitTransaction(tx);
}

export async function hashPin(pin: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(`shyam_expense_${pin}`);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic hash if subtle unavailable
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = (h << 5) - h + pin.charCodeAt(i);
    h |= 0;
  }
  return `pin_${Math.abs(h)}`;
}
