import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { View } from '../../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  reminderCount: number;
}

const NavItem: React.FC<{
  icon: string;
  label: string;
  view: View;
  currentView: View;
  onClick: (view: View) => void;
  isExpanded: boolean;
  badgeCount?: number;
}> = ({ icon, label, view, currentView, onClick, isExpanded, badgeCount = 0 }) => (
  <li
    onClick={() => onClick(view)}
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 group relative ${
      currentView === view
        ? 'bg-emerald-50 text-emerald-600 font-semibold'
        : 'text-slate-500 hover:bg-slate-100'
    } ${!isExpanded ? 'justify-center' : ''}`}
  >
    <i className={`fas ${icon} w-6 text-center text-lg transition-colors ${currentView === view ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-500'}`}></i>
    <span 
      className={`overflow-hidden transition-all whitespace-nowrap duration-200 flex items-center ${
        isExpanded ? 'flex-1 ml-4' : 'w-0 opacity-0'
      }`}
    >
      {label}
      {badgeCount > 0 && isExpanded && (
        <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{badgeCount}</span>
      )}
    </span>
    {badgeCount > 0 && !isExpanded && (
      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
    )}
  </li>
);

const FullSidebarContent: React.FC<{
    isCurrentlyExpanded: boolean;
    onToggleExpand?: () => void;
    onNavigate: (view: View) => void;
    currentView: View;
    reminderCount: number;
}> = ({ isCurrentlyExpanded, onToggleExpand, onNavigate, currentView, reminderCount }) => {
    const { user, logout } = useAuth();
    const { t } = useLocalization();

    return (
        <nav className={`flex flex-col bg-white border-r border-slate-200 shadow-sm transition-all duration-300 h-full ${isCurrentlyExpanded ? 'w-64' : 'w-20'}`}>
            <div className={`flex items-center p-4 border-b border-slate-200 h-[65px] ${isCurrentlyExpanded ? 'justify-between' : 'justify-center'}`}>
                <div className={`flex items-center overflow-hidden transition-opacity whitespace-nowrap ${isCurrentlyExpanded ? 'opacity-100' : 'opacity-0 w-0 pointer-events-none'}`}>
                    <div className="bg-emerald-500 p-2 rounded-lg flex-shrink-0">
                        <i className="fas fa-chart-line text-white text-xl"></i>
                    </div>
                    <div className="ml-3">
                        <span className="font-bold text-lg text-slate-800">{t('app_title')}</span>
                        <p className="text-xs text-slate-500">{t('app_subtitle')}</p>
                    </div>
                </div>
                {onToggleExpand && (
                    <div className="flex-shrink-0">
                        <button onClick={onToggleExpand} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none hidden md:block">
                            <i className={`fas transition-transform duration-300 ${isCurrentlyExpanded ? 'fa-angle-left' : 'fa-angle-right'}`}></i>
                        </button>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <ul className="px-2 py-4">
                    <NavItem icon="fa-home" label={t('dashboard')} view="dashboard" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                    <NavItem icon="fa-brain" label={t('ai_manager')} view="ai-manager" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                    
                    {user?.role !== 'admin' && (
                        <>
                            <NavItem icon="fa-users" label={t('shared_spaces')} view="shared-spaces" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                            <NavItem icon="fa-wallet" label={t('accounts')} view="accounts" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                            <NavItem icon="fa-plus-circle" label={t('new_expense')} view="new-expense" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                            <NavItem icon="fa-chart-pie" label={t('income_management')} view="income-management" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                            <NavItem icon="fa-money-bill-wave" label={t('my_expenses')} view="my-expenses" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                            <NavItem icon="fa-calendar-alt" label={t('bills_to_pay')} view="bills" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} badgeCount={reminderCount} />
                            <NavItem icon="fa-calendar-day" label={t('installments')} view="installments" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                            <NavItem icon="fa-history" label={t('monthly_history')} view="monthly-history" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                            <NavItem icon="fa-chart-bar" label={t('reports')} view="reports" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                            <NavItem icon="fa-bullseye" label={t('goals')} view="goals" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                        </>
                    )}
                    
                    <NavItem icon="fa-gem" label={t('subscription')} view="subscription" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />

                    {user?.role === 'admin' && (
                        <NavItem icon="fa-user-shield" label={t('admin_panel')} view="admin" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                    )}
                </ul>
                
                 {user?.role !== 'admin' && (
                    <>
                        <div className="px-4 mt-4 mb-2">
                           <hr className="border-slate-200" />
                        </div>
                        <ul className="px-2">
                           <NavItem icon="fa-question-circle" label={t('contact_support')} view="contact-support" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                        </ul>

                        <div 
                        className={`overflow-hidden transition-all duration-300 ${isCurrentlyExpanded ? 'h-auto px-4 mt-4 mb-2 opacity-100' : 'h-0 p-0 m-0 opacity-0 pointer-events-none'}`}
                        >
                            <h3 className="text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">{t('tools')}</h3>
                        </div>
                        <ul className="px-2">
                            <NavItem icon="fa-calculator" label={t('mei_calculator')} view="mei-calculator" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                            <NavItem icon="fa-file-import" label={t('import_statement')} view="import-csv" currentView={currentView} onClick={onNavigate} isExpanded={isCurrentlyExpanded} />
                        </ul>
                    </>
                 )}
            </div>

            <div className="p-2 border-t border-slate-200">
              <ul className="px-0">
                  <li 
                      onClick={() => onNavigate('profile')}
                      className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-100 ${!isCurrentlyExpanded ? 'justify-center' : ''}`}
                  >
                      <img src={user?.avatar} alt="User Avatar" className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div 
                          className={`overflow-hidden transition-all whitespace-nowrap duration-200 ${isCurrentlyExpanded ? 'flex-1 ml-3' : 'w-0 opacity-0'}`}
                      >
                          <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                          <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                  </li>
                  <li
                      onClick={logout}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 group relative text-slate-500 hover:bg-red-50 hover:text-red-600 ${!isCurrentlyExpanded ? 'justify-center' : ''}`}
                  >
                      <i className={`fas fa-sign-out-alt w-6 text-center text-lg text-slate-400 group-hover:text-red-600`}></i>
                      <span className={`overflow-hidden transition-all whitespace-nowrap duration-200 ${isCurrentlyExpanded ? 'flex-1 ml-4' : 'w-0 opacity-0'}`}>
                        {t('logout')}
                      </span>
                  </li>
              </ul>
              {isCurrentlyExpanded && (
                  <div className="text-center text-xs text-slate-300 mt-2">
                      v1.2.0 (Verified)
                  </div>
              )}
            </div>
        </nav>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isExpanded, setIsExpanded, isMobileOpen, setIsMobileOpen, reminderCount }) => {

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    setIsMobileOpen(false); // Always close mobile menu on navigation
  };

  return (
    <>
      {/* Mobile Sidebar Flyout */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsMobileOpen(false)}
      ></div>
      <div className={`fixed top-0 left-0 h-full z-40 md:hidden transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <FullSidebarContent
          isCurrentlyExpanded={true} // Mobile flyout is always fully expanded
          onNavigate={handleNavigation}
          currentView={currentView}
          reminderCount={reminderCount}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block flex-shrink-0">
        <FullSidebarContent
          isCurrentlyExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
          onNavigate={handleNavigation}
          currentView={currentView}
          reminderCount={reminderCount}
        />
      </div>
    </>
  );
};

export default Sidebar;