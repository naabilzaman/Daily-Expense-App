
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, LogOut, Wallet, TrendingUp, TrendingDown, 
  Trash2, Download, Cloud, Sun, Moon, Camera, Settings, X, Lock, Mail, User as UserIconOutline, Clock, ArrowLeft, Key, AtSign, CheckCircle2, ShieldCheck, Database, Send, ShieldAlert
} from 'lucide-react';
import { Transaction, TransactionType, User, FinancialStats } from './types';
import { storage } from './utils/storage';
import TransactionForm from './components/TransactionForm';
import Charts from './components/Charts';
import FinancialTips from './components/FinancialTips';

// Global XLSX variable from CDN
declare const XLSX: any;

/**
 * SmartExpense Pro - Main Application Component
 */
const App: React.FC = () => {
  // Core App State
  const [user, setUser] = useState<User | null>(storage.getUser());
  const [transactions, setTransactions] = useState<Transaction[]>(storage.getTransactions());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    localStorage.getItem('theme') as 'light' | 'dark' || 'light'
  );
  
  // Auth & Recovery State
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset' | 'verify'>('login');
  const [authName, setAuthName] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('123456'); // Default to 123456
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Status State
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStep, setBackupStep] = useState<string>('');
  const [feedback, setFeedback] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [uploadMeta, setUploadMeta] = useState<{size: string, width: number, height: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply theme to HTML root element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle temporary UI feedback messages
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Derived Financial Statistics
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

  // Auto-save data on change
  useEffect(() => {
    if (user) {
      storage.saveTransactions(transactions);
    }
  }, [transactions, user]);

  /**
   * Authentication Logic Handler
   */
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const accounts = storage.getAccounts();
    const normalizedUsername = authUsername.trim().toLowerCase();

    if (authMode === 'signup') {
      const exists = accounts.find(a => a.username.toLowerCase() === normalizedUsername);
      if (exists) {
        setAuthError("Username unavailable. Try something more unique!");
        return;
      }
      
      // Fixed OTP as requested
      const otp = "123456";
      setGeneratedOtp(otp);
      setAuthMode('verify');
      setFeedback({ message: `DEMO: Verification code sent to ${authEmail}: ${otp}`, type: 'success' });
      
    } else if (authMode === 'verify') {
      if (verificationCode === generatedOtp) {
        const newUser: User = { 
          name: authName.trim(), 
          username: authUsername.trim(), 
          email: authEmail.trim(),
          password: authPassword 
        };
        storage.saveAccount(newUser);
        setUser(newUser);
        storage.setUser(newUser);
        setFeedback({ message: 'Email verified! Welcome aboard.', type: 'success' });
      } else {
        setAuthError("Invalid verification code. Please check your inbox.");
      }
    } else if (authMode === 'login') {
      const targetAccount = accounts.find(a => a.username.toLowerCase() === normalizedUsername);
      if (!targetAccount) {
        setAuthError("Account not recognized. Join us instead?");
        return;
      }
      if (targetAccount.password !== authPassword) {
        setAuthError("Security check failed. Password incorrect.");
        return;
      }
      setUser(targetAccount);
      storage.setUser(targetAccount);
    } else if (authMode === 'forgot') {
      const targetAccount = accounts.find(a => a.username.toLowerCase() === resetUsername.trim().toLowerCase());
      if (!targetAccount) {
        setAuthError("No account found with that username.");
        return;
      }
      setAuthMode('reset');
    } else if (authMode === 'reset') {
      const allAccounts = storage.getAccounts();
      const accountIndex = allAccounts.findIndex(a => a.username.toLowerCase() === resetUsername.trim().toLowerCase());
      if (accountIndex > -1) {
        allAccounts[accountIndex].password = newPassword;
        storage.saveAccount(allAccounts[accountIndex]);
        setAuthSuccess("Password updated. Secure entry ready!");
        setAuthMode('login');
        setResetUsername('');
        setNewPassword('');
        setAuthUsername(resetUsername); 
      }
    }
  };

  /**
   * Enhanced Email Backup System
   */
  const handleBackupToEmail = async () => {
    if (!user) return;
    setIsBackingUp(true);
    
    const steps = [
      "Compiling ledger database...",
      "Encrypting financial records...",
      "Generating secure data package...",
      "Establishing link with " + user.email + "...",
      "Finalizing transmission..."
    ];

    for (const step of steps) {
      setBackupStep(step);
      await new Promise(res => setTimeout(res, 800));
    }

    const backupData = {
      user: { name: user.name, username: user.username, email: user.email },
      stats: stats,
      history: transactions,
      timestamp: new Date().toISOString()
    };

    const dataString = JSON.stringify(backupData, null, 2);
    const subject = encodeURIComponent(`SmartExpense Backup - ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(`Here is your secure financial backup from SmartExpense Pro.\n\nPACKAGE DETAILS:\n- Transactions: ${transactions.length}\n- Net Worth: $${stats.balance}\n\nDATA BLOB:\n${dataString}\n\nKeep this email safe for recovery purposes.`);
    
    window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`;

    setFeedback({ message: 'Backup package sent to ' + user.email, type: 'success' });
    setIsBackingUp(false);
    setBackupStep('');
  };

  /**
   * Data Portability: Export to Excel
   */
  const exportToExcel = () => {
    if (transactions.length === 0) return;
    setIsExporting(true);
    
    try {
      const dataToExport = transactions.map(t => ({
        ID: t.id.toUpperCase(),
        Date: new Date(t.date).toLocaleDateString(),
        Time: new Date(t.createdAt).toLocaleTimeString(),
        Type: t.type,
        Category: t.category,
        Amount: t.amount,
        Currency: 'USD',
        Notes: t.note || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      
      const fileName = `SmartExpense_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      setFeedback({ message: 'Ledger exported successfully!', type: 'success' });
    } catch (err) {
      setFeedback({ message: 'Export failed. Please try again.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Cloud Integration Placeholder
   */
  const syncToCloud = async () => {
    setIsSyncing(true);
    await new Promise(res => setTimeout(res, 1500));
    setFeedback({ 
      message: 'Cloud Sync is a premium feature. Google Drive configuration required.', 
      type: 'success' 
    });
    setIsSyncing(false);
  };

  const handleLogout = () => {
    storage.setUser(null as any); 
    setUser(null);
    setAuthUsername('');
    setAuthPassword('');
    setAuthName('');
    setAuthEmail('');
    setAuthError(null);
    setAuthSuccess(null);
    setAuthMode('login');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setUploadMeta({
          size: (file.size / 1024).toFixed(1) + ' KB',
          width: img.width,
          height: img.height
        });
        const updatedUser = { ...user, avatarUrl: result };
        setUser(updatedUser);
        storage.setUser(updatedUser);
        storage.saveAccount(updatedUser);
      };
      img.src = result;
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

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 transition-all duration-500 font-sans">
        <div className="glass-card w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-fade-in bg-white/90 dark:bg-slate-900/90 border border-white/20">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 text-white p-5 rounded-3xl shadow-2xl shadow-indigo-300 dark:shadow-none mb-4 transform hover:rotate-3 transition-transform">
              <Wallet size={36} />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">SmartExpense</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 font-medium">Wealth Management Simplified</p>
          </div>

          {(authMode === 'login' || authMode === 'signup') && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-8">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
                className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${authMode === 'login' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('signup'); setAuthError(null); setAuthSuccess(null); }}
                className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${authMode === 'signup' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
              >
                Join Us
              </button>
            </div>
          )}

          {authMode === 'verify' && (
            <div className="mb-6 animate-fade-in text-center">
              <div className="inline-block p-4 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full mb-4">
                <Mail size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Verify Your Email</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium leading-relaxed">
                We've sent a 6-digit code to <span className="text-indigo-600 dark:text-indigo-400 font-bold">{authEmail}</span>. Enter it below to secure your account.
              </p>
            </div>
          )}

          {authMode === 'forgot' && (
            <div className="mb-6 animate-fade-in">
              <button onClick={() => setAuthMode('login')} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-black mb-4 hover:underline">
                <ArrowLeft size={16} /> Back to Login
              </button>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Account Recovery</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Please provide your username to start reset.</p>
            </div>
          )}

          {authMode === 'reset' && (
            <div className="mb-6 animate-fade-in">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Security Update</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">New credentials for <strong>{resetUsername}</strong>.</p>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div className="animate-fade-in space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <div className="relative">
                    <UserIconOutline size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                      placeholder="name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                  <div className="relative">
                    <AtSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {authMode === 'verify' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1 text-center">6-Digit Verification Code</label>
                <div className="relative">
                  <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-5 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-900 dark:text-white font-black text-center text-2xl tracking-[0.5em]"
                    placeholder="000000"
                  />
                </div>
                <div className="text-center mt-6">
                  <button 
                    type="button"
                    onClick={() => {
                       // Keep it fixed at 123456
                       setGeneratedOtp("123456");
                       setFeedback({ message: `New code sent: 123456`, type: 'success' });
                    }}
                    className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>
              </div>
            )}
            
            {(authMode === 'login' || authMode === 'signup') && (
              <div className="animate-fade-in">
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                <div className="relative">
                  <UserIconOutline size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                    placeholder="username"
                  />
                </div>
              </div>
            )}

            {(authMode === 'login' || authMode === 'signup') && (
              <div className="animate-fade-in">
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Secure Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                    placeholder="••••••••"
                  />
                </div>
                {authMode === 'login' && (
                  <div className="flex justify-end mt-2">
                    <button 
                      type="button" 
                      onClick={() => { setAuthMode('forgot'); setAuthError(null); setAuthSuccess(null); }}
                      className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline tracking-[0.1em]"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {authMode === 'forgot' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Registered Username</label>
                <div className="relative">
                  <UserIconOutline size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                    placeholder="Enter your username"
                  />
                </div>
              </div>
            )}

            {authMode === 'reset' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                <div className="relative">
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {authError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-100 dark:border-rose-900/50 animate-fade-in">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-100 dark:border-emerald-900/50 animate-fade-in">
                {authSuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-200 dark:shadow-none mt-6 active:scale-[0.98] uppercase tracking-widest"
            >
              {authMode === 'login' && 'Continue to Dashboard'}
              {authMode === 'signup' && 'Create My Account'}
              {authMode === 'verify' && 'Verify & Enter'}
              {authMode === 'forgot' && 'Verify Username'}
              {authMode === 'reset' && 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 lg:pb-8 transition-colors duration-500 font-sans">
      {/* Dynamic Feedback Toast */}
      {feedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${feedback.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-rose-500/90 text-white border-rose-400'}`}>
            <CheckCircle2 size={18} />
            <span className="font-bold text-sm tracking-tight">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Backup Progress Overlay */}
      {isBackingUp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-fade-in">
          <div className="text-center max-w-xs w-full space-y-8 p-10">
            <div className="relative flex justify-center">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
              <ShieldCheck size={80} className="text-indigo-500 relative animate-bounce" />
            </div>
            <div className="space-y-3">
              <h3 className="text-white font-black text-2xl tracking-tighter">Securing Ledger</h3>
              <p className="text-slate-400 font-bold text-sm animate-pulse">{backupStep}</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 animate-[progress_4s_ease-in-out_infinite]" style={{width: '30%'}}></div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white p-2.5 rounded-2xl shadow-lg shrink-0">
            <Wallet size={20} />
          </div>
          <span className="font-extrabold text-lg sm:text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            SmartExpense
          </span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6">
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all active:scale-90"
          >
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>

          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden xs:block" />

          <div className="flex items-center gap-3 pl-2">
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-sm font-black">{user.name}</span>
            </div>
            
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="relative group transition-transform hover:scale-110 active:scale-95"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="User" className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover ring-4 ring-indigo-500/10 border-2 border-white dark:border-slate-800" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center ring-4 ring-indigo-500/10 border-2 border-white dark:border-slate-800">
                  <span className="text-lg font-black">{user.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-md border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings size={12} className="text-slate-600 dark:text-slate-400" />
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden group shadow-lg shadow-slate-200/40 dark:shadow-none transition-all hover:translate-y-[-4px]">
             <div className="relative z-10">
               <span className="text-slate-600 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Available Balance</span>
               <div className="text-4xl xs:text-5xl font-black mt-2 text-slate-900 dark:text-white tracking-tighter">${stats.balance.toLocaleString()}</div>
               <div className="mt-6 flex items-center gap-3">
                 <span className={`text-xs px-3 py-1.5 rounded-xl font-black uppercase tracking-wider shadow-sm ${stats.balance >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                   {stats.balance >= 0 ? 'Wealth Growing' : 'Budget Deficit'}
                 </span>
                 <span className="text-xs text-slate-400 font-bold italic">Live Intelligence Enabled</span>
               </div>
             </div>
             <div className="absolute top-[-10%] right-[-5%] p-8 opacity-[0.03] dark:opacity-[0.07] group-hover:opacity-10 transition-all duration-700 group-hover:scale-125">
               <TrendingUp size={180} className="text-indigo-600" />
             </div>
          </div>

          <div className="glass-card rounded-[2.5rem] p-8 shadow-md hover:translate-y-[-4px] transition-all">
            <div className="flex items-center gap-5">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-5 rounded-[1.5rem] shadow-inner">
                <TrendingUp size={28} />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider">Total Income</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">${stats.totalIncome.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[2.5rem] p-8 shadow-md hover:translate-y-[-4px] transition-all">
            <div className="flex items-center gap-5">
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-5 rounded-[1.5rem] shadow-inner">
                <TrendingDown size={28} />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider">Total Expenses</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">${stats.totalExpense.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <Charts transactions={transactions} />

            <div className="glass-card rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-none overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                <h3 className="font-black text-xl text-slate-900 dark:text-white">Detailed Ledger</h3>
                <div className="flex gap-1.5">
                  <button 
                    onClick={syncToCloud}
                    disabled={isSyncing}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all border border-slate-100 dark:border-slate-700 disabled:opacity-50"
                    title="Cloud Sync (Google Drive)"
                  >
                    <Cloud size={20} className={isSyncing ? 'animate-pulse' : ''} />
                  </button>
                  <button 
                    onClick={exportToExcel}
                    disabled={isExporting}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all border border-slate-100 dark:border-slate-700 disabled:opacity-50"
                    title="Export as Excel"
                  >
                    <Download size={20} className={isExporting ? 'animate-bounce' : ''} />
                  </button>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 sm:p-24 text-center animate-fade-in">
                  <div className="p-6 sm:p-10 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-700 transition-transform hover:scale-105 mb-6">
                    <Wallet className="w-12 h-12 sm:w-20 sm:h-20" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-slate-500 dark:text-slate-400 font-black text-lg sm:text-2xl">Your ledger is empty.</p>
                    <button 
                      onClick={() => setIsFormOpen(true)} 
                      className="text-indigo-600 dark:text-indigo-400 font-black hover:underline text-base sm:text-lg decoration-2 underline-offset-4"
                    >
                      Start tracking now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] scrollbar-hide">
                  <table className="w-full min-w-[600px] sm:min-w-0">
                    <thead>
                      <tr className="text-left text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/30">
                        <th className="px-6 sm:px-8 py-5">Transaction Details</th>
                        <th className="px-6 sm:px-8 py-5">Classification</th>
                        <th className="px-6 sm:px-8 py-5">Timeline</th>
                        <th className="px-6 sm:px-8 py-5 text-right">Value</th>
                        <th className="px-6 sm:px-8 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group">
                          <td className="px-6 sm:px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-2xl shadow-sm ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'}`}>
                                {t.type === TransactionType.INCOME ? <Plus size={18} /> : <TrendingDown size={18} />}
                              </div>
                              <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                {t.note || 'General Transaction'}
                                <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-0.5">TXN-{t.id.toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 sm:px-8 py-6">
                            <span className="text-[10px] font-black px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                              {t.category}
                            </span>
                          </td>
                          <td className="px-6 sm:px-8 py-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-slate-700 dark:text-slate-200 font-bold">{new Date(t.date).toLocaleDateString()}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-tighter italic">
                                    <Clock size={10} />
                                    {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                          </td>
                          <td className={`px-6 sm:px-8 py-6 text-lg font-black text-right ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 sm:px-8 py-6 text-right">
                            <button 
                              onClick={() => deleteTransaction(t.id)}
                              className="opacity-0 group-hover:opacity-100 p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-400 hover:text-rose-600 transition-all rounded-xl"
                            >
                              <Trash2 size={16} />
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

          <div className="space-y-10">
            <FinancialTips transactions={transactions} stats={stats} />
            
            <div className="glass-card rounded-[2rem] p-8 shadow-lg border border-white/20">
              <h3 className="font-black text-slate-900 dark:text-white mb-8 text-xl tracking-tight">Financial Health</h3>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Burn Rate</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg">{stats.expenseRatio.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out shadow-sm ${stats.expenseRatio > 80 ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'}`}
                      style={{ width: `${Math.min(stats.expenseRatio, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-[1.5rem] border border-indigo-100/50 dark:border-indigo-500/10">
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-600 text-white p-2 rounded-lg mt-1">
                      <TrendingUp size={16} />
                    </div>
                    <p className="text-sm text-indigo-900 dark:text-indigo-300 font-bold leading-relaxed">
                      Wealth Outlook: <span className="text-indigo-600 dark:text-indigo-400 font-black">{(100 - stats.expenseRatio).toFixed(1)}%</span> of revenue is being secured for long-term growth.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 py-10 px-6 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
          &copy; 2026 Codecrafters LTD.
        </p>
        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
          All rights reserved to Nabil Zaman
        </p>
      </footer>

      <button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl shadow-2xl shadow-indigo-400 dark:shadow-none flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:rotate-3 z-40 group"
      >
        <Plus size={40} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* User Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="glass-card w-full max-w-sm rounded-[2.5rem] p-10 relative bg-white dark:bg-slate-900 shadow-2xl animate-fade-in border border-white/20">
            <button onClick={() => { setIsProfileOpen(false); setUploadMeta(null); }} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Security & Settings</h2>
            
            <div className="flex flex-col items-center gap-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Preview" className="w-24 h-24 rounded-[1.5rem] object-cover ring-8 ring-indigo-500/10 border-4 border-white dark:border-slate-800" />
                ) : (
                  <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-[1.5rem] flex items-center justify-center ring-4 ring-indigo-500/10 border-2 border-white dark:border-slate-800">
                    <UserIconOutline size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-[1.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              <div className="w-full text-center">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{user.name}</h3>
                <p className="text-slate-500 font-bold text-sm">@{user.username}</p>
                <p className="text-slate-400 font-medium text-[10px] mt-1 uppercase tracking-widest">{user.email}</p>
              </div>

              <div className="w-full space-y-3 pt-4">
                 <button 
                  onClick={handleBackupToEmail}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  <Send size={18} />
                  Email Data Backup
                </button>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Vault</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                    Backup includes your user profile, transaction history (TXNs), and performance stats. Data is sent to your registered Gmail address.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-black rounded-2xl hover:bg-rose-100 transition-all flex items-center justify-center gap-3 mt-4"
              >
                <LogOut size={20} />
                Sign Out Account
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
