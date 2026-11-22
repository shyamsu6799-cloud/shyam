import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Database,
  FileText,
  Home,
  LayoutGrid,
  ListOrdered,
  Lock,
  Moon,
  PiggyBank,
  Plus,
  Sun,
  X,
} from 'lucide-react';
import { AnalyticsView } from './components/AnalyticsView';
import { BudgetsView } from './components/BudgetsView';
import { CategoryModal } from './components/CategoryModal';
import { DashboardView } from './components/DashboardView';
import { ExpenseModal } from './components/ExpenseModal';
import { IncomeModal } from './components/IncomeModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PinLockScreen } from './components/PinLockScreen';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ReceiptPreviewModal } from './components/ReceiptPreviewModal';
import { ReportsView } from './components/ReportsView';
import { SettingsBackupView } from './components/SettingsBackupView';
import { TransactionsView } from './components/TransactionsView';
import {
  clearAllTransactions,
  deleteCustomCategory,
  deleteExpense,
  deleteIncome,
  getAllCategories,
  getAllExpenses,
  getAllIncomes,
  getBudget,
  initializeDatabase,
  restoreBackupData,
  saveBudget,
  saveCategory,
  saveExpense,
  saveIncome,
  saveSettings,
} from './db/indexedDb';
import type {
  AppSettings,
  AppView,
  BackupPayload,
  BudgetConfig,
  Expense,
  ExpenseCategory,
  Income,
} from './types/expense';
import { computeDashboardMetrics } from './utils/calculations';
import { formatINR, getTodayISO } from './utils/formatters';

const NAV_ITEMS: Array<{
  id: AppView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'transactions', label: 'Transactions', icon: ListOrdered },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'analytics', label: 'Charts', icon: BarChart3 },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  { id: 'settings', label: 'Backup & Settings', icon: Database },
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState('');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [budget, setBudget] = useState<BudgetConfig>({
    id: 'default',
    monthlyLimit: 0,
    warningThresholdPct: 80,
    categoryLimits: {},
    updatedAt: 0,
  });
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    ownerName: 'Shyam',
  });

  const [isUnlocked, setIsUnlocked] = useState(true);
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [showMobileMore, setShowMobileMore] = useState(false);

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  const [receiptPreview, setReceiptPreview] = useState<{ src: string; title: string } | null>(
    null
  );

  const applyThemeClass = useCallback((theme: 'light' | 'dark') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    initializeDatabase()
      .then((res) => {
        if (!mounted) return;
        setExpenses(res.expenses);
        setIncomes(res.incomes);
        setCategories(res.categories);
        setBudget(res.budget);
        setSettings(res.settings);
        applyThemeClass(res.settings.theme);
        if (res.settings.pinHash) {
          setIsUnlocked(false);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setDbError(err instanceof Error ? err.message : 'Failed to initialize local database.');
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [applyThemeClass]);

  const metrics = useMemo(
    () => computeDashboardMetrics(expenses, incomes, categories, budget),
    [expenses, incomes, categories, budget]
  );

  const monthCategorySpend = useMemo(() => {
    const prefix = getTodayISO().slice(0, 7);
    const out: Record<string, number> = {};
    for (const e of expenses) {
      if (e.date.startsWith(prefix)) {
        out[e.categoryId] = (out[e.categoryId] ?? 0) + e.amount;
      }
    }
    return out;
  }, [expenses]);

  const handleSaveExpense = async (expense: Expense) => {
    await saveExpense(expense);
    setExpenses(await getAllExpenses());
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
    setExpenses(await getAllExpenses());
  };

  const handleSaveIncome = async (income: Income) => {
    await saveIncome(income);
    setIncomes(await getAllIncomes());
  };

  const handleDeleteIncome = async (id: string) => {
    await deleteIncome(id);
    setIncomes(await getAllIncomes());
  };

  const handleSaveCategory = async (category: ExpenseCategory) => {
    await saveCategory(category);
    setCategories(await getAllCategories());
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCustomCategory(id);
    const [nextCats, nextExps] = await Promise.all([getAllCategories(), getAllExpenses()]);
    setCategories(nextCats);
    setExpenses(nextExps);
  };

  const handleSaveBudget = async (nextBudget: BudgetConfig) => {
    await saveBudget(nextBudget);
    setBudget(await getBudget());
  };

  const handleUpdateSettings = async (next: AppSettings) => {
    await saveSettings(next);
    setSettings(next);
    applyThemeClass(next.theme);
  };

  const toggleTheme = () => {
    handleUpdateSettings({
      ...settings,
      theme: settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  const handleRestoreBackup = async (payload: BackupPayload, mode: 'replace' | 'merge') => {
    await restoreBackupData(payload, mode);
    const [exps, incs, cats, bud] = await Promise.all([
      getAllExpenses(),
      getAllIncomes(),
      getAllCategories(),
      getBudget(),
    ]);
    setExpenses(exps);
    setIncomes(incs);
    setCategories(cats);
    setBudget(bud);
  };

  const handleClearAllTransactions = async () => {
    await clearAllTransactions();
    const [exps, incs, bud] = await Promise.all([
      getAllExpenses(),
      getAllIncomes(),
      getBudget(),
    ]);
    setExpenses(exps);
    setIncomes(incs);
    setBudget(bud);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-10 h-10 rounded-full border-2 border-teal-700 border-t-transparent animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
          Loading SHYAM EXPENSE MANAGER...
        </p>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 p-6 text-center">
          <h1 className="text-lg font-bold text-red-700 dark:text-red-400">
            Local Storage Unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{dbError}</p>
        </div>
      </div>
    );
  }

  if (settings.pinHash && !isUnlocked) {
    return (
      <PinLockScreen
        expectedPinHash={settings.pinHash}
        ownerName={settings.ownerName}
        onUnlock={() => setIsUnlocked(true)}
      />
    );
  }

  const activeNavItem = NAV_ITEMS.find((n) => n.id === activeView) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800">
          <span className="block text-base font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            SHYAM EXPENSE MANAGER
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {settings.ownerName ? `${settings.ownerName}'s Personal Ledger` : 'Personal Ledger'}
          </span>
        </div>

        <div className="p-4">
          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setExpenseModalOpen(true);
            }}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`w-full min-h-[44px] flex items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <PWAInstallButton variant="full" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex-1 min-h-[40px] flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {settings.theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            {settings.pinHash && (
              <button
                type="button"
                onClick={() => setIsUnlocked(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                title="Lock App"
                aria-label="Lock App"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="no-print sticky top-0 z-30 h-14 lg:h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              <span className="lg:hidden">SHYAM EXPENSE MANAGER · </span>
              {activeNavItem.label}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 font-mono-nums whitespace-nowrap">
              This Month: <strong className="text-slate-900 dark:text-slate-100">{formatINR(metrics.monthExpenses)}</strong>
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              aria-label="Toggle dark or light mode"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <div className="hidden sm:block">
              <PWAInstallButton variant="compact" />
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 px-3.5 text-xs font-semibold text-white whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </header>

        {/* Active View Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-5 pb-24 lg:pb-8">
          {activeView === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              expenses={expenses}
              incomes={incomes}
              categories={categories}
              budget={budget}
              onAddExpense={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              onAddIncome={() => {
                setEditingIncome(null);
                setIncomeModalOpen(true);
              }}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setExpenseModalOpen(true);
              }}
              onPreviewReceipt={(src, title) => setReceiptPreview({ src, title })}
              onNavigate={(view) => setActiveView(view)}
            />
          )}

          {activeView === 'transactions' && (
            <TransactionsView
              expenses={expenses}
              incomes={incomes}
              categories={categories}
              onAddExpense={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setExpenseModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              onAddIncome={() => {
                setEditingIncome(null);
                setIncomeModalOpen(true);
              }}
              onEditIncome={(inc) => {
                setEditingIncome(inc);
                setIncomeModalOpen(true);
              }}
              onDeleteIncome={handleDeleteIncome}
              onPreviewReceipt={(src, title) => setReceiptPreview({ src, title })}
            />
          )}

          {activeView === 'reports' && (
            <ReportsView
              expenses={expenses}
              incomes={incomes}
              categories={categories}
              budget={budget}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsView
              expenses={expenses}
              incomes={incomes}
              categories={categories}
              budget={budget}
            />
          )}

          {activeView === 'budgets' && (
            <BudgetsView
              expenses={expenses}
              categories={categories}
              budget={budget}
              onSaveBudget={handleSaveBudget}
              onOpenNewCategory={() => {
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
              onEditCategory={(cat) => {
                setEditingCategory(cat);
                setCategoryModalOpen(true);
              }}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeView === 'settings' && (
            <SettingsBackupView
              settings={settings}
              expenseCount={expenses.length}
              incomeCount={incomes.length}
              categoryCount={categories.length}
              onUpdateSettings={handleUpdateSettings}
              onRestoreBackup={handleRestoreBackup}
              onClearAllTransactions={handleClearAllTransactions}
            />
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <button
            type="button"
            onClick={() => {
              setActiveView('dashboard');
              setShowMobileMore(false);
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              activeView === 'dashboard' && !showMobileMore
                ? 'text-teal-700 dark:text-teal-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('transactions');
              setShowMobileMore(false);
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              activeView === 'transactions' && !showMobileMore
                ? 'text-teal-700 dark:text-teal-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ListOrdered className="w-5 h-5" />
            <span className="text-[10px]">Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMobileMore(false);
              setEditingExpense(null);
              setExpenseModalOpen(true);
            }}
            className="flex flex-col items-center justify-center"
            aria-label="Add Expense"
          >
            <span className="w-11 h-11 rounded-2xl bg-teal-700 dark:bg-teal-600 text-white flex items-center justify-center shadow-md">
              <Plus className="w-6 h-6" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('reports');
              setShowMobileMore(false);
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              activeView === 'reports' && !showMobileMore
                ? 'text-teal-700 dark:text-teal-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px]">Reports</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMobileMore((prev) => !prev)}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              showMobileMore ||
              activeView === 'analytics' ||
              activeView === 'budgets' ||
              activeView === 'settings'
                ? 'text-teal-700 dark:text-teal-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Bottom Sheet */}
      {showMobileMore && (
        <div
          className="no-print lg:hidden fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-xs"
          onClick={() => setShowMobileMore(false)}
        >
          <div
            className="w-full rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 pb-8 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Tools & Settings
              </span>
              <button
                type="button"
                onClick={() => setShowMobileMore(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setActiveView('analytics');
                  setShowMobileMore(false);
                }}
                className="min-h-[48px] flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 text-xs font-semibold"
              >
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>Charts</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('budgets');
                  setShowMobileMore(false);
                }}
                className="min-h-[48px] flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 text-xs font-semibold"
              >
                <PiggyBank className="w-4 h-4 text-teal-600" />
                <span>Budgets & Categories</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('settings');
                  setShowMobileMore(false);
                }}
                className="min-h-[48px] flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 text-xs font-semibold"
              >
                <Database className="w-4 h-4 text-teal-600" />
                <span>Backup & Settings</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobileMore(false);
                  setEditingIncome(null);
                  setIncomeModalOpen(true);
                }}
                className="min-h-[48px] flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 px-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300"
              >
                <Plus className="w-4 h-4" />
                <span>Add Income</span>
              </button>
            </div>

            <PWAInstallButton variant="full" />

            {settings.pinHash && (
              <button
                type="button"
                onClick={() => {
                  setShowMobileMore(false);
                  setIsUnlocked(false);
                }}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <Lock className="w-4 h-4" />
                <span>Lock App</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        editingExpense={editingExpense}
        categories={categories}
        budget={budget}
        currentMonthExpenses={metrics.monthExpenses}
        monthCategorySpend={monthCategorySpend}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        onOpenNewCategory={() => {
          setEditingCategory(null);
          setCategoryModalOpen(true);
        }}
      />

      <IncomeModal
        isOpen={incomeModalOpen}
        editingIncome={editingIncome}
        onClose={() => {
          setIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveIncome}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        editingCategory={editingCategory}
        existingNames={categories.map((c) => c.name)}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
      />

      <ReceiptPreviewModal
        imageSrc={receiptPreview?.src ?? null}
        title={receiptPreview?.title}
        onClose={() => setReceiptPreview(null)}
      />

      <OfflineIndicator />
    </div>
  );
}
