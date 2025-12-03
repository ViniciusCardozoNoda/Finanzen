import React from 'react';
import { useLocalization } from '../context/LocalizationContext';

const MonthlyHistory: React.FC = () => {
  const { t } = useLocalization();

  return (
    <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">Histórico Mensal</h1>
        <p className="text-slate-500">Visualize e analise seus gastos por mês</p>
        
        {/* Placeholder for future implementation */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
             <i className="fas fa-chart-bar text-4xl text-slate-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-slate-700">Em Breve</h3>
            <p className="text-slate-500 mt-2">A funcionalidade de histórico mensal está em desenvolvimento.</p>
        </div>
    </div>
  );
};

export default MonthlyHistory;
