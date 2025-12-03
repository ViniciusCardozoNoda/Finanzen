import React from 'react';
import { useLocalization } from '../context/LocalizationContext';

const MeiCalculator: React.FC = () => {
  const { t } = useLocalization();

  return (
    <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">{t('mei_tax_calculator')}</h1>
        <p className="text-slate-500">{t('estimate_das_tax')}</p>
        
         <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-slate-700 mb-6">{t('inform_monthly_revenue')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="comercio">{t('revenue_commerce_industry')}</label>
                    <input type="number" id="comercio" placeholder="R$ 0,00" className="w-full bg-slate-50 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="servicos">{t('revenue_services')}</label>
                    <input type="number" id="servicos" placeholder="R$ 0,00" className="w-full bg-slate-50 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                </div>
            </div>
             <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                {t('calculate_das')}
            </button>
         </div>

         <div className="max-w-2xl mx-auto p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg flex items-start space-x-3">
            <i className="fas fa-info-circle mt-1"></i>
            <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('mei_calculator_warning') }} />
         </div>
    </div>
  );
};

export default MeiCalculator;