
import React, { useState, useEffect, useMemo } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { View, ExpenseType } from '../types';
import { TRANSACTION_CATEGORIES, PAYMENT_METHODS } from '../constants';

interface NewExpenseProps {
  setCurrentView: (view: View) => void;
}

interface ExpenseDraft {
    description: string;
    amount: string;
    date: string;
    category: string;
    paymentMethod: string;
    expenseType: ExpenseType;
    installmentsCount: string; // New field for input
    observations: string;
    accountId: number | '';
}

const DRAFT_STORAGE_KEY = 'expenseDraft';

const NewExpense: React.FC<NewExpenseProps> = ({ setCurrentView }) => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const { addTransaction, accounts } = useData(); // `accounts` is already filtered by context

  const getInitialState = (): ExpenseDraft => ({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0], // Default to today's date
    category: '',
    paymentMethod: '',
    expenseType: 'unique',
    installmentsCount: '',
    observations: '',
    accountId: accounts[0]?.id || '',
  });

  const [formData, setFormData] = useState<ExpenseDraft>(getInitialState());
  const [draft, setDraft] = useState<ExpenseDraft | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseDraft, string>>>({});

  useEffect(() => {
    try {
        const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            setDraft(JSON.parse(savedDraft));
        }
    } catch (error) {
        console.error("Failed to load draft from localStorage:", error);
    }
  }, []);
  
  // Set default account when accounts are loaded or context changes
  useEffect(() => {
    if (accounts.length > 0) {
        // If current accountId is not in the list of available accounts, reset it
        if (!formData.accountId || !accounts.some(acc => acc.id === formData.accountId)) {
            setFormData(prev => ({...prev, accountId: accounts[0].id}));
        }
    } else {
        setFormData(prev => ({...prev, accountId: ''}));
    }
  }, [accounts]);

  const clearForm = () => {
    setFormData(getInitialState());
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ExpenseDraft]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ExpenseDraft, string>> = {};
    if (!formData.description.trim()) newErrors.description = t('error_description_required');
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = t('error_amount_positive');
    if (!formData.accountId) newErrors.accountId = t('error_account_required');
    if (!formData.category) newErrors.category = t('error_category_required');
    if (!formData.paymentMethod) newErrors.paymentMethod = t('error_payment_method_required');
    if (formData.expenseType === 'installment' && (!formData.installmentsCount || parseInt(formData.installmentsCount) < 2)) {
        newErrors.installmentsCount = "Informe o número de parcelas (min 2).";
    }
    return newErrors;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    if (!user) return;

    // Prepare installment data object if applicable
    const installments = formData.expenseType === 'installment' 
        ? { current: 1, total: parseInt(formData.installmentsCount) }
        : undefined;

    addTransaction({
      userId: user.id,
      accountId: formData.accountId as number,
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: 'expense',
      date: new Date(formData.date + 'T00:00:00'),
      category: formData.category,
      paymentMethod: formData.paymentMethod,
      expenseType: formData.expenseType,
      installments: installments, // Backend logic will generate records based on this
    });
    
    clearForm();
    setCurrentView('my-expenses');
  };

  const handleSaveDraft = () => {
    try {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        alert(t('draft_saved_successfully'));
        clearForm();
    } catch (error) {
        console.error("Failed to save draft to localStorage:", error);
        alert(t('failed_to_save_draft'));
    }
  };

  const handleLoadDraft = () => {
    if (draft) {
        setFormData(draft);
        handleDismissDraft();
    }
  };

  const handleDismissDraft = () => {
    try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraft(null);
    } catch (error) {
        console.error("Failed to remove draft from localStorage:", error);
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4">
        <button onClick={() => setCurrentView('dashboard')} className="text-slate-500 hover:text-slate-800">
            <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('new_expense')}</h1>
            <p className="text-slate-500 mt-1">{t('add_and_categorize_expense')}</p>
        </div>
      </div>
      
      {draft && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md flex justify-between items-center" role="alert">
            <p className="font-bold">{t('you_have_a_draft')}</p>
            <div>
                <button onClick={handleLoadDraft} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-lg text-sm mr-2">
                    {t('load_draft')}
                </button>
                <button onClick={handleDismissDraft} className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                    {t('dismiss')}
                </button>
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-700 mb-6">{t('expense_details')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="description">{t('description')}</label>
                <input type="text" id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder={t('ex_italian_restaurant')} className={`w-full bg-slate-50 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.description ? 'border-red-500' : 'border-slate-300'}`} />
                 {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="accountId">{t('account')}</label>
                 <select id="accountId" name="accountId" value={formData.accountId} onChange={handleInputChange} className={`w-full bg-slate-50 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.accountId ? 'border-red-500' : 'border-slate-300'}`}>
                    <option value="">{t('select_account')}</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
                {errors.accountId && <p className="text-red-500 text-xs mt-1">{errors.accountId}</p>}
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="amount">{t('value')}</label>
                <input type="number" step="0.01" id="amount" name="amount" value={formData.amount} onChange={handleInputChange} className={`w-full bg-slate-50 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.amount ? 'border-red-500' : 'border-slate-300'}`} />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>
        </div>

        <div className="mb-6">
            <label className="block text-sm font-medium text-slate-600 mb-2">{t('expense_type')}</label>
            <div className="grid grid-cols-3 gap-4">
                <button type="button" onClick={() => setFormData(p => ({...p, expenseType: 'unique'}))} className={`p-4 border rounded-lg text-center ${formData.expenseType === 'unique' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500' : 'bg-slate-50 border-slate-300 hover:border-slate-400'}`}>
                    <i className="fas fa-receipt text-2xl text-emerald-500 mb-2"></i>
                    <p className="font-semibold text-slate-700">{t('unique')}</p>
                    <p className="text-xs text-slate-500">{t('unique_expense_desc')}</p>
                </button>
                <button type="button" onClick={() => setFormData(p => ({...p, expenseType: 'fixed'}))} className={`p-4 border rounded-lg text-center ${formData.expenseType === 'fixed' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500' : 'bg-slate-50 border-slate-300 hover:border-slate-400'}`}>
                    <i className="fas fa-sync-alt text-2xl text-emerald-500 mb-2"></i>
                    <p className="font-semibold text-slate-700">{t('fixed')}</p>
                    <p className="text-xs text-slate-500">{t('fixed_expense_desc')}</p>
                </button>
                <button type="button" onClick={() => setFormData(p => ({...p, expenseType: 'installment'}))} className={`p-4 border rounded-lg text-center ${formData.expenseType === 'installment' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500' : 'bg-slate-50 border-slate-300 hover:border-slate-400'}`}>
                    <i className="fas fa-calendar-day text-2xl text-emerald-500 mb-2"></i>
                    <p className="font-semibold text-slate-700">{t('installment')}</p>
                    <p className="text-xs text-slate-500">{t('installment_expense_desc')}</p>
                </button>
            </div>
        </div>

        {formData.expenseType === 'installment' && (
            <div className="mb-6 animate-fade-in">
                <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="installmentsCount">Número de Parcelas</label>
                <input type="number" min="2" max="60" id="installmentsCount" name="installmentsCount" value={formData.installmentsCount} onChange={handleInputChange} placeholder="Ex: 10" className={`w-full bg-slate-50 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.installmentsCount ? 'border-red-500' : 'border-slate-300'}`} />
                {errors.installmentsCount && <p className="text-red-500 text-xs mt-1">{errors.installmentsCount}</p>}
                <p className="text-xs text-slate-500 mt-1">O sistema irá gerar automaticamente uma despesa para cada mês futuro.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="date">{t('date')}</label>
                <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full bg-slate-50 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="category">{t('category')}</label>
                <select id="category" name="category" value={formData.category} onChange={handleInputChange} className={`w-full bg-slate-50 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.category ? 'border-red-500' : 'border-slate-300'}`}>
                    <option value="">{t('select_category')}</option>
                    {TRANSACTION_CATEGORIES.expense.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="paymentMethod">{t('payment_method')}</label>
                <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className={`w-full bg-slate-50 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.paymentMethod ? 'border-red-500' : 'border-slate-300'}`}>
                     <option value="">{t('select_payment_method')}</option>
                    {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                </select>
                {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod}</p>}
            </div>
        </div>
        
         <div className="mb-6">
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="observations">{t('observations')}</label>
            <textarea id="observations" name="observations" value={formData.observations} onChange={handleInputChange} rows={3} placeholder={t('add_observations')} className="w-full bg-slate-50 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
        </div>
        
        <div className="flex justify-end items-center space-x-4">
            <button 
                type="button" 
                onClick={handleSaveDraft}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors"
            >
                {t('save_as_draft')}
            </button>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                {t('save')}
            </button>
        </div>
      </form>
    </div>
  );
};

export default NewExpense;
