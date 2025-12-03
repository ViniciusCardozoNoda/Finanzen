
import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useData } from '../context/DataContext';
import { SharedSpace } from '../types';

const SharedSpaces: React.FC = () => {
  const { t } = useLocalization();
  const { sharedSpaces, createSharedSpace } = useData();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [managingSpace, setManagingSpace] = useState<SharedSpace | null>(null);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    createSharedSpace(newSpaceName);
    setIsCreateModalOpen(false);
    setNewSpaceName('');
  };

  const handleOpenManageModal = (space: SharedSpace) => {
    setManagingSpace(space);
    setIsManageModalOpen(true);
  };
  
  const handleShare = (method: 'whatsapp' | 'telegram', space: SharedSpace) => {
    const link = `https://finanzen.app/join/${space.id}`;
    const text = encodeURIComponent(t('invitation_message', { spaceName: space.name, link: link }));
    
    let url = '';
    if (method === 'whatsapp') {
      url = `https://wa.me/?text=${text}`;
    } else if (method === 'telegram') {
      url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = (space: SharedSpace) => {
    const link = `https://finanzen.app/join/${space.id}`;
    navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('manage_shared_spaces')}</h1>
            <p className="text-slate-500 mt-1">{t('collaborate_on_finances')}</p>
          </div>
          <button onClick={() => setIsCreateModalOpen(true)} className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
            + {t('new_shared_space')}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">{t('your_spaces')}</h2>
          <div className="space-y-4">
            {sharedSpaces.map(space => (
              <div key={space.id} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800">{space.name}</h3>
                  <p className="text-sm text-slate-500">{space.memberIds.length} {t('members')}</p>
                </div>
                <button onClick={() => handleOpenManageModal(space)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg text-sm">
                  {t('manage')}
                </button>
              </div>
            ))}
            {sharedSpaces.length === 0 && (
              <p className="text-center text-slate-500 py-8">{t('no_spaces_found')}</p>
            )}
          </div>
        </div>
      </div>
      
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-slate-800">{t('create_new_space')}</h3>
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('space_name')}</label>
                <input
                  type="text"
                  placeholder={t('space_name_placeholder')}
                  value={newSpaceName}
                  onChange={e => setNewSpaceName(e.target.value)}
                  required
                  className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isManageModalOpen && managingSpace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg animate-fade-in">
            <h3 className="text-xl font-bold mb-2 text-slate-800">{t('manage')} '{managingSpace.name}'</h3>
            <p className="text-sm text-slate-500 mb-6">{managingSpace.memberIds.length} {t('members')}</p>
            
            <div className="border-t border-b border-slate-200 py-4">
                <h4 className="text-md font-semibold text-slate-700 mb-4">{t('invite_members_title')}</h4>
                <div className="space-y-3">
                    <button onClick={() => handleShare('whatsapp', managingSpace)} className="w-full flex items-center justify-center p-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors">
                        <i className="fab fa-whatsapp text-xl mr-3"></i> {t('invite_by_whatsapp')}
                    </button>
                    <button onClick={() => handleShare('telegram', managingSpace)} className="w-full flex items-center justify-center p-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors">
                        <i className="fab fa-telegram-plane text-xl mr-3"></i> {t('invite_by_telegram')}
                    </button>
                    <div className="flex">
                        <input type="email" placeholder="email@example.com" className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-l-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" />
                        <button type="button" className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-r-md">{t('invite')}</button>
                    </div>
                    <div className="relative">
                        <input type="text" readOnly value={`https://finanzen.app/join/${managingSpace.id}`} className="w-full bg-slate-100 border-slate-300 text-slate-700 p-3 rounded-md font-mono text-sm pr-24" />
                        <button onClick={() => handleCopyLink(managingSpace)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm bg-emerald-500 text-white font-semibold py-1 px-3 rounded">
                            {copied ? t('link_copied') : t('copy_link')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="button" onClick={() => setIsManageModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg">{t('go_back_button')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SharedSpaces;