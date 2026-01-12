
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, LogOut, Wallet, TrendingUp, TrendingDown, 
  Trash2, Download, Cloud, User as UserIcon, Filter
} from 'lucide-react';
import { Transaction, TransactionType, User, FinancialStats } from './types';
import { storage } from './utils/storage';
import TransactionForm from './components/TransactionForm';
import Charts from './components/Charts';
import FinancialTips from './components/FinancialTips';

// Excel export helper
declare const XLSX: any;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(storage.getUser());
  const [transactions, setTransactions] = useState<Transaction[]>(storage.getTransactions());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');

  // Stats calculation
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

  useEffect(() => {
    storage.saveTransactions(transactions);
  }, [transactions]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authEmail) return;
    const newUser = { name: authName, email: authEmail };
    setUser(newUser);
    storage.setUser(newUser);
  };

  const handleLogout = () => {
    storage.clearAll();
    setUser(null);
    setTransactions([]);
  };

  const addTransaction = (data: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTransactions([newTransaction, ...transactions]);
    setIsFormOpen(false);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(transactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "ExpenseTracker_Export.xlsx");
  };

  const syncToDrive = () => {
    alert("Google Drive Sync Placeholder: To enable this, configure 'CLIENT_ID' and 'API_KEY' in the source code. This would upload your data as a JSON file to your private App Data folder.");
    // Integration logic would go here using gapi.client.drive.files.create
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-slate-50 to-rose-50">
        <div className="glass-card w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 text-white p-4 rounded-3xl shadow-xl shadow-indigo-200 mb-4">
              <Wallet size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">SmartExpense</h1>
            <p className="text-slate-400 text-sm mt-1">AI-Powered Wealth Tracker</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1 ml-1">Full Name</label>
              <input
                type="text"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                className="w-full px-5 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="john@example.com"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 mt-6"
            >
              Get Started
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-xs leading-relaxed">
              By joining, you agree to our 100% private locally-stored data policy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2.5 rounded-2xl">
            <Wallet size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:inline">SmartExpense</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-xs text-slate-400 font-medium">Welcome back,</span>
            <span className="text-sm font-bold">{user.name}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-[2rem] p-8 relative overflow-hidden group shadow-sm transition-transform hover:scale-[1.02]">
             <div className="relative z-10">
               <span className="text-slate-500 text-sm font-medium">Available Balance</span>
               <div className="text-4xl font-bold mt-1">${stats.balance.toLocaleString()}</div>
               <div className="mt-4 flex items-center gap-2">
                 <span className={`text-xs px-2 py-1 rounded-lg ${stats.balance >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                   {stats.balance >= 0 ? 'Surplus' : 'Deficit'}
                 </span>
               </div>
             </div>
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp size={80} className="text-indigo-600" />
             </div>
          </div>

          <div className="glass-card rounded-[2rem] p-8 border-l-4 border-l-emerald-500 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <span className="text-slate-500 text-sm font-medium">Total Income</span>
                <div className="text-2xl font-bold">${stats.totalIncome.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-8 border-l-4 border-l-rose-500 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-4">
              <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl">
                <TrendingDown size={24} />
              </div>
              <div>
                <span className="text-slate-500 text-sm font-medium">Total Expenses</span>
                <div className="text-2xl font-bold">${stats.totalExpense.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Visualizations */}
            <Charts transactions={transactions} />

            {/* Transactions List */}
            <div className="glass-card rounded-3xl shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-lg">Recent Transactions</h3>
                <div className="flex gap-2">
                  <button onClick={exportToExcel} className="p-2 text-slate-400 hover:text-indigo-600" title="Export to Excel">
                    <Download size={20} />
                  </button>
                  <button onClick={syncToDrive} className="p-2 text-slate-400 hover:text-indigo-600" title="Sync to Drive">
                    <Cloud size={20} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[500px] scrollbar-hide">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Details</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          No transactions yet. Click the + button to add one.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {t.type === TransactionType.INCOME ? <Plus size={16} /> : <TrendingDown size={16} />}
                              </div>
                              <div className="text-sm font-semibold">{t.note || 'Unlabeled'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
                              {t.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                          <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-slate-800'}`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => deleteTransaction(t.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            <FinancialTips transactions={transactions} stats={stats} />
            
            {/* Quick Actions / Mini Dashboard */}
            <div className="glass-card rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6">Financial Summary</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Expense vs Income</span>
                    <span className="font-bold">{stats.expenseRatio.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${stats.expenseRatio > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(stats.expenseRatio, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-2xl">
                  <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                    Pro Tip: Most experts recommend saving at least 20% of your monthly income. You are currently saving {(100 - stats.expenseRatio).toFixed(1)}%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl shadow-indigo-300 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40"
      >
        <Plus size={32} />
      </button>

      {/* Forms */}
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
