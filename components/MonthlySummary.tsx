import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useLocalization } from '../context/LocalizationContext';

const SummaryCard: React.FC<{ title: string; value: string; icon: string; bgColor: string; textColor: string; }> = ({ title, value, icon, bgColor, textColor }) => (
  <div className={`p-4 rounded-lg flex items-center space-x-4 ${bgColor}`}>
    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white bg-opacity-20">
      <i className={`fas ${icon} text-xl ${textColor}`}></i>
    </div>
    <div>
      <p className={`text-sm font-medium ${textColor} opacity-80`}>{title}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  </div>
);

const MonthlySummary: React.FC = () => {
  const { t } = useLocalization();
  const { transactions } = useData();
  
  const [selectedDate, setSelectedDate] = useState(new Date());

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(tx => tx.date.getFullYear()));
    if (!years.has(new Date().getFullYear())) {
      years.add(new Date().getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const filteredTransactions = transactions.filter(tx => {
      const txDate = tx.date;
      return txDate.getFullYear() === year && txDate.getMonth() === month;
    });

    const income = filteredTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const expense = filteredTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const net = income - expense;

    return { income, expense, net };
  }, [transactions, selectedDate]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    setSelectedDate(prev => new Date(prev.getFullYear(), newMonth, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setSelectedDate(prev => new Date(newYear, prev.getMonth(), 1));
  };
  
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

  const netBalanceColor = monthlyData.net >= 0 ? 'bg-blue-500' : 'bg-orange-500';
  const netBalanceIcon = monthlyData.net >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';


  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-2 sm:mb-0">{t('monthly_summary')}</h3>
        <div className="flex items-center space-x-2">
          <select 
            value={selectedDate.getMonth()}
            onChange={handleMonthChange}
            className="bg-slate-100 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{t(`month_${i}`)}</option>
            ))}
          </select>
          <select 
            value={selectedDate.getFullYear()}
            onChange={handleYearChange}
            className="bg-slate-100 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border text-sm"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard 
          title={t('income')} 
          value={formatCurrency(monthlyData.income)}
          icon="fa-plus"
          bgColor="bg-green-500"
          textColor="text-white"
        />
        <SummaryCard 
          title={t('expense')} 
          value={formatCurrency(monthlyData.expense)}
          icon="fa-minus"
          bgColor="bg-red-500"
          textColor="text-white"
        />
        <SummaryCard 
          title={t('net_balance')} 
          value={formatCurrency(monthlyData.net)}
          icon={netBalanceIcon}
          bgColor={netBalanceColor}
          textColor="text-white"
        />
      </div>
    </div>
  );
};

export default MonthlySummary;