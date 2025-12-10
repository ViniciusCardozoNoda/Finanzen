import React, { useState, useMemo } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import { Transaction } from '../types';

const Transactions: React.FC = () => {
  const { t } = useLocalization();
  const { transactions, deleteTransaction } = useData();
  
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Date Filter
      const txDate = new Date(tx.date);
      const sameMonth = txDate.getMonth() === selectedDate.getMonth();
      const sameYear = txDate.getFullYear() === selectedDate.getFullYear();
      if (!sameMonth || !sameYear) return false;

      // Type Filter
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // Text Search
      if (searchTerm && !tx.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, searchTerm, selectedDate]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(parseInt(e.target.value));
    setSelectedDate(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(e.target.value));
    setSelectedDate(newDate);
  };

  const handleDelete = async (id: number) => {
      if (window.confirm(t('confirm_delete_title'))) { // Using simple confirm for now
          await deleteTransaction(id);
      }
  };

  const categoryIcons: { [key: string]: string } = {
    'Educação': 'fa-graduation-cap',
    'Lazer': 'fa-film',
    'Saúde': 'fa-heartbeat',
    'Transporte': 'fa-car',
    'Casa': 'fa-home',
    'Alimentação': 'fa-utensils',
    'Compras': 'fa-shopping-bag',
    'Serviços': 'fa-concierge-bell',
    'Salário': 'fa-money-bill-wave',
    'Investimentos': 'fa-chart-line',
    'Presente': 'fa-gift',
    'Outros': 'fa-ellipsis-h',
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t('transactions')}</h1>
                <p className="text-slate-500">{filteredTransactions.length} {t('records')}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
                <select 
                    value={selectedDate.getMonth()} 
                    onChange={handleMonthChange}
                    className="bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>{t(`month_${i}`)}</option>
                    ))}
                </select>
                <select 
                    value={selectedDate.getFullYear()} 
                    onChange={handleYearChange}
                    className="bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    {[2023, 2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                    type="text" 
                    placeholder={t('search_description_obs')} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {t('see_all')}
                </button>
                <button 
                    onClick={() => setFilterType('income')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {t('income')}
                </button>
                <button 
                    onClick={() => setFilterType('expense')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {t('expense')}
                </button>
            </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                    <i className="fas fa-search text-4xl mb-3 text-slate-300"></i>
                    <p>Nenhuma transação encontrada para este período.</p>
                </div>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {filteredTransactions.map(tx => (
                        <li key={tx.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    <i className={`fas ${categoryIcons[tx.category] || 'fa-tag'}`}></i>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{tx.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>{new Date(tx.date).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{tx.category}</span>
                                        <span>•</span>
                                        <span>{tx.paymentMethod}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                                </p>
                                <button 
                                    onClick={() => handleDelete(tx.id)}
                                    className="text-xs text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                                >
                                    <i className="fas fa-trash"></i> {t('delete')}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </div>
  );
};

export default Transactions;