
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import AdminReports from './AdminReports';

type AdminTab = 'dashboard' | 'reports';

const StatCard: React.FC<{ title: string; value: string | number; icon: string; }> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600">
      <i className={`fas ${icon} text-xl`}></i>
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
    const { t } = useLocalization();
    const { users } = useAuth();
    const { feedbackItems, updateFeedbackStatus, addBroadcastMessage } = useData();
    const [broadcastContent, setBroadcastContent] = useState('');
    const [messageSent, setMessageSent] = useState(false);
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    const activeSubscriptions = users.filter(u => u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trial').length;

    const handleUpdateStatus = (id: number, status: 'new' | 'resolved') => {
        updateFeedbackStatus(id, status);
    };

    const handleSendBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastContent.trim()) return;
        addBroadcastMessage(broadcastContent);
        setBroadcastContent('');
        setMessageSent(true);
        setTimeout(() => setMessageSent(false), 3000);
    };
    
    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-slate-800">{t('admin_dashboard')}</h1>

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-6">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        {t('dashboard')}
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reports' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        {t('reports')}
                    </button>
                </nav>
            </div>
            
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title={t('total_users')} value={users.length} icon="fa-users" />
                        <StatCard title={t('active_subscriptions')} value={activeSubscriptions} icon="fa-gem" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-700 mb-4">{t('user_feedback_inbox')}</h2>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {feedbackItems.map(item => (
                                    <div key={item.id} className="p-4 border border-slate-200 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-slate-800">{item.userName} <span className="text-xs text-slate-500 font-normal">({item.userEmail})</span></p>
                                                <p className="text-sm text-slate-600 mt-2">{item.message}</p>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === 'new' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                {t(item.status)}
                                            </span>
                                        </div>
                                        <div className="text-right mt-3">
                                            {item.status === 'new' && (
                                                <button onClick={() => handleUpdateStatus(item.id, 'resolved')} className="text-sm bg-emerald-100 text-emerald-700 font-semibold py-1 px-3 rounded-lg hover:bg-emerald-200">
                                                    {t('mark_as_resolved')}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2 text-right">{new Date(item.timestamp).toLocaleString()}</p>
                                    </div>
                                ))}
                                {feedbackItems.length === 0 && <p className="text-center text-slate-500 py-8">Nenhum feedback recebido.</p>}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-700 mb-4">{t('broadcast_message_to_all')}</h2>
                            <form onSubmit={handleSendBroadcast} className="space-y-4">
                                <textarea
                                    value={broadcastContent}
                                    onChange={(e) => setBroadcastContent(e.target.value)}
                                    rows={5}
                                    placeholder="Digite sua mensagem aqui..."
                                    className="w-full bg-slate-50 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                                    required
                                />
                                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">
                                    {t('send_broadcast')}
                                </button>
                                {messageSent && <p className="text-green-600 text-sm text-center font-semibold">{t('message_sent')}</p>}
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && <AdminReports />}
        </div>
    );
};

export default AdminDashboard;
