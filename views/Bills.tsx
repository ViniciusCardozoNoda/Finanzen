
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import { Bill } from '../types';

const Bills: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLocalization();
  const { bills, addBill, updateBill } = useData();
  
  const sortedBills = useMemo(() => {
    // Data is already scoped by DataContext, just need to sort it
    return [...bills].sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [bills]);

  const [showModal, setShowModal] = useState(false);
  const [newBill, setNewBill] = useState({ 
    name: '', 
    amount: '', 
    dueDate: '',
    recurrence: 'one-time' as 'one-time' | 'monthly' | 'yearly'
  });

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newBill.dueDate) return;

    addBill({
      userId: user.id,
      name: newBill.name,
      amount: parseFloat(newBill.amount),
      dueDate: new Date(newBill.dueDate + 'T00:00:00'),
      isRecurring: newBill.recurrence !== 'one-time',
      recurrence: newBill.recurrence === 'one-time' ? undefined : newBill.recurrence,
    });
    setShowModal(false);
    setNewBill({ name: '', amount: '', dueDate: '', recurrence: 'one-time' });
  };

  const togglePaidStatus = (billToToggle: Bill) => {
    if(billToToggle) {
        updateBill({ ...billToToggle, isPaid: !billToToggle.isPaid });
    }
  };

  const getStatusChip = (bill: { isPaid: boolean; dueDate: Date }) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    if (bill.isPaid) {
        return <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">{t('paid')}</div>;
    }
    const dueDate = new Date(bill.dueDate);
    dueDate.setHours(0,0,0,0);
    if (dueDate < today) {
        return <div className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Vencida</div>;
    }
    return <div className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">{t('unpaid')}</div>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">{t('manage_your_bills')}</h1>
            <button onClick={() => setShowModal(true)} className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
                + {t('add_bill')}
            </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <ul className="space-y-4">
            {sortedBills.map(bill => (
                <li key={bill.id} className="p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center">
                        <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-slate-800 ${bill.isPaid ? 'line-through text-slate-500' : ''}`}>{bill.name}</p>
                            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                                <span><i className="fas fa-calendar-alt mr-1"></i>{new Date(bill.dueDate).toLocaleDateString('pt-BR')}</span>
                                {bill.isRecurring && (
                                    <span className="flex items-center text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        <i className="fas fa-sync-alt mr-1.5 text-xs"></i>
                                        {t(bill.recurrence || '')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                        {getStatusChip(bill)}
                        <span className={`font-bold text-lg ${bill.isPaid ? 'text-slate-500' : 'text-slate-800'}`}>
                            R$ {bill.amount.toFixed(2)}
                        </span>
                        <button 
                            onClick={() => togglePaidStatus(bill)} 
                            className={`text-sm font-medium py-1 px-3 rounded-md transition-colors ${bill.isPaid ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200' : 'text-green-600 bg-green-100 hover:bg-green-200'}`}
                        >
                          {bill.isPaid ? t('mark_as_unpaid') : t('mark_as_paid')}
                        </button>
                    </div>
                </li>
            ))}
            {sortedBills.length === 0 && (
                <p className="text-center text-slate-500 py-8">Nenhuma conta encontrada.</p>
            )}
            </ul>
        </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-slate-800">{t('add_bill')}</h3>
            <form onSubmit={handleAddBill} className="space-y-4">
              <input type="text" placeholder={t('bill_name')} value={newBill.name} onChange={e => setNewBill({...newBill, name: e.target.value})} required className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
              <input type="number" step="0.01" placeholder={t('amount')} value={newBill.amount} onChange={e => setNewBill({...newBill, amount: e.target.value})} required className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
              <input type="date" value={newBill.dueDate} onChange={e => setNewBill({...newBill, dueDate: e.target.value})} required className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
              <div>
                <label htmlFor="recurrence" className="block text-sm font-medium text-slate-600 mb-1">{t('recurrence')}</label>
                <select id="recurrence" value={newBill.recurrence} onChange={e => setNewBill({...newBill, recurrence: e.target.value as 'one-time' | 'monthly' | 'yearly'})} className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border">
                    <option value="one-time">{t('one_time')}</option>
                    <option value="monthly">{t('monthly')}</option>
                    <option value="yearly">{t('yearly')}</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;