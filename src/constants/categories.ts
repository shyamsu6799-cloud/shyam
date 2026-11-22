import type { ExpenseCategory, IncomeSource, PaymentMethod } from '../types/expense';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Cash',
  'Debit Card',
  'Credit Card',
  'Net Banking',
  'Wallet',
];

export const INCOME_SOURCES: IncomeSource[] = [
  'Salary',
  'Business',
  'Freelance',
  'Investment',
  'Rental',
  'Gift',
  'Other',
];

export const CATEGORY_ICON_OPTIONS = [
  'ShoppingBasket',
  'Milk',
  'Fuel',
  'Truck',
  'Zap',
  'Droplets',
  'Smartphone',
  'Wifi',
  'ShoppingBag',
  'GraduationCap',
  'HeartPulse',
  'Home',
  'Car',
  'Utensils',
  'Receipt',
  'Wrench',
  'Plane',
  'Gift',
  'Dumbbell',
  'Briefcase',
  'Shield',
  'Sparkles',
] as const;

export const CATEGORY_COLOR_OPTIONS = [
  '#0F766E', // Teal
  '#0284C7', // Sky
  '#2563EB', // Blue
  '#D97706', // Amber
  '#DC2626', // Crimson
  '#16A34A', // Green
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#EA580C', // Orange
  '#475569', // Slate
];

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat_grocery', name: 'Grocery', icon: 'ShoppingBasket', color: '#16A34A', isCustom: false, createdAt: 1 },
  { id: 'cat_milk', name: 'Milk', icon: 'Milk', color: '#0284C7', isCustom: false, createdAt: 2 },
  { id: 'cat_petrol', name: 'Petrol', icon: 'Fuel', color: '#EA580C', isCustom: false, createdAt: 3 },
  { id: 'cat_diesel', name: 'Diesel', icon: 'Truck', color: '#B45309', isCustom: false, createdAt: 4 },
  { id: 'cat_electricity', name: 'Electricity Bill', icon: 'Zap', color: '#D97706', isCustom: false, createdAt: 5 },
  { id: 'cat_water', name: 'Water Bill', icon: 'Droplets', color: '#0EA5E9', isCustom: false, createdAt: 6 },
  { id: 'cat_mobile', name: 'Mobile Recharge', icon: 'Smartphone', color: '#2563EB', isCustom: false, createdAt: 7 },
  { id: 'cat_internet', name: 'Internet Bill', icon: 'Wifi', color: '#4F46E5', isCustom: false, createdAt: 8 },
  { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#DB2777', isCustom: false, createdAt: 9 },
  { id: 'cat_education', name: 'Education', icon: 'GraduationCap', color: '#7C3AED', isCustom: false, createdAt: 10 },
  { id: 'cat_medical', name: 'Medical', icon: 'HeartPulse', color: '#DC2626', isCustom: false, createdAt: 11 },
  { id: 'cat_rent', name: 'House Rent', icon: 'Home', color: '#0F766E', isCustom: false, createdAt: 12 },
  { id: 'cat_transport', name: 'Transportation', icon: 'Car', color: '#0D9488', isCustom: false, createdAt: 13 },
  { id: 'cat_food', name: 'Food', icon: 'Utensils', color: '#E11D48', isCustom: false, createdAt: 14 },
  { id: 'cat_other', name: 'Other Expenses', icon: 'Receipt', color: '#475569', isCustom: false, createdAt: 15 },
];
