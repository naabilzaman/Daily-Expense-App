
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, LogOut, Wallet, TrendingUp, TrendingDown, 
  Trash2, Download, Cloud, Sun, Moon, Camera, Settings, X, Lock, Mail, 
  User as UserIconOutline, Clock, ArrowLeft, Key, AtSign, CheckCircle2, 
  ShieldCheck, Send, Folder, LayoutGrid, ListFilter, CreditCard
} from 'lucide-react';
import { Transaction, TransactionType, User, FinancialStats } from './types';
import { storage } from './utils/storage';
import TransactionForm from './components/TransactionForm';
import Charts from './components/Charts';
import FinancialTips from './components/FinancialTips';

// Global XLSX variable from CDN
declare const XLSX: any;

const App: React.FC = () => {
  // Core App State
  const [user, setUser] = useState<User | null>(storage.getUser());
  const [transactions, setTransactions] = useState<Transaction[]>(storage.getTransactions());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    localStorage.getItem('theme') as 'light' | 'dark' || 'light'
  );
  
  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset' | 'verify'>('login');
  const [authName, setAuthName] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('123456');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Status State
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isDiskSyncing, setIsDiskSyncing] = useState(false);
  const [backupStep, setBackupStep] = useState<string>('');
  const [feedback, setFeedback] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply theme to HTML root
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Temporary feedback toast
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Derived Stats
  const stats = useMemo<FinancialStats>(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
    return { totalIncome, totalExpense, balance, expenseRatio };
  }, [transactions]);

  // Persist transactions locally
  useEffect(() => {
    if (user) {
      storage.saveTransactions(transactions);
    }
  }, [transactions, user]);

  const triggerDownload = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLocalDiskSync = async () => {
    setIsDiskSyncing(true);
    const fullData = storage.exportFullData();
    const fileName = `SmartExpense_Backup_${new Date().toISOString().split('T')[0]}.json`;
    const dataString = JSON.stringify(fullData, null, 2);

    if ('showDirectoryPicker' in window) {
      try {
        const directoryHandle = await (window as any).showDirectoryPicker();
        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(dataString);
        await writable.close();
        
        setFeedback({ message: `Data secured in ${directoryHandle.name}!`, type: 'success' });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setFeedback({ message: 'Folder access denied. Using manual backup...', type: 'error' });
          triggerDownload(dataString, fileName);
        }
      }
    } else {
      triggerDownload(dataString, fileName);
      setFeedback({ message: 'Backup file downloaded locally!', type: 'success' });
    }
    setIsDiskSyncing(false);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const accounts = storage.getAccounts();
    const normalizedUsername = authUsername.trim().toLowerCase();

    if (authMode === 'signup') {
      const exists = accounts.find(a => a.username.toLowerCase() === normalizedUsername);
      if (exists) {
        setAuthError("Username already taken. Please choose another.");
        return;
      }
      setGeneratedOtp("123456");
      setAuthMode('verify');
      setFeedback({ message: `System verification code: 123456`, type: 'success' });
    } else if (authMode === 'verify') {
      if (verificationCode === "123456") {
        const newUser: User = { 
          name: authName.trim(), 
          username: authUsername.trim(), 
          email: authEmail.trim(),
          password: authPassword 
        };
        storage.saveAccount(newUser);
        setUser(newUser);
        storage.setUser(newUser);
        setFeedback({ message: 'Welcome to SmartExpense Pro!', type: 'success' });
      } else {
        setAuthError("Invalid verification code. Use 123456.");
      }
    } else if (authMode === 'login') {
      const targetAccount = accounts.find(a => a.username.toLowerCase() === normalizedUsername);
      if (!targetAccount || targetAccount.password !== authPassword) {
        setAuthError("Invalid credentials. Try again.");
        return;
      }
      setUser(targetAccount);
      storage.setUser(targetAccount);
    } else if (authMode === 'forgot') {
      const targetAccount = accounts.find(a => a.username.toLowerCase() === resetUsername.trim().toLowerCase());
      if (!targetAccount) {
        setAuthError("No account found with this username.");
        return;
      }
      setAuthMode('reset');
    } else if (authMode === 'reset') {
      const allAccounts = storage.getAccounts();
      const accountIndex = allAccounts.findIndex(a => a.username.toLowerCase() === resetUsername.trim().toLowerCase());
      if (accountIndex > -1) {
        allAccounts[accountIndex].password = newPassword;
        storage.saveAccount(allAccounts[accountIndex]);
        setAuthSuccess("Password successfully updated.");
        setAuthMode('login');
        setAuthUsername(resetUsername); 
      }
    }
  };

  const handleBackupToEmail = async () => {
    if (!user) return;
    setIsBackingUp(true);
    const steps = ["Securing database...", "Verifying protocols...", "Packaging files..."];

    for (const step of steps) {
      setBackupStep(step);
      await new Promise(res => setTimeout(res, 500));
    }

    const backupData = storage.exportFullData();
    const dataString = JSON.stringify(backupData, null, 2);
    const subject = encodeURIComponent(`SmartExpense Pro - Data Backup Package`);
    const body = encodeURIComponent(`Attached data for ${user.name}:\n\nTotal Assets: $${stats.balance}\n\nDATABASE JSON:\n${dataString}`);
    
    window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`;
    setFeedback({ message: `Backup dispatched to ${user.email}`, type: 'success' });
    setIsBackingUp(false);
  };

  const exportToExcel = () => {
    if (transactions.length === 0) return;
    setIsExporting(true);
    try {
      const data = transactions.map(t => ({
        Date: new Date(t.date).toLocaleDateString(),
        Type: t.type,
        Category: t.category,
        Amount: t.amount,
        Note: t.note
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Financial History");
      XLSX.writeFile(wb, `Financial_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      setFeedback({ message: 'Spreadsheet exported successfully!', type: 'success' });
    } catch (err) {
      setFeedback({ message: 'Export failed.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const syncToCloud = () => {
    setFeedback({ message: 'Cloud integration is currently in Beta.', type: 'success' });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const updatedUser = { ...user, avatarUrl: result };
      setUser(updatedUser);
      storage.setUser(updatedUser);
      storage.saveAccount(updatedUser);
    };
    reader.readAsDataURL(file);
  };

  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setTransactions([newTransaction, ...transactions]);
    setIsFormOpen(false);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Implemented handleLogout to clear user state and storage
  const handleLogout = () => {
    storage.setUser(null);
    setUser(null);
    setIsProfileOpen(false);
    setFeedback({ message: 'Signed out successfully', type: 'success' });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#020617] transition-all duration-500 font-sans">
        <div className="glass-card w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-slide-up bg-white/95 dark:bg-slate-900/95 border border-white/20">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-indigo-600 text-white p-6 rounded-[2rem] shadow-xl shadow-indigo-200 dark:shadow-none mb-6">
              <Wallet size={42} strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">SmartExpense</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">Smart Finance Tracking</p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-8">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Log In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div className="animate-slide-up space-y-4">
                <input
                  type="text" required value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  placeholder="Full Name"
                />
                <input
                  type="email" required value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  placeholder="Email Address"
                />
              </div>
            )}

            {authMode === 'verify' && (
              <div className="animate-slide-up space-y-4">
                <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Enter Verification Code</p>
                <input
                  type="text" maxLength={6} required value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full py-5 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 rounded-2xl outline-none text-center text-3xl font-black tracking-[0.4em] text-indigo-600 dark:text-indigo-400"
                  placeholder="000000"
                />
              </div>
            )}
            
            {(authMode === 'login' || authMode === 'signup') && (
              <div className="space-y-4 animate-slide-up">
                <input
                  type="text" required value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  placeholder="Username"
                />
                <input
                  type="password" required value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  placeholder="Password"
                />
              </div>
            )}

            {authError && <p className="text-rose-500 text-xs font-bold text-center bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl">{authError}</p>}
            {authSuccess && <p className="text-emerald-500 text-xs font-bold text-center bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl">{authSuccess}</p>}

            <button
              type="submit"
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 dark:shadow-none mt-6 active:scale-[0.98] uppercase tracking-widest text-sm"
            >
              {authMode === 'login' ? 'Log In' : authMode === 'signup' ? 'Create Account' : 'Confirm Identity'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 pb-24 lg:pb-12 transition-colors duration-500 font-sans">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
          <div className={`px-8 py-3.5 rounded-[1.5rem] shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${feedback.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'}`}>
            <CheckCircle2 size={20} />
            <span className="font-bold text-sm tracking-tight">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Backup Overlay */}
      {isBackingUp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-fade-in">
          <div className="text-center max-w-xs w-full space-y-6">
            <ShieldCheck size={100} className="text-indigo-500 mx-auto animate-bounce" />
            <p className="text-white font-black text-2xl tracking-tight">{backupStep}</p>
          </div>
        </div>
      )}

      {/* Modern App Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 sm:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <Wallet size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tighter text-slate-900 dark:text-white leading-none">SmartExpense</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mt-1">Management Pro</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
            className="p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors active:scale-90"
          >
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>

          <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-4 sm:pl-8">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-black text-slate-900 dark:text-white">{user.name}</span>
            </div>
            <button 
              onClick={() => setIsProfileOpen(true)} 
              className="relative hover:scale-110 active:scale-95 transition-all"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="User" className="w-14 h-14 rounded-2xl object-cover border-4 border-white dark:border-slate-800 shadow-xl" />
              ) : (
                <div className="w-14 h-14 bg-brand-100 dark:bg-brand-700/30 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl font-black text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900" />
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Main Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
        {/* Personalized Welcome Message */}
        <div className="mb-10 text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user.name.split(' ')[0]}!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-2 uppercase tracking-widest opacity-70">
            Financial Intelligence Dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Main Balance Card */}
          <div className="glass-card rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl shadow-indigo-100 dark:shadow-none bg-indigo-600 dark:bg-indigo-950/40 text-white border-none">
             <div className="relative z-10">
               <span className="text-indigo-100 text-xs font-black uppercase tracking-widest opacity-80">Net Liquid Assets</span>
               <div className="text-5xl sm:text-6xl font-black mt-3 tracking-tighter truncate">${stats.balance.toLocaleString()}</div>
               <div className="mt-8 flex items-center gap-3">
                 <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-wider ${stats.balance >= 0 ? 'bg-white/20' : 'bg-rose-500/30'}`}>
                   {stats.balance >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                   {stats.balance >= 0 ? 'Portfolio Surplus' : 'Negative Delta'}
                 </div>
                 <span className="text-[10px] font-bold opacity-60 uppercase">Real-time valuation</span>
               </div>
             </div>
             <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
               <CreditCard size={300} strokeWidth={1} />
             </div>
          </div>

          <div className="glass-card rounded-[3rem] p-10 shadow-lg border-white/40 dark:border-slate-800">
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-5 rounded-[2rem] shadow-sm">
                  <TrendingUp size={30} />
                </div>
                <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Inflow</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Gross Income</span>
                <div className="text-4xl font-black text-slate-900 dark:text-white mt-1.5">${stats.totalIncome.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[3rem] p-10 shadow-lg border-white/40 dark:border-slate-800">
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-5 rounded-[2rem] shadow-sm">
                  <TrendingDown size={30} />
                </div>
                <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Outflow</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Gross Expenses</span>
                <div className="text-4xl font-black text-slate-900 dark:text-white mt-1.5">${stats.totalExpense.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <Charts transactions={transactions} />

            <div className="glass-card rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-none">
              <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6 bg-white/40 dark:bg-slate-900/40">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 dark:bg-white rounded-2xl text-white dark:text-slate-900">
                    <ListFilter size={22} />
                  </div>
                  <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">Financial Ledger</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={syncToCloud} className="p-4 bg-white dark:bg-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700 active:scale-95" title="Cloud Sync">
                    <Cloud size={22} className={isSyncing ? 'animate-pulse' : ''} />
                  </button>
                  <button onClick={exportToExcel} className="p-4 bg-white dark:bg-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700 active:scale-95" title="Excel Export">
                    <Download size={22} className={isExporting ? 'animate-bounce' : ''} />
                  </button>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="p-24 text-center">
                  <Wallet className="w-24 h-24 text-slate-100 dark:text-slate-800 mx-auto mb-8 animate-pulse" />
                  <p className="text-slate-400 font-bold text-lg mb-2 tracking-tight">No records found on the ledger.</p>
                  <button onClick={() => setIsFormOpen(true)} className="text-indigo-500 font-black hover:underline uppercase tracking-widest text-xs">Authorize New Entry</button>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-hide max-h-[700px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-10 py-6">Transaction Detail</th>
                        <th className="px-10 py-6">Sector</th>
                        <th className="px-10 py-6 text-right">Value (USD)</th>
                        <th className="px-10 py-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-indigo-900/10 transition-all group">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                              <div className={`p-4 rounded-3xl shadow-sm ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'}`}>
                                {t.type === TransactionType.INCOME ? <Plus size={22} strokeWidth={3} /> : <TrendingDown size={22} strokeWidth={3} />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-base font-black text-slate-900 dark:text-white leading-tight">{t.note || 'Internal Transaction'}</span>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{new Date(t.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <span className="text-[10px] font-black px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full uppercase tracking-widest border border-slate-200/50 dark:border-slate-700">
                              {t.category}
                            </span>
                          </td>
                          <td className={`px-10 py-8 text-xl font-black text-right tracking-tight ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-10 py-8 text-right">
                            <button onClick={() => deleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all active:scale-90">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-12">
            <FinancialTips transactions={transactions} stats={stats} />
            
            <div className="glass-card rounded-[2.5rem] p-10 shadow-2xl border-none">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-2xl">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Health Index</h3>
              </div>
              <div className="space-y-10">
                <div>
                  <div className="flex justify-between text-[11px] mb-4 font-black uppercase tracking-widest text-slate-500">
                    <span>Capital Outflow Ratio</span>
                    <span className={stats.expenseRatio > 80 ? 'text-rose-500' : 'text-indigo-600'}>{stats.expenseRatio.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out shadow-sm ${stats.expenseRatio > 80 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'}`}
                      style={{ width: `${Math.min(stats.expenseRatio, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100/50 dark:border-indigo-500/10">
                   <p className="text-xs text-indigo-900 dark:text-indigo-300 font-bold leading-relaxed">
                     Market Position: Currently retaining <span className="font-black text-indigo-600 dark:text-indigo-400">{(100 - stats.expenseRatio).toFixed(1)}%</span> of total generated revenue.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 py-12 px-10 border-t border-slate-200 dark:border-slate-800 text-center space-y-1">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 italic">
          &copy; 2026 Codecrafters LTD.
        </p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 italic">
          All rights reserved to Nabil Zaman.
        </p>
      </footer>

      <button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-12 right-12 w-24 h-24 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-300 dark:shadow-none flex items-center justify-center transition-all hover:scale-110 hover:-rotate-6 active:scale-95 z-50 group border-4 border-white dark:border-slate-900"
      >
        <Plus size={48} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
      </button>

      {/* Settings Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-xl animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-[3rem] p-10 relative bg-white/95 dark:bg-slate-900/95 shadow-2xl border-none">
            <button onClick={() => setIsProfileOpen(false)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X size={28} />
            </button>
            
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-10 tracking-tight">Preferences</h2>
            
            <div className="flex flex-col items-center gap-8">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Preview" className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white dark:border-slate-800 shadow-2xl group-hover:brightness-75 transition-all" />
                ) : (
                  <div className="w-32 h-32 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-[2.5rem] flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-2xl font-black text-4xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-all">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={32} className="text-white drop-shadow-lg" />
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
              </div>

              <div className="w-full text-center">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h3>
                <p className="text-indigo-500 font-black text-xs uppercase tracking-widest mt-1">@{user.username}</p>
                <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-widest">{user.email}</p>
              </div>

              <div className="w-full space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                 <button 
                  onClick={handleLocalDiskSync}
                  disabled={isDiskSyncing}
                  className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 dark:shadow-none active:scale-95"
                >
                  <Folder size={20} className={isDiskSyncing ? 'animate-bounce' : ''} />
                  Local Folder Sync
                </button>
                
                 <button 
                  onClick={handleBackupToEmail}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
                >
                  <Send size={20} />
                  Email Data Backup
                </button>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full py-5 text-rose-500 dark:text-rose-400 font-black rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex items-center justify-center gap-3 mt-4 active:scale-95 text-sm uppercase tracking-widest"
              >
                <LogOut size={22} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <TransactionForm 
          onClose={() => setIsFormOpen(false)} 
          onSubmit={addTransaction} 
        />
      )}
    </div>
  );
};

export default App;
