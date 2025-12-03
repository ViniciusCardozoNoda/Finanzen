import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';

const SummaryCard: React.FC<{ title: string; value: string; icon: string; color: string }> = ({ title, value, icon, color }) => (
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

const MyExpenses: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLocalization();
    const { transactions } = useData();

    const userExpenses = useMemo(() => {
        // Data is already scoped by DataContext based on user role
        return transactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [transactions]);

    const summaryData = useMemo(() => {
        const total = userExpenses.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        const count = userExpenses.length;
        const average = count > 0 ? total / count : 0;
        return { total, count, average };
    }, [userExpenses]);
    
    const categoryIcons: { [key: string]: string } = {
        'Educação': 'fa-graduation-cap',
        'Lazer': 'fa-film',
        'Saúde': 'fa-heartbeat',
        'Transporte': 'fa-car',
        'Casa': 'fa-home',
         'Alimentação': 'fa-utensils',
        'Compras': 'fa-shopping-bag',
        'Serviços': 'fa-concierge-bell',
        'Outros': 'fa-ellipsis-h',
    };
    const getCategoryIcon = (category: string) => categoryIcons[category] || 'fa-question-circle';


    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-slate-800">{t('manage_your_expenses')}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title={t('total_exhibited')} value={`R$ ${summaryData.total.toFixed(2)}`} icon="fa-dollar-sign" color="bg-gradient-to-tr from-red-400 to-red-500" />
                <SummaryCard title={t('records')} value={`${summaryData.count}`} icon="fa-receipt" color="bg-gradient-to-tr from-blue-400 to-blue-500" />
                <SummaryCard title={t('average_expense')} value={`R$ ${summaryData.average.toFixed(2)}`} icon="fa-calculator" color="bg-gradient-to-tr from-purple-400 to-purple-500" />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-slate-200">
                     <i className="fas fa-filter text-slate-400"></i>
                     <h3 className="text-md font-semibold text-slate-600">{t('filters')}</h3>
                </div>
                 {/* Filter inputs would go here */}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                 <h3 className="text-lg font-semibold text-slate-800 mb-4">{userExpenses.length} resultados encontrados</h3>
                 <ul className="space-y-4">
                    {userExpenses.map(tx => (
                        <li key={tx.id} className="p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center mb-4 sm:mb-0">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-4">
                                    <i className={`fas ${getCategoryIcon(tx.category)} text-slate-500`}></i>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{tx.description}</p>
                                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                                         <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tx.category}</span>
                                         <span><i className="fas fa-calendar-alt mr-1"></i>{tx.date.toLocaleDateString('pt-BR')}</span>
                                         <span><i className="fas fa-credit-card mr-1"></i>{tx.paymentMethod}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-red-500 text-lg sm:mr-6">R$ {tx.amount.toFixed(2)}</span>
                                <div className="flex space-x-2">
                                    <button className="text-slate-500 hover:text-blue-600 text-sm font-medium"><i className="fas fa-pencil-alt mr-1"></i> {t('edit')}</button>
                                    <button className="text-slate-500 hover:text-red-600 text-sm font-medium"><i className="fas fa-trash-alt mr-1"></i> {t('delete')}</button>
                                </div>
                            </div>
                        </li>
                    ))}
                 </ul>
            </div>
        </div>
    );
};

export default MyExpenses;