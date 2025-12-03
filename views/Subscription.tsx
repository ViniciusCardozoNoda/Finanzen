
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { User, SubscriptionStatus, View } from '../types';

interface Prices {
    usd: string;
    eur: string;
    brl: string;
}

interface SubscriptionProps {
    setCurrentView: (view: View) => void;
}

const Subscription: React.FC<SubscriptionProps> = ({ setCurrentView }) => {
    const { user, updateUser } = useAuth();
    const { t, language } = useLocalization();
    const [prices, setPrices] = useState<Prices>({ usd: '9.99', eur: '8.99', brl: '49.99' });
    const [supportEmail, setSupportEmail] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    useEffect(() => {
        try {
            const storedPrices = localStorage.getItem('subscriptionPrices');
            if (storedPrices) {
                setPrices(JSON.parse(storedPrices));
            }
            const savedEmail = localStorage.getItem('supportEmail');
            if (savedEmail) {
                setSupportEmail(savedEmail);
            }
        } catch (error) {
            console.error("Failed to read settings from localStorage:", error);
        }
    }, []);

    if (!user) return null;
    
    const handleStartTrial = () => {
        if (!user) return;
        const trialEndDate = new Date();
        trialEndDate.setMonth(trialEndDate.getMonth() + 1);
        updateUser({ ...user, subscriptionStatus: 'trial', trialEndDate });
    };

    const initiateCancellation = () => {
        const updatedUser: User = {
            ...user,
            subscriptionStatus: 'cancellation_pending',
            cancellationDate: new Date(),
        };
        updateUser(updatedUser);
        setIsCancelModalOpen(false);
        alert(t('cancellation_initiated'));
    };

    const getStatusInfo = (status?: SubscriptionStatus) => {
        switch(status) {
            case 'active':
                return { 
                    text: t('status_active'), 
                    color: 'text-green-500', 
                    icon: 'fa-check-circle',
                    description: t('manage_subscription')
                };
            case 'trial':
                return { 
                    text: t('status_trial'), 
                    color: 'text-blue-500', 
                    icon: 'fa-hourglass-start',
                    description: t('trial_description')
                };
            case 'expired':
                return { 
                    text: t('status_expired'), 
                    color: 'text-yellow-500', 
                    icon: 'fa-exclamation-triangle',
                    description: t('expired_description')
                };
            case 'cancellation_pending':
                const endDate = new Date(user.cancellationDate || '');
                endDate.setDate(endDate.getDate() + 1);
                return {
                    text: t('status_cancellation_pending'),
                    color: 'text-orange-500',
                    icon: 'fa-clock',
                    description: t('cancellation_pending_description', { date: endDate.toLocaleString() })
                };
            default:
                return { 
                    text: t('status_none'), 
                    color: 'text-slate-500', 
                    icon: 'fa-times-circle',
                    description: t('none_description')
                };
        }
    };

    const statusInfo = getStatusInfo(user.subscriptionStatus);

    const getPriceInfo = () => {
        switch (language) {
            case 'pt':
                return { currency: 'BRL', value: prices.brl };
            case 'es':
                return { currency: 'EUR', value: prices.eur };
            default:
                return { currency: 'USD', value: prices.usd };
        }
    }
    const { currency, value } = getPriceInfo();
    const formattedPrice = new Intl.NumberFormat(language, { style: 'currency', currency }).format(parseFloat(value) || 0);
    const canCancel = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial';

    return (
        <>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg max-w-2xl mx-auto text-center border border-slate-200 animate-fade-in">
                <div className="flex justify-center mb-4">
                    <div className="p-5 rounded-full bg-gradient-to-br from-emerald-500 to-green-500">
                        <i className={`fas fa-gem text-5xl text-white`}></i>
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('your_subscription')}</h2>
                
                <div className="my-6">
                    <p className="text-slate-500 mb-2">Status</p>
                    <div className={`inline-flex items-center text-lg font-semibold px-4 py-2 rounded-full ${statusInfo.color} bg-slate-100`}>
                        <i className={`fas ${statusInfo.icon} mr-2`}></i>
                        {statusInfo.text}
                    </div>
                </div>

                <p className="text-slate-600 mb-6 max-w-md mx-auto">{statusInfo.description}</p>
                
                {user.subscriptionStatus === 'trial' && user.trialEndDate && (
                    <p className="text-sm text-slate-500 mb-6">
                        {t('trial_ends_on')}: {user.trialEndDate.toLocaleDateString()}
                    </p>
                )}

                <div className="mt-8 space-y-4">
                    {user.subscriptionStatus === 'none' || user.subscriptionStatus === 'expired' ? (
                        <div>
                            <button 
                                onClick={handleStartTrial}
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all text-lg"
                            >
                                {t('start_1_month_trial')}
                            </button>
                            <p className="text-slate-500 text-sm mt-3">
                                {t('subscribe_for_price', { price: formattedPrice })}
                                <br/>
                                {t('after_trial_period')}
                            </p>
                        </div>
                    ) : (
                        canCancel &&
                        <button 
                            onClick={() => setIsCancelModalOpen(true)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            {t('cancel_subscription')}
                        </button>
                    )}
                     {(user.subscriptionStatus === 'none' || user.subscriptionStatus === 'expired') && (
                        <button 
                            onClick={() => setCurrentView('payment')}
                            className="text-sm text-slate-500 hover:text-emerald-600 font-medium"
                        >
                           Ou pague agora para ter acesso completo
                        </button>
                     )}


                    {canCancel && supportEmail && (
                        <div className="pt-4">
                            <a 
                                href={`mailto:${supportEmail}`}
                                className="text-sm text-slate-500 hover:text-emerald-600 font-medium"
                            >
                                <i className="fas fa-question-circle mr-1.5"></i>
                                {t('contact_support')}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {isCancelModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md animate-fade-in text-center">
                  <h3 className="text-xl font-bold mb-4 text-slate-800">{t('confirm_cancellation_title')}</h3>
                  <p className="text-slate-600 mb-8">
                    {t('confirm_cancellation_message')}
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button 
                      type="button" 
                      onClick={() => setIsCancelModalOpen(false)} 
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-6 rounded-lg"
                    >
                      {t('go_back_button')}
                    </button>
                    <button 
                      type="button" 
                      onClick={initiateCancellation} 
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg"
                    >
                      {t('confirm_cancellation_button')}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </>
    );
};

export default Subscription;
