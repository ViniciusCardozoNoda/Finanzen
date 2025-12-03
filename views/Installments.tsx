import React, { useMemo } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';

interface InstallmentPlan {
    id: string;
    name: string;
    paid: number;
    total: number;
    amount: number;
    totalAmount: number;
}

const Installments: React.FC = () => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const { transactions } = useData();

  const installmentPlans = useMemo(() => {
    if (!user) return [];

    // Data from context is already scoped, no need to filter by userId here
    const installmentTransactions = transactions.filter(
      (tx): tx is Transaction & { installments: { current: number; total: number } } =>
        tx.expenseType === 'installment' && !!tx.installments
    );

    const plans = installmentTransactions.reduce((acc, tx) => {
        const baseDesc = tx.description.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
        if (!acc[baseDesc]) {
            acc[baseDesc] = {
                id: baseDesc,
                name: baseDesc,
                paid: 0,
                total: tx.installments.total,
                amount: tx.amount,
                installments: [],
            };
        }
        acc[baseDesc].installments.push(tx);
        acc[baseDesc].paid = acc[baseDesc].installments.length;
        return acc;
    }, {} as Record<string, any>);

    return Object.values(plans).map(plan => ({
        ...plan,
        totalAmount: plan.amount * plan.total,
    }));
  }, [user, transactions]);
  
  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">{t('manage_installments')}</h1>
        <p className="text-slate-500">{t('edit_and_track_progress')}</p>
        
        <div className="space-y-6">
            {installmentPlans.length === 0 && (
                <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
                    <i className="fas fa-calendar-day text-4xl text-slate-300 mb-4"></i>
                    <h3 className="text-xl font-semibold text-slate-700">{t('no_installments_found')}</h3>
                    <p className="text-slate-500 mt-2">{t('no_installments_desc')}</p>
                </div>
            )}
            {installmentPlans.map(item => {
                const progress = (item.paid / item.total) * 100;
                return (
                    <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">{item.name}</h3>
                                <p className="text-sm text-slate-500">{t('installments_of', { total: item.total, amount: formatCurrency(item.amount) })} | {t('total_value')}: {formatCurrency(item.totalAmount)}</p>
                            </div>
                            <button className="text-slate-500 hover:text-blue-600 font-medium text-sm"><i className="fas fa-pencil-alt mr-1"></i> {t('edit')}</button>
                        </div>
                        
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-slate-600">{t('progress')}</span>
                                <span className="text-sm font-semibold text-emerald-600">{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {Array.from({ length: item.total }, (_, i) => i + 1).map(installment => (
                                <div key={installment} className={`p-3 rounded-lg border text-center ${installment <= item.paid ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                                    <p className="text-xs text-slate-500">{t('installment_x_of_y', { current: installment, total: item.total })}</p>
                                    <p className="font-bold text-slate-800 mt-1">{formatCurrency(item.amount)}</p>
                                    <p className={`text-xs font-semibold mt-2 ${installment <= item.paid ? 'text-emerald-600' : 'text-blue-600'}`}>
                                        {installment <= item.paid ? t('paid') : t('future')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  );
};

export default Installments;