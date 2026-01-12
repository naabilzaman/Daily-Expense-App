
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
  // Prep data for Pie Chart (Expenses by Category)
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

  // Prep data for Bar Chart (Income vs Expense over time)
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card rounded-3xl p-6 shadow-sm h-[350px]">
        <h3 className="font-bold text-slate-800 mb-4">Expense Breakdown</h3>
        {expenseData.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as any]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 italic">No data to display</div>
        )}
      </div>

      <div className="glass-card rounded-3xl p-6 shadow-sm h-[350px]">
        <h3 className="font-bold text-slate-800 mb-4">Income vs Expenses</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Legend verticalAlign="top" height={36}/>
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 italic">No data to display</div>
        )}
      </div>
    </div>
  );
};

export default Charts;
