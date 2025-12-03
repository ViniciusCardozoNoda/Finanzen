
import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import { Transaction, View } from '../types';
import MonthlySummary from '../components/MonthlySummary';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color }) => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
      <i className={`fas ${icon} text-xl text-white`}></i>
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

interface DashboardProps {
    setCurrentView: (view: View) => void;
}

const BillReminderCard: React.FC<{ setCurrentView: (view: View) => void; }> = ({ setCurrentView }) => {
    const { t } = useLocalization();
    const { upcomingAndOverdueBills } = useData();

    if (upcomingAndOverdueBills.length === 0) return null;
    
    const today = new Date();
    today.setHours(0,0,0,0);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('bills_reminders')} ({upcomingAndOverdueBills.length})</h3>
            <ul className="space-y-3">
                {upcomingAndOverdueBills.slice(0, 3).map(bill => {
                    const dueDate = new Date(bill.dueDate);
                    dueDate.setHours(0,0,0,0);
                    const isOverdue = dueDate < today;
                    const diffTime = dueDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    return (
                        <li key={bill.id} className="flex justify-between items-center text-sm">
                            <div>
                                <p className="font-semibold text-slate-700">{bill.name}</p>
                                <p className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}>
                                    {isOverdue ? t('overdue') : t('due_in_days', { days: diffDays })}
                                </p>
                            </div>
                            <span className="font-bold text-slate-800">R$ {bill.amount.toFixed(2)}</span>
                        </li>
                    )
                })}
            </ul>
             {upcomingAndOverdueBills.length > 3 && (
                <p className="text-center text-sm text-slate-500 mt-3">...e mais {upcomingAndOverdueBills.length - 3} conta(s).</p>
            )}
            <button onClick={() => setCurrentView('bills')} className="mt-4 w-full text-center text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                {t('see_all')} <i className="fas fa-arrow-right ml-1"></i>
            </button>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ setCurrentView }) => {
  const { user } = useAuth();
  const { t, language } = useLocalization();
  const { transactions } = useData();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const recentTransactions = useMemo(() => {
      // For admins, show recent transactions from all users. For users, it's already scoped.
      return [...transactions].sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, 5)
  }, [transactions]);

  const dashboardData = useMemo(() => {
    // If admin, this will calculate across all users. If user, only for their own transactions.
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalSpent = expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const transactionCount = expenses.length;
    const biggestExpense = Math.max(0, ...expenses.map(t => Number(t.amount) || 0));
    
    const categoryMap: { [key: string]: number } = {};
    expenses.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + (Number(t.amount) || 0);
    });

    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    const spendingByCategory = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value, percentage: totalSpent > 0 ? (value / totalSpent * 100).toFixed(0) : "0" }))
      .sort((a,b) => b.value - a.value);

    return { totalSpent, transactionCount, biggestExpense, topCategory, spendingByCategory };
  }, [transactions]);
  
  const monthlyExpenseData = useMemo(() => {
    const months: { month: string; year: number; monthIndex: number; total: number }[] = [];
    const today = new Date();
    today.setDate(1);

    for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleDateString(language, { month: 'short' });
        months.push({
            month: `${monthName} ${d.getFullYear()}`,
            year: d.getFullYear(),
            monthIndex: d.getMonth(),
            total: 0,
        });
    }

    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    transactions
        .filter(t => t.type === 'expense' && t.date >= sixMonthsAgo)
        .forEach(t => {
            const transactionDate = t.date;
            const transactionMonth = transactionDate.getMonth();
            const transactionYear = transactionDate.getFullYear();

            const monthData = months.find(m => m.monthIndex === transactionMonth && m.year === transactionYear);
            if (monthData) {
                monthData.total += (Number(t.amount) || 0);
            }
        });

    return months;
  }, [transactions, language]);


  const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6'];

  const categoryIcons: { [key: string]: string } = {
    'Educação': 'fa-graduation-cap',
    'Lazer': 'fa-film',
    'Saúde': 'fa-heartbeat',
    'Transporte': 'fa-car',
    'Casa': 'fa-home',
    'Alimentação': 'fa-utensils',
    'Outros': 'fa-ellipsis-h',
  };
  const getCategoryIcon = (category: string) => categoryIcons[category] || 'fa-question-circle';


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">{t('financial_dashboard')}</h1>
        <button onClick={() => setCurrentView('new-expense')} className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
            + {t('new_expense')}
        </button>
      </div>
      
      <BillReminderCard setCurrentView={setCurrentView} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title={t('total_spent')} value={`R$ ${dashboardData.totalSpent.toFixed(2)}`} icon="fa-dollar-sign" color="bg-gradient-to-tr from-green-400 to-green-500" />
        <SummaryCard title={t('transactions')} value={`${dashboardData.transactionCount}`} icon="fa-exchange-alt" color="bg-gradient-to-tr from-blue-400 to-blue-500" />
        <SummaryCard title={t('biggest_expense')} value={`R$ ${dashboardData.biggestExpense.toFixed(2)}`} icon="fa-chart-line" color="bg-gradient-to-tr from-purple-400 to-purple-500" />
        <SummaryCard title={t('top_category')} value={dashboardData.topCategory} icon="fa-tag" color="bg-gradient-to-tr from-orange-400 to-orange-500" />
      </div>

      <MonthlySummary />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
           <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('spending_by_category')}</h3>
            {hasMounted && dashboardData.spendingByCategory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie 
                                        data={dashboardData.spendingByCategory} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60} 
                                        outerRadius={80} 
                                        fill="#8884d8" 
                                        paddingAngle={5}
                                        labelLine={false}
                                    >
                                    {dashboardData.spendingByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 my-auto">
                            {dashboardData.spendingByCategory.map((entry, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                        <span className="text-slate-600">{entry.name}</span>
                                    </div>
                                    <div className="font-semibold text-slate-800">
                                        <span>R$ {entry.value.toFixed(2)}</span>
                                        <span className="text-slate-400 ml-2 text-xs">({entry.percentage}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                </div>
           ) : (
                <div className="flex items-center justify-center h-[250px] text-slate-500">
                    <p>Nenhum dado de gasto para exibir.</p>
                </div>
           )}
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('latest_transactions')}</h3>
          <ul className="space-y-4">
            {recentTransactions.map(tx => (
              <li key={tx.id} className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <i className={`fas ${getCategoryIcon(tx.category)} text-slate-500`}></i>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{tx.description}</p>
                  <p className="text-xs text-slate-500">{tx.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                </div>
                <div className={`font-bold text-sm ${tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                  {tx.type === 'expense' ? '-' : '+'}R$ {tx.amount.toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('monthly_expenses_last_6_months')}</h3>
        {hasMounted && monthlyExpenseData && monthlyExpenseData.some(d => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyExpenseData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value: number) => `R$${value}`} />
                    <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, t('expense')]}
                        cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }}
                    />
                    <Bar dataKey="total" fill="#EF4444" name={t('expense')} barSize={30} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
                <p>Nenhuma despesa registrada nos últimos 6 meses.</p>
            </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
