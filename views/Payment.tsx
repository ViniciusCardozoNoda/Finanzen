
import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useAuth } from '../context/AuthContext';
import { View } from '../types';
import { dbService } from '../services/dbService';
import { PaymentSettings } from '../types';

interface PaymentProps {
  setCurrentView: (view: View) => void;
}

type PaymentMethod = 'card' | 'pix' | 'boleto';

const Payment: React.FC<PaymentProps> = ({ setCurrentView }) => {
  const { t } = useLocalization();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<PaymentMethod>('card');
  const [paymentSettings, setPaymentSettings] = useState<Partial<PaymentSettings>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pixKeyCopied, setPixKeyCopied] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await dbService.getSetting<PaymentSettings>('payment');
      if (settings) {
        setPaymentSettings(settings);
      }
    };
    fetchSettings();
  }, []);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      if (user) {
        updateUser({ ...user, subscriptionStatus: 'active', trialEndDate: undefined, cancellationDate: undefined });
      }
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  const copyPixKey = () => {
    if (paymentSettings.pixKey) {
        navigator.clipboard.writeText(paymentSettings.pixKey);
        setPixKeyCopied(true);
        setTimeout(() => setPixKeyCopied(false), 2000);
    }
  };

  if (isSuccess) {
    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto text-center animate-fade-in">
            <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-500 rounded-full">
                    <i className="fas fa-check text-5xl text-white"></i>
                </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{t('payment_successful')}</h2>
            <p className="text-slate-600 mt-2 mb-6">{t('payment_successful_desc')}</p>
            <button onClick={() => setCurrentView('dashboard')} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg">
                {t('go_to_dashboard')}
            </button>
        </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'pix':
        return (
          <div className="text-center space-y-4">
            <p className="text-slate-600">{t('scan_qr_code')}</p>
            <div className="bg-slate-100 p-4 rounded-lg inline-block">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Example" alt="QR Code" />
            </div>
            <p className="text-slate-600">{t('or_copy_pix_key')}</p>
            <div className="relative">
                <input type="text" readOnly value={paymentSettings.pixKey || 'N/A'} className="w-full bg-slate-100 border-slate-300 text-slate-700 p-3 rounded-md text-center font-mono" />
                <button onClick={copyPixKey} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm bg-emerald-500 text-white font-semibold py-1 px-3 rounded">
                    {pixKeyCopied ? t('key_copied') : t('copy_key')}
                </button>
            </div>
            <button onClick={handlePayment} disabled={isProcessing} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-300">
              {isProcessing ? t('processing_payment') : "Simular Pagamento PIX"}
            </button>
          </div>
        );
      case 'boleto':
        return (
            <div className="text-center space-y-6">
                <i className="fas fa-barcode text-6xl text-slate-400"></i>
                <p className="text-slate-600">{t('boleto_generated_message')}</p>
                <button onClick={handlePayment} disabled={isProcessing} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-300">
                   {isProcessing ? t('processing_payment') : t('generate_boleto')}
                </button>
            </div>
        );
      case 'card':
      default:
        return (
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('card_number')}</label>
              <input type="text" placeholder="0000 0000 0000 0000" required className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('card_holder_name')}</label>
              <input type="text" placeholder="Nome como no cartão" required className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('expiry_date')}</label>
                <input type="text" placeholder="MM/AA" required className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('cvv')}</label>
                <input type="text" placeholder="123" required className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
              </div>
            </div>
            <button type="submit" disabled={isProcessing} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-300">
              {isProcessing ? t('processing_payment') : t('pay_now')}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">{t('payment_checkout')}</h1>
            <p className="text-slate-500 mt-1">{t('payment_checkout_desc')}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200">
            <div className="flex border-b border-slate-200 mb-6">
                <button onClick={() => setActiveTab('card')} className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 ${activeTab === 'card' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <i className="fas fa-credit-card mr-2"></i>{t('credit_card')}
                </button>
                <button onClick={() => setActiveTab('pix')} className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 ${activeTab === 'pix' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <i className="fas fa-qrcode mr-2"></i>{t('pix')}
                </button>
                 <button onClick={() => setActiveTab('boleto')} className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 ${activeTab === 'boleto' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <i className="fas fa-barcode mr-2"></i>{t('boleto')}
                </button>
            </div>
            {renderContent()}
        </div>
    </div>
  );
};

export default Payment;
