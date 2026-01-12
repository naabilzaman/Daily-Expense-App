
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  return (
    <div className="glass-card rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
            <Sparkles size={20} />
          </div>
          <h3 className="font-bold text-slate-800">Smart AI Insights</h3>
        </div>
        <button 
          onClick={fetchTips}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Tips'}
        </button>
      </div>

      <div className="text-slate-600 text-sm leading-relaxed min-h-[100px] flex items-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center w-full gap-2">
            <Loader2 className="animate-spin text-indigo-400" size={24} />
            <p className="text-slate-400 italic">Gemini is analyzing your patterns...</p>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            {tips.split('\n').map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialTips;
