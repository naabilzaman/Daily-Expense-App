
import { Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.SALARY]: '#10b981',
  [Category.FREELANCE]: '#34d399',
  [Category.INVESTMENT]: '#059669',
  [Category.FOOD]: '#f87171',
  [Category.TRANSPORT]: '#60a5fa',
  [Category.RENT]: '#818cf8',
  [Category.SHOPPING]: '#fbbf24',
  [Category.ENTERTAINMENT]: '#c084fc',
  [Category.HEALTH]: '#f472b6',
  [Category.OTHERS]: '#94a3b8'
};

export const INCOME_CATEGORIES = [Category.SALARY, Category.FREELANCE, Category.INVESTMENT, Category.OTHERS];
export const EXPENSE_CATEGORIES = [Category.FOOD, Category.TRANSPORT, Category.RENT, Category.SHOPPING, Category.ENTERTAINMENT, Category.HEALTH, Category.OTHERS];
