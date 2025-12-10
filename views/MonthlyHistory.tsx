
import React, { useMemo } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';

const MonthlyHistory: React.FC = () => {
  const { t } = useLocalization();
  const { transactions } = useData();

  const monthlySummaries = useMemo(() => {
    const summaryMap: Record<string, { monthYear: string, date: Date, income: number, expense: number }> = {};

    transactions.forEach(tx => {
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        
        if (!summaryMap[key]) {
            summaryMap[key] = {
                monthYear: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                date: d,
                income: 0,
                expense: 0
            };
        }

        if (tx.type === 'income') {
            summaryMap[key].income += Number(tx.amount);
        } else {
            summaryMap[key].expense += Number(tx.amount);
        }
    });

    return Object.values(summaryMap).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">{t('monthly_history')}</h1>
        <p className="text-slate-500">Resumo financeiro mês a mês</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monthlySummaries.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
                    <p className="text-slate-500">Ainda não há dados suficientes para gerar o histórico.</p>
                </div>
            ) : (
                monthlySummaries.map((item, index) => {
                    const balance = item.income - item.expense;
                    return (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <span className="font-bold text-slate-700 capitalize">{item.monthYear}</span>
                                {balance >= 0 ? 
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"><i className="fas fa-arrow-up mr-1"></i>Positivo</span> : 
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"><i className="fas fa-arrow-down mr-1"></i>Negativo</span>
                                }
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">{t('income')}</span>
                                    <span className="font-semibold text-green-600">R$ {item.income.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">{t('expense')}</span>
                                    <span className="font-semibold text-red-600">R$ {item.expense.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-100 pt-3 mt-2 flex justify-between items-center">
                                    <span className="text-slate-800 font-medium">{t('total_balance')}</span>
                                    <span className={`font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                        R$ {balance.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};

export default MonthlyHistory;
