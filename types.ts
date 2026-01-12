
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum Category {
  SALARY = 'Salary',
  FREELANCE = 'Freelance',
  INVESTMENT = 'Investment',
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  RENT = 'Rent',
  SHOPPING = 'Shopping',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health',
  OTHERS = 'Others'
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
  createdAt: string;
  note: string;
}

export interface User {
  name: string;
  username: string;
  email: string;
  password?: string;
  avatarUrl?: string;
}

export interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expenseRatio: number;
}
