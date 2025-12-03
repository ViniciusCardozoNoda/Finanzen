
import React from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import { View } from '../../types';
import { useData } from '../../context/DataContext';

interface HeaderProps {
    toggleMobileSidebar: () => void;
    currentView: View;
    reminderCount: number;
}

const Header: React.FC<HeaderProps> = ({ toggleMobileSidebar, currentView, reminderCount }) => {
    const { t } = useLocalization();
    const { sharedSpaces, currentSpaceId, setCurrentSpaceId } = useData();

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const getTitle = (view: View) => {
        const formattedView = view.replace(/-/g, ' ');
        const translatedTitle = t(view.replace(/-/g, '_'));
        
        if (translatedTitle === view.replace(/-/g, '_')) {
            return formattedView.split(' ').map(capitalize).join(' ');
        }
        return translatedTitle;
    }

    const handleSpaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setCurrentSpaceId(value === 'personal' ? null : parseInt(value, 10));
    };
    
    const currentSpaceName = currentSpaceId === null 
        ? t('personal_space') 
        : sharedSpaces.find(s => s.id === currentSpaceId)?.name || '';

    return (
        <header className="relative flex items-center justify-between p-4 h-[65px] bg-white border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center">
                <button onClick={toggleMobileSidebar} className="text-slate-500 p-2 rounded-md hover:bg-slate-100 md:hidden">
                    <i className="fas fa-bars text-xl"></i>
                </button>
                <div className="hidden md:flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-slate-800">{getTitle(currentView)}</h1>
                     <div className="relative">
                        <select 
                            value={currentSpaceId === null ? 'personal' : currentSpaceId}
                            onChange={handleSpaceChange}
                            className="appearance-none bg-slate-100 border border-slate-300 text-slate-700 font-semibold py-1.5 pl-4 pr-8 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="personal">{t('personal_space')}</option>
                            {sharedSpaces.map(space => (
                                <option key={space.id} value={space.id}>{space.name}</option>
                            ))}
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none"></i>
                    </div>
                </div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
                 <h1 className="text-lg font-bold text-slate-800">{getTitle(currentView)}</h1>
            </div>

            <div className="flex items-center space-x-5">
                 <button className="relative text-slate-500 p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <i className="fas fa-bell text-xl"></i>
                    {reminderCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                </button>
            </div>
        </header>
    );
};

export default Header;
