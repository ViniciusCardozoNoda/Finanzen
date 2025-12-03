
import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import { TRANSACTION_CATEGORIES, PAYMENT_METHODS } from '../constants';

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

const IncomeManagement: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLocalization();
  const { transactions, accounts, addTransaction } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const userAccounts = useMemo(() => {
    if (!user) return [];
    // Data context already filters accounts by current space
    return accounts;
  }, [accounts, user]);

  const initialFormState = {
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    paymentMethod: '',
    accountId: userAccounts[0]?.id.toString() || '',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Effect to reset form when modal opens or available accounts change
  useEffect(() => {
    if (isModalOpen) {
      setFormData({
        ...initialFormState,
        accountId: userAccounts[0]?.id.toString() || '',
      });
      setErrors({});
    }
  }, [isModalOpen, userAccounts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: undefined}));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.description.trim()) newErrors.description = t('error_description_required');
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = t('error_amount_positive');
    if (!formData.accountId) newErrors.accountId = t('error_account_required');
    if (!formData.category) newErrors.category = t('error_category_required');
    if (!formData.paymentMethod) newErrors.paymentMethod = t('error_payment_method_required');
    return newErrors;
  }

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    if (!user) return;

    addTransaction({
      userId: user.id,
      accountId: Number(formData.accountId),
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: 'income',
      date: new Date(formData.date + 'T00:00:00'),
      category: formData.category,
      paymentMethod: formData.paymentMethod,
    });

    setIsModalOpen(false);
    setShowSuccessToast(true);
    setTimeout(() => {
        setShowSuccessToast(false);
    }, 3000);
  };

  const userIncome = useMemo(() => {
    // Data is already scoped by DataContext based on user role
    return transactions
        .filter(t => t.type === 'income')
        .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions]);

  const summaryData = useMemo(() => {
    const total = userIncome.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const count = userIncome.length;
    const average = count > 0 ? total / count : 0;
    return { total, count, average };
  }, [userIncome]);

  const categoryIcons: { [key: string]: string } = {
    'Salário': 'fa-money-bill-wave',
    'Freelance': 'fa-laptop-code',
    'Investimentos': 'fa-chart-line',
    'Presente': 'fa-gift',
    'Bônus': 'fa-star',
    'Outros': 'fa-ellipsis-h',
  };
  const getCategoryIcon = (category: string) => categoryIcons[category] || 'fa-question-circle';

  return (
    <>
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white py-3 px-5 rounded-lg shadow-lg animate-fade-in z-50">
            <i className="fas fa-check-circle mr-2"></i>
            {t('income_added_successfully')}
        </div>
      )}
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">{t('manage_your_income')}</h1>
            <button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
                + {t('add_income')}
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard title={t('total_income')} value={`R$ ${summaryData.total.toFixed(2)}`} icon="fa-dollar-sign" color="bg-gradient-to-tr from-green-400 to-green-500" />
          <SummaryCard title={t('records')} value={`${summaryData.count}`} icon="fa-receipt" color="bg-gradient-to-tr from-blue-400 to-blue-500" />
          <SummaryCard title={t('average_income')} value={`R$ ${summaryData.average.toFixed(2)}`} icon="fa-calculator" color="bg-gradient-to-tr from-purple-400 to-purple-500" />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-slate-200">
              <i className="fas fa-filter text-slate-400"></i>
              <h3 className="text-md font-semibold text-slate-600">{t('filters')}</h3>
          </div>
          {/* Filter inputs would go here */}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Lista de Receitas ({userIncome.length})</h3>
          {userIncome.length === 0 ? (
              <div className="text-center py-12">
                  <div className="text-5xl text-slate-300 mb-4">
                      <i className="fas fa-dollar-sign"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700">{t('no_income_found')}</h3>
                  <p className="text-slate-500 mt-2">{t('add_your_first_income')}</p>
              </div>
          ) : (
              <ul className="space-y-4">
                  {userIncome.map(tx => (
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
                              <span className="font-bold text-green-500 text-lg sm:mr-6">+ R$ {tx.amount.toFixed(2)}</span>
                              <div className="flex space-x-2">
                                  <button className="text-slate-500 hover:text-blue-600 text-sm font-medium"><i className="fas fa-pencil-alt mr-1"></i> {t('edit')}</button>
                                  <button className="text-slate-500 hover:text-red-600 text-sm font-medium"><i className="fas fa-trash-alt mr-1"></i> {t('delete')}</button>
                              </div>
                          </div>
                      </li>
                  ))}
              </ul>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6 text-slate-800">{t('add_income')}</h3>
            <form onSubmit={handleAddIncome} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">{t('description')}</label>
                      <input type="text" id="description" name="description" value={formData.description} onChange={handleInputChange} className={`w-full bg-slate-100 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.description ? 'border-red-500' : 'border-slate-300'}`} />
                      {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                  </div>
                  <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">{t('amount')}</label>
                      <input type="number" step="0.01" id="amount" name="amount" value={formData.amount} onChange={handleInputChange} className={`w-full bg-slate-100 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.amount ? 'border-red-500' : 'border-slate-300'}`} />
                      {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="accountId" className="block text-sm font-medium text-slate-600 mb-1">{t('account')}</label>
                      <select id="accountId" name="accountId" value={formData.accountId} onChange={handleInputChange} className={`w-full bg-slate-100 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.accountId ? 'border-red-500' : 'border-slate-300'}`}>
                          <option value="">{t('select_account')}</option>
                          {userAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>
                      {errors.accountId && <p className="text-red-500 text-xs mt-1">{errors.accountId}</p>}
                  </div>
                  <div>
                      <label htmlFor="date" className="block text-sm font-medium text-slate-600 mb-1">{t('date')}</label>
                      <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border"/>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="category" className="block text-sm font-medium text-slate-600 mb-1">{t('category')}</label>
                      <select id="category" name="category" value={formData.category} onChange={handleInputChange} className={`w-full bg-slate-100 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.category ? 'border-red-500' : 'border-slate-300'}`}>
                          <option value="">{t('select_category')}</option>
                          {TRANSACTION_CATEGORIES.income.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                  </div>
                  <div>
                      <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-600 mb-1">{t('payment_method')}</label>
                      <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className={`w-full bg-slate-100 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.paymentMethod ? 'border-red-500' : 'border-slate-300'}`}>
                          <option value="">{t('select_payment_method')}</option>
                          {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                      </select>
                      {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod}</p>}
                  </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default IncomeManagement;
