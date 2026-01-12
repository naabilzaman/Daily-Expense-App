
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { Transaction, TransactionType } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface Props {
  transactions: Transaction[];
}

const Charts: React.FC<Props> = ({ transactions }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';

  const expenseData = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

  const monthlyData = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleString('default', { month: 'short' });
    let existing = acc.find(item => item.name === month);
    if (!existing) {
      existing = { name: month, income: 0, expense: 0 };
      acc.push(existing);
    }
    if (t.type === TransactionType.INCOME) existing.income += t.amount;
    else existing.expense += t.amount;
    return acc;
  }, [] as { name: string; income: number; expense: number }[]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-black" style={{ color: entry.color || entry.fill }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-card rounded-[2rem] p-8 shadow-lg h-[400px]">
        <h3 className="font-black text-slate-900 dark:text-white mb-6 text-xl tracking-tight">Outflow Analysis</h3>
        {expenseData.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as any]} className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 dark:text-slate-600 font-bold italic">
             <p>No activity detected</p>
          </div>
        )}
      </div>

      <div className="glass-card rounded-[2.5rem] p-8 shadow-lg h-[400px]">
        <h3 className="font-black text-slate-900 dark:text-white mb-6 text-xl tracking-tight">Growth Trend</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: textColor, fontSize: 10, fontWeight: 900, dy: 10}} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(99, 102, 241, 0.05)', radius: 12}} />
              <Bar dataKey="income" fill="#10b981" radius={[8, 8, 8, 8]} barSize={24} name="Total Credit" />
              <Bar dataKey="expense" fill="#f43f5e" radius={[8, 8, 8, 8]} barSize={24} name="Total Debit" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 dark:text-slate-600 font-bold italic">
             <p>Awaiting data stream</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Charts;
