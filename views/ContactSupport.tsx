
import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import { View } from '../types';

interface ContactSupportProps {
  setCurrentView: (view: View) => void;
}

const ContactSupport: React.FC<ContactSupportProps> = ({ setCurrentView }) => {
  const { t } = useLocalization();
  const { addFeedbackItem } = useData();
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    addFeedbackItem(message);
    setMessage('');
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">{t('contact_support')}</h1>
        <p className="text-slate-500 mt-1 mb-6">Estamos aqui para ajudar. Envie sua dúvida, sugestão ou relate um problema.</p>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
            {isSubmitted ? (
                <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-green-500 rounded-full">
                            <i className="fas fa-check text-5xl text-white"></i>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">{t('feedback_sent_successfully')}</h2>
                    <button onClick={() => setCurrentView('dashboard')} className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">
                        {t('go_to_dashboard')}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="feedback-message" className="block text-sm font-medium text-slate-600 mb-1">{t('your_problem_or_suggestion')}</label>
                        <textarea
                            id="feedback-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            required
                            className="w-full bg-slate-50 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                        />
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                            {t('submit_feedback')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    </div>
  );
};

export default ContactSupport;
