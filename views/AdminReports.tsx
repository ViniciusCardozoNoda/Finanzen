import React, { useMemo, useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import { getUsageStats } from '../services/analyticsService';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const ReportCard: React.FC<{ title: string; value: string; icon: string; color: string; }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
      <i className={`fas ${icon} text-xl text-white`}></i>
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const AdminReports: React.FC = () => {
  const { t } = useLocalization();
  const { allTransactions } = useData();
  const usageStats = getUsageStats();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const financialOverview = useMemo(() => {
    const totalIncome = allTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const totalExpenses = allTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      
    const categoryMap: { [key: string]: number } = {};
    allTransactions.filter(t => t.type === 'expense').forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + (Number(t.amount) || 0);
    });
    
    const spendingByCategory = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 6); // Take top 6 categories for the chart

    return { totalIncome, totalExpenses, spendingByCategory };
  }, [allTransactions]);
  
  const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportCard 
                title={t('total_income_all_users')} 
                value={`R$ ${financialOverview.totalIncome.toFixed(2)}`} 
                icon="fa-plus-circle" 
                color="bg-green-500"
            />
             <ReportCard 
                title={t('total_expenses_all_users')} 
                value={`R$ ${financialOverview.totalExpenses.toFixed(2)}`} 
                icon="fa-minus-circle" 
                color="bg-red-500"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('top_expense_categories_all_users')}</h3>
                {hasMounted && financialOverview.spendingByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={financialOverview.spendingByCategory} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={100} 
                                fill="#8884d8"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                            {financialOverview.spendingByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-500">
                        <p>Nenhuma despesa registrada por usuários.</p>
                    </div>
                )}
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('feature_usage_statistics')}</h3>
                 <div className="space-y-4">
                     {usageStats.slice(0, 5).map(stat => (
                         <div key={stat.name}>
                             <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700">{t(stat.name.replace(/-/g, '_')) || stat.name}</span>
                                <span className="text-sm font-medium text-slate-700">{stat.clicks} {t('clicks')}</span>
                             </div>
                             <div className="w-full bg-slate-200 rounded-full h-2.5">
                                 <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(stat.clicks / (usageStats[0]?.clicks || 1)) * 100}%`}}></div>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('most_used_features')}</h3>
            {hasMounted && usageStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usageStats} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} interval={0} 
                            formatter={(value) => t(value.replace(/-/g, '_')) || value}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                            cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }}
                            labelFormatter={(label) => t(label.replace(/-/g, '_')) || label}
                        />
                        <Bar dataKey="clicks" fill="#3B82F6" name={t('clicks')} barSize={30} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                 <div className="flex items-center justify-center h-[300px] text-slate-500">
                    <p>Nenhum dado de uso de funcionalidade ainda.</p>
                </div>
            )}
      </div>

    </div>
  );
};

export default AdminReports;