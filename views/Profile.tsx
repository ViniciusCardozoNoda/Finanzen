
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { User } from '../types';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLocalization();
  
  const [profileData, setProfileData] = useState<User | null>(user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedGoals, setEditedGoals] = useState('');


  useEffect(() => {
    setProfileData(user);
    if(user) {
        setNewAvatarUrl(user.avatar);
    }
  }, [user]);

  if (!profileData) {
    return <div>{t('loading_profile')}</div>;
  }

  const handleOpenModal = () => {
    setNewAvatarUrl(profileData.avatar);
    setIsModalOpen(true);
  };

  const handleUpdatePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if(profileData) {
        updateUser({ ...profileData, avatar: newAvatarUrl });
    }
    setIsModalOpen(false);
  };
  
  const handleEdit = () => {
    setEditedName(profileData.name || '');
    setEditedBio(profileData.bio || '');
    setEditedGoals(profileData.goals || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    if (profileData) {
      updateUser({
        ...profileData,
        name: editedName,
        bio: editedBio,
        goals: editedGoals,
      });
      setIsEditing(false);
      alert(t('profile_updated_successfully'));
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800">{t('profile')}</h1>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 max-w-4xl mx-auto relative">
        <div className="absolute top-6 right-6">
            {!isEditing && (
                 <button onClick={handleEdit} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg text-sm">
                    <i className="fas fa-pencil-alt mr-2"></i>
                    {t('edit_profile')}
                </button>
            )}
        </div>
        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8">
            <div className="flex flex-col items-center">
                <img src={profileData.avatar} alt="User Avatar" className="w-32 h-32 rounded-full mb-4 shadow-md border-4 border-slate-200" />
                 <button onClick={handleOpenModal} type="button" className="text-sm bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg">
                    {t('change_photo')}
                </button>
            </div>
            <div className="mt-6 md:mt-0 text-center md:text-left flex-1">
                {isEditing ? (
                     <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">{t('full_name')}</label>
                            <input
                                id="name"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="w-full bg-slate-50 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                            />
                        </div>
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-slate-600 mb-1">{t('bio')}</label>
                            <textarea
                                id="bio"
                                value={editedBio}
                                onChange={(e) => setEditedBio(e.target.value)}
                                placeholder={t('bio_placeholder')}
                                className="w-full bg-slate-50 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                                rows={3}
                            />
                        </div>
                         <div>
                            <label htmlFor="goals" className="block text-sm font-medium text-slate-600 mb-1">{t('financial_goals')}</label>
                            <textarea
                                id="goals"
                                value={editedGoals}
                                onChange={(e) => setEditedGoals(e.target.value)}
                                placeholder={t('goals_placeholder')}
                                className="w-full bg-slate-50 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button onClick={handleCancel} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                            <button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('save_changes')}</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold text-slate-800">{profileData.name}</h2>
                        <p className="text-slate-500 mt-1">{profileData.email}</p>
                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-600">{t('bio')}</h4>
                                <p className="text-slate-800 mt-1">{profileData.bio || t('not_defined')}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-600">{t('financial_goals')}</h4>
                                <p className="text-slate-800 mt-1">{profileData.goals || t('not_defined')}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-bold mb-4 text-slate-800">{t('change_photo')}</h3>
            <p className="text-slate-600 mb-6">{t('change_photo_desc')}</p>
            <form onSubmit={handleUpdatePhoto}>
                <div className="flex justify-center mb-6">
                    <img 
                        src={newAvatarUrl} 
                        alt="Avatar Preview" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-slate-200 shadow-md"
                        onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=?&background=slate&color=fff&size=128`;
                        }}
                    />
                </div>
              <div className="mb-4">
                <label htmlFor="imageUrl" className="block text-sm font-medium text-slate-600 mb-1">{t('image_url')}</label>
                <input 
                  type="url" 
                  id="imageUrl"
                  value={newAvatarUrl}
                  onChange={(e) => setNewAvatarUrl(e.target.value)}
                  required 
                  className="w-full bg-slate-100 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border" 
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4 mt-6 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg">{t('update_photo')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
