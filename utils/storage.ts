
import { Transaction, User } from '../types';

const STORAGE_KEY_TRANSACTIONS = 'sepro_transactions';
const STORAGE_KEY_USER = 'sepro_user';
const STORAGE_KEY_ACCOUNTS = 'sepro_accounts';

export const storage = {
  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  },
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    if (!data || data === 'null') return null;
    return JSON.parse(data);
  },
  setUser: (user: User | null) => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  },
  getAccounts: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    return data ? JSON.parse(data) : [];
  },
  saveAccount: (user: User) => {
    const accounts = storage.getAccounts();
    const existingIndex = accounts.findIndex(a => a.username === user.username);
    if (existingIndex > -1) {
      accounts[existingIndex] = user;
    } else {
      accounts.push(user);
    }
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  },
  exportFullData: () => {
    return {
      transactions: storage.getTransactions(),
      accounts: storage.getAccounts(),
      currentUser: storage.getUser(),
      exportDate: new Date().toISOString(),
      version: "1.1.0"
    };
  },
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEY_USER);
  }
};
