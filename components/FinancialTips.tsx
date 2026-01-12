
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { getFinancialTips } from '../services/geminiService';
import { Transaction, FinancialStats } from '../types';

interface Props {
  transactions: Transaction[];
  stats: FinancialStats;
}

const FinancialTips: React.FC<Props> = ({ transactions, stats }) => {
  const [tips, setTips] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchTips = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    const result = await getFinancialTips(transactions, stats);
    setTips(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchTips();
  }, [transactions.length]);

  return (
    <div className="glass-card rounded-[2rem] p-8 shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
        <Sparkles size={64} className="text-amber-500" />
      </div>
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 dark:bg-amber-500/10 p-3 rounded-2xl text-amber-700 dark:text-amber-400 shadow-sm ring-4 ring-amber-500/5">
            <Sparkles size={20} />
          </div>
          <h3 className="font-black text-slate-900 dark:text-white tracking-tight">Smart AI Advisor</h3>
        </div>
        <button 
          onClick={fetchTips}
          className="text-[10px] uppercase tracking-widest text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 font-black transition-all"
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Refresh AI'}
        </button>
      </div>

      <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed min-h-[140px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center w-full gap-4 mt-8">
            <div className="relative">
              <Loader2 className="animate-spin text-indigo-500" size={36} />
              <div className="absolute inset-0 blur-sm animate-pulse text-indigo-400"><Loader2 size={36} /></div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 italic font-black text-xs uppercase tracking-widest">Generating Strategy...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 font-bold italic py-8 text-center">Record data to unlock AI strategy insights.</p>
            ) : (
              tips.split('\n').filter(l => l.trim()).map((line, i) => (
                <div key={i} className="flex gap-3 group/line">
                  <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover/line:scale-150 transition-transform" />
                  <p className="font-bold text-slate-700 dark:text-slate-300 leading-relaxed transition-colors group-hover/line:text-slate-900 dark:group-hover/line:text-white">
                    {line.replace(/^[*-]\s*/, '')}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors">
          Full Report <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default FinancialTips;
