import React from 'react';
import { useLocalization } from '../context/LocalizationContext';

const Goals: React.FC = () => {
  const { t } = useLocalization();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('spending_goals')}</h1>
            <p className="text-slate-500 mt-1">{t('control_monthly_limits')}</p>
        </div>
        <button className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
            + {t('new_goal')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
             <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
                <i className="fas fa-check-circle text-xl"></i>
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{t('goals_on_track')}</p>
                <p className="text-xl font-bold text-slate-800">0</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
             <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-yellow-100 text-yellow-600">
                <i className="fas fa-exclamation-triangle text-xl"></i>
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{t('in_alert')}</p>
                <p className="text-xl font-bold text-slate-800">0</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
             <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-100 text-red-600">
                <i className="fas fa-times-circle text-xl"></i>
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{t('exceeded')}</p>
                <p className="text-xl font-bold text-slate-800">0</p>
            </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
         <div className="text-5xl text-slate-300 mb-4">
            <i className="fas fa-bullseye"></i>
        </div>
        <h3 className="text-xl font-semibold text-slate-700">{t('no_goals_defined')}</h3>
        <p className="text-slate-500 mt-2">{t('create_first_goal_desc')}</p>
        <button className="mt-6 bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
            + {t('create_goal')}
        </button>
      </div>
    </div>
  );
};

export default Goals;