
import React, { useState, useMemo } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { TRANSACTION_CATEGORIES } from '../constants';

const Goals: React.FC = () => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const { goals, addGoal, deleteGoal, transactions } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ category: '', limit: '' });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const handleAddGoal = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newGoal.category || !newGoal.limit) return;
      
      addGoal({
          userId: user.id,
          category: newGoal.category,
          limit: parseFloat(newGoal.limit),
          month: currentMonth,
          year: currentYear
      });
      setIsModalOpen(false);
      setNewGoal({ category: '', limit: '' });
  };

  const goalStatus = useMemo(() => {
      return goals.filter(g => g.month === currentMonth && g.year === currentYear).map(goal => {
          const spent = transactions
            .filter(tx => 
                tx.type === 'expense' && 
                tx.category === goal.category && 
                tx.date.getMonth() === currentMonth && 
                tx.date.getFullYear() === currentYear
            )
            .reduce((acc, tx) => acc + tx.amount, 0);
          
          const percentage = Math.min((spent / goal.limit) * 100, 100);
          let status = 'on_track';
          if (percentage >= 100) status = 'exceeded';
          else if (percentage >= 80) status = 'in_alert';

          return { ...goal, spent, percentage, status };
      });
  }, [goals, transactions, currentMonth, currentYear]);

  const stats = {
      onTrack: goalStatus.filter(g => g.status === 'on_track').length,
      inAlert: goalStatus.filter(g => g.status === 'in_alert').length,
      exceeded: goalStatus.filter(g => g.status === 'exceeded').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('spending_goals')}</h1>
            <p className="text-slate-500 mt-1">{t('control_monthly_limits')}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
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
                <p className="text-xl font-bold text-slate-800">{stats.onTrack}</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
             <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-yellow-100 text-yellow-600">
                <i className="fas fa-exclamation-triangle text-xl"></i>
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{t('in_alert')}</p>
                <p className="text-xl font-bold text-slate-800">{stats.inAlert}</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
             <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-100 text-red-600">
                <i className="fas fa-times-circle text-xl"></i>
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{t('exceeded')}</p>
                <p className="text-xl font-bold text-slate-800">{stats.exceeded}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalStatus.map(goal => (
              <div key={goal.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 relative group">
                  <button onClick={() => deleteGoal(goal.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fas fa-trash-alt"></i>
                  </button>
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-slate-800">{goal.category}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${goal.status === 'exceeded' ? 'bg-red-100 text-red-700' : goal.status === 'in_alert' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {goal.percentage.toFixed(0)}%
                      </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4">
                      <div className={`h-2.5 rounded-full ${goal.status === 'exceeded' ? 'bg-red-500' : goal.status === 'in_alert' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${goal.percentage}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Gasto: <span className="font-semibold text-slate-800">R$ {goal.spent.toFixed(2)}</span></span>
                      <span className="text-slate-500">Meta: <span className="font-semibold text-slate-800">R$ {goal.limit.toFixed(2)}</span></span>
                  </div>
              </div>
          ))}
      </div>

      {goalStatus.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
            <div className="text-5xl text-slate-300 mb-4">
                <i className="fas fa-bullseye"></i>
            </div>
            <h3 className="text-xl font-semibold text-slate-700">{t('no_goals_defined')}</h3>
            <p className="text-slate-500 mt-2">{t('create_first_goal_desc')}</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-slate-800">{t('create_goal')}</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('category')}</label>
                <select 
                    value={newGoal.category} 
                    onChange={e => setNewGoal({...newGoal, category: e.target.value})} 
                    className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                    required
                >
                    <option value="">{t('select_category')}</option>
                    {TRANSACTION_CATEGORIES.expense.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Limite Mensal (R$)</label>
                <input 
                    type="number" 
                    value={newGoal.limit} 
                    onChange={e => setNewGoal({...newGoal, limit: e.target.value})} 
                    className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                    required
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
