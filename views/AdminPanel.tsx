
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { User, PaymentSettings } from '../types';
import { dbService } from '../services/dbService';

const AdminPanel: React.FC = () => {
  const { user, users, updateOtherUser, changePassword, createAdmin } = useAuth();
  const { t } = useLocalization();
  
  // Settings State
  const [prices, setPrices] = useState({ usd: '9.99', eur: '8.99', brl: '49.99' });
  const [supportEmail, setSupportEmail] = useState('');
  
  // Security State
  const [passChangeForm, setPassChangeForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', password: '' });
  const [securityMessage, setSecurityMessage] = useState({ type: '', key: '' });
  
  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState<Partial<PaymentSettings>>({});
  const [paymentMessage, setPaymentMessage] = useState('');


  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedPrices = localStorage.getItem('subscriptionPrices');
        if (storedPrices) setPrices(JSON.parse(storedPrices));
        
        const storedEmail = localStorage.getItem('supportEmail');
        if (storedEmail) setSupportEmail(storedEmail);
      } catch (error) {
        console.error("Failed to read settings from localStorage:", error);
      }

      const storedPaymentSettings = await dbService.getSetting<PaymentSettings>('payment');
      if (storedPaymentSettings) setPaymentSettings(storedPaymentSettings);
    };
    loadSettings();
  }, []);

  if (user?.role !== 'admin') {
    return <div className="text-red-500 p-8">{t('access_denied')}</div>;
  }

  const handleGrantAccess = (targetUser: User) => {
    updateOtherUser({ ...targetUser, subscriptionStatus: 'active', trialEndDate: undefined, cancellationDate: undefined });
  };
  const handleStartTrial = (targetUser: User) => {
    const trialEndDate = new Date();
    trialEndDate.setMonth(trialEndDate.getMonth() + 1);
    updateOtherUser({ ...targetUser, subscriptionStatus: 'trial', trialEndDate, cancellationDate: undefined });
  };
  const handleRevokeAccess = (targetUser: User) => {
    updateOtherUser({ ...targetUser, subscriptionStatus: 'none', trialEndDate: undefined, cancellationDate: undefined });
  };


  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrices(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault();
    try {
        localStorage.setItem('subscriptionPrices', JSON.stringify(prices));
        alert(t('settings_saved_successfully'));
    } catch (error) {
        console.error("Failed to save prices to localStorage:", error);
        alert("Failed to save settings.");
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
        localStorage.setItem('supportEmail', supportEmail);
        alert(t('settings_saved_successfully'));
    } catch (error) {
        console.error("Failed to save email to localStorage:", error);
        alert("Failed to save settings.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage({ type: '', key: '' });
    if (passChangeForm.newPassword !== passChangeForm.confirmNewPassword) {
      setSecurityMessage({ type: 'error', key: 'passwords_do_not_match' });
      return;
    }
    if (!user) return;
    const result = await changePassword(user.id, passChangeForm.currentPassword, passChangeForm.newPassword);
    setSecurityMessage({ type: result.success ? 'success' : 'error', key: result.messageKey });
    if(result.success) {
      setPassChangeForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage({ type: '', key: '' });
    const { name, email, password } = newAdminForm;
    if (!name || !email || !password) return;
    const result = await createAdmin(name, email, password);
    setSecurityMessage({ type: result.success ? 'success' : 'error', key: result.messageKey });
     if(result.success) {
      setNewAdminForm({ name: '', email: '', password: '' });
    }
  };
  
  const handlePaymentSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.putSetting({ key: 'payment', value: paymentSettings });
    setPaymentMessage(t('payment_settings_saved_successfully'));
    setTimeout(() => setPaymentMessage(''), 3000);
  };

  const regularUsers = users.filter(u => u.role !== 'admin');

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800">{t('admin_panel')}</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">{t('security_administration')}</h2>
        {securityMessage.key && (
            <div className={`p-4 mb-4 text-sm rounded-lg ${securityMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role="alert">
                {t(securityMessage.key)}
            </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                    <h3 className="font-semibold text-slate-600">{t('change_your_password')}</h3>
                    <p className="text-xs text-slate-500">{t('change_password_desc')}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('current_password')}</label>
                    <input type="password" value={passChangeForm.currentPassword} onChange={e => setPassChangeForm(p => ({...p, currentPassword: e.target.value}))} required className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('new_password')}</label>
                    <input type="password" value={passChangeForm.newPassword} onChange={e => setPassChangeForm(p => ({...p, newPassword: e.target.value}))} required className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('confirm_new_password')}</label>
                    <input type="password" value={passChangeForm.confirmNewPassword} onChange={e => setPassChangeForm(p => ({...p, confirmNewPassword: e.target.value}))} required className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('change_password')}</button>
            </form>
            {/* Create Admin Form */}
            <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                    <h3 className="font-semibold text-slate-600">{t('create_new_admin')}</h3>
                    <p className="text-xs text-slate-500">{t('create_admin_desc')}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('full_name')}</label>
                    <input type="text" value={newAdminForm.name} onChange={e => setNewAdminForm(p => ({...p, name: e.target.value}))} required className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('email')}</label>
                    <input type="email" value={newAdminForm.email} onChange={e => setNewAdminForm(p => ({...p, email: e.target.value}))} required className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('password')}</label>
                    <input type="password" value={newAdminForm.password} onChange={e => setNewAdminForm(p => ({...p, password: e.target.value}))} required className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('create_account')}</button>
            </form>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">{t('payment_configuration')}</h2>
        <p className="text-sm text-slate-500 mb-4">{t('payment_configuration_desc')}</p>
        {paymentMessage && (
            <div className="p-4 mb-4 text-sm rounded-lg bg-green-100 text-green-700" role="alert">
                {paymentMessage}
            </div>
        )}
        <form onSubmit={handleSavePaymentSettings} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('pix_key_label')}</label>
                <input type="text" name="pixKey" value={paymentSettings.pixKey || ''} onChange={handlePaymentSettingsChange} placeholder={t('pix_key_placeholder')} className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
            </div>
            <div className="border-t border-slate-200 pt-6">
                 <h3 className="font-semibold text-slate-600">{t('bank_account_details')}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">{t('bank_name')}</label>
                        <input type="text" name="bankName" value={paymentSettings.bankName || ''} onChange={handlePaymentSettingsChange} className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">{t('agency')}</label>
                        <input type="text" name="agency" value={paymentSettings.agency || ''} onChange={handlePaymentSettingsChange} className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">{t('account_number')}</label>
                        <input type="text" name="accountNumber" value={paymentSettings.accountNumber || ''} onChange={handlePaymentSettingsChange} className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">{t('account_holder_name')}</label>
                        <input type="text" name="accountHolderName" value={paymentSettings.accountHolderName || ''} onChange={handlePaymentSettingsChange} className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                    </div>
                 </div>
            </div>
             <p className="text-xs text-slate-500"><i className="fas fa-lock mr-1"></i> {t('payment_info_security_notice')}</p>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('save_payment_settings')}</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">{t('general_settings')}</h2>
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
                <label htmlFor="supportEmail" className="block text-sm font-medium text-slate-600 mb-1">{t('support_email')}</label>
                 <p className="text-xs text-slate-500 mb-2">{t('support_email_desc')}</p>
                <input type="email" id="supportEmail" name="supportEmail" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
            </div>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('save_settings')}</button>
        </form>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">{t('subscription_prices')}</h2>
        <form onSubmit={handleSavePrices} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
                <label htmlFor="usd" className="block text-sm font-medium text-slate-600 mb-1">{t('price_usd')}</label>
                <input type="number" step="0.01" id="usd" name="usd" value={prices.usd} onChange={handlePriceChange} className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
            </div>
            <div>
                <label htmlFor="eur" className="block text-sm font-medium text-slate-600 mb-1">{t('price_eur')}</label>
                <input type="number" step="0.01" id="eur" name="eur" value={prices.eur} onChange={handlePriceChange} className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
            </div>
            <div>
                <label htmlFor="brl" className="block text-sm font-medium text-slate-600 mb-1">{t('price_brl')}</label>
                <input type="number" step="0.01" id="brl" name="brl" value={prices.brl} onChange={handlePriceChange} className="w-full bg-slate-50 border-slate-300 text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
            </div>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('set')}</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
         <h2 className="text-lg font-semibold text-slate-700 mb-4">{t('user_management')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Usuário</th>
                <th scope="col" className="px-6 py-3 font-semibold">{t('subscription')} Status</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {regularUsers.map(u => (
                <tr key={u.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    <div className="flex items-center">
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full mr-3" />
                      {u.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                         u.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 
                         u.subscriptionStatus === 'trial' ? 'bg-blue-100 text-blue-700' :
                         u.subscriptionStatus === 'cancellation_pending' ? 'bg-orange-100 text-orange-700' :
                         u.subscriptionStatus === 'expired' ? 'bg-yellow-100 text-yellow-700' :
                         'bg-slate-100 text-slate-600'
                     }`}>
                         {t(`status_${u.subscriptionStatus || 'none'}`)}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                        <button onClick={() => handleGrantAccess(u)} title={t('grant_full_access')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                            <i className="fas fa-check"></i>
                        </button>
                        <button onClick={() => handleStartTrial(u)} title={t('start_1_month_trial')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                            <i className="fas fa-hourglass-start"></i>
                        </button>
                        <button onClick={() => handleRevokeAccess(u)} title={t('revoke_access')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
