
import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Account } from '../types';

const Accounts: React.FC = () => {
  const { t } = useLocalization();
  const { accounts, addAccount, deleteAccount, currentSpaceId } = useData();
  const { user } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountDesc, setNewAccountDesc] = useState('');
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteSuccessToast, setShowDeleteSuccessToast] = useState(false);

  const handleOpenCreateModal = () => {
    setNewAccountName('');
    setNewAccountDesc('');
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsModalOpen(false);
    setErrors({});
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: { name?: string; description?: string } = {};
    if (!newAccountName.trim()) {
      validationErrors.name = t('error_account_name_required');
    }
    if (!newAccountDesc.trim()) {
      validationErrors.description = t('error_account_description_required');
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
    if (!user) return;

    addAccount({
        userId: user.id,
        name: newAccountName,
        description: newAccountDesc,
    });

    handleCloseCreateModal();
  };

  const openDeleteModal = (account: Account) => {
    setAccountToDelete(account);
    setDeleteError(''); // Clear previous errors
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAccountToDelete(null);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    try {
        await deleteAccount(accountToDelete.id);
        closeDeleteModal();
        setShowDeleteSuccessToast(true);
        setTimeout(() => {
            setShowDeleteSuccessToast(false);
        }, 3000);
    } catch (error) {
        setDeleteError(error instanceof Error ? error.message : String(error));
    }
  };


  return (
    <>
      {showDeleteSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white py-3 px-5 rounded-lg shadow-lg animate-fade-in z-50">
            <i className="fas fa-check-circle mr-2"></i>
            {t('account_deleted_successfully')}
        </div>
      )}
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
              <h1 className="text-2xl font-bold text-slate-800">{t('manage_accounts')}</h1>
              <p className="text-slate-500 mt-1">{t('organize_finances_accounts')}</p>
          </div>
          <button onClick={handleOpenCreateModal} className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
              + {t('add_account')}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => (
            <div key={account.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                  <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600">
                          <i className={`fas ${currentSpaceId ? 'fa-users' : 'fa-user-circle'} text-2xl`}></i>
                      </div>
                      <div className="flex space-x-2">
                          <button className="text-slate-400 hover:text-blue-600"><i className="fas fa-pencil-alt"></i></button>
                          <button onClick={() => openDeleteModal(account)} className="text-slate-400 hover:text-red-600"><i className="fas fa-trash-alt"></i></button>
                      </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mt-4">{account.name}</h3>
                  <p className="text-sm text-slate-500">{account.description}</p>
              </div>
              <div className="mt-6">
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{t('active_account')}</span>
              </div>
            </div>
          ))}
        </div>
        
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={handleCloseCreateModal}>
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-6 text-slate-800">{t('add_account')}</h3>
                  <form onSubmit={handleAddAccount} className="space-y-4">
                      <div>
                          <input 
                              type="text" 
                              placeholder={t('account_name')} 
                              value={newAccountName} 
                              onChange={e => {
                                setNewAccountName(e.target.value);
                                if (errors.name) setErrors(prev => ({...prev, name: undefined}));
                              }}
                              className={`w-full bg-slate-100 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.name ? 'border-red-500' : 'border-slate-300'}`} 
                          />
                          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div>
                          <input 
                              type="text" 
                              placeholder={t('description')} 
                              value={newAccountDesc} 
                              onChange={e => {
                                setNewAccountDesc(e.target.value);
                                if (errors.description) setErrors(prev => ({...prev, description: undefined}));
                              }} 
                              className={`w-full bg-slate-100 border text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.description ? 'border-red-500' : 'border-slate-300'}`} 
                          />
                          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                      </div>
                      <div className="flex justify-end space-x-4 pt-4">
                          <button type="button" onClick={handleCloseCreateModal} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                          <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('save')}</button>
                      </div>
                  </form>
              </div>
          </div>
        )}

      {isDeleteModalOpen && accountToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={closeDeleteModal}>
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-4 text-slate-800">{t('confirm_delete_title')}</h3>
                  <p className="text-slate-600 mb-6">
                      {t('are_you_sure_delete_account', { accountName: accountToDelete.name })}
                  </p>
                  {deleteError && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">
                          <span className="block sm:inline">{deleteError}</span>
                      </div>
                  )}
                  <div className="flex justify-end space-x-4">
                      <button type="button" onClick={closeDeleteModal} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                      <button type="button" onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg">{t('confirm')}</button>
                  </div>
              </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Accounts;
