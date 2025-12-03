
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocalizationProvider, useLocalization } from './context/LocalizationContext';
import { DataProvider, useData } from './context/DataContext';

import Login from './views/Login';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './views/Dashboard';
import Accounts from './views/Accounts';
import NewExpense from './views/NewExpense';
import IncomeManagement from './views/IncomeManagement';
import MyExpenses from './views/MyExpenses';
import Installments from './views/Installments';
import MonthlyHistory from './views/MonthlyHistory';
import Reports from './views/Reports';
import Goals from './views/Goals';
import MeiCalculator from './views/MeiCalculator';
import ImportCsv from './views/ImportCsv';
import Bills from './views/Bills';
import AdminPanel from './views/AdminPanel';
import Profile from './views/Profile';
import Subscription from './views/Subscription';
import AIChatWidget from './components/AIChat/AIChatWidget';
import AIManager from './views/AIManager';
import Payment from './views/Payment';
import Toast from './components/layout/Toast';
import SharedSpaces from './views/SharedSpaces';
import AdminDashboard from './views/AdminDashboard'; // New Admin Dashboard
import ContactSupport from './views/ContactSupport'; // New Contact Support View
import BroadcastBanner from './components/layout/BroadcastBanner';
import { logFeatureClick } from './services/analyticsService';
import { SubscriptionStatus, View } from './types';


const App: React.FC = () => {
  return (
    <LocalizationProvider>
      <AuthProvider>
        <DataProvider>
          <Main />
        </DataProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
};

const Main: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { billReminderCount, upcomingAndOverdueBills, latestBroadcast } = useData();
  const { t } = useLocalization();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(window.innerWidth >= 1024);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'warning'} | null>(null);


  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Log feature usage for analytics
  useEffect(() => {
    logFeatureClick(currentView);
  }, [currentView]);

  // Check for expired trials on app load/user change
  useEffect(() => {
    if (user && user.subscriptionStatus === 'trial' && user.trialEndDate) {
        // Robustness: Ensure trialEndDate is a valid date before using it.
        if (isNaN(user.trialEndDate.getTime())) {
            console.warn("Invalid trialEndDate found for user, skipping expiration check:", user);
            return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const trialEnd = new Date(user.trialEndDate);
        trialEnd.setHours(0, 0, 0, 0);

        if (today > trialEnd) {
            updateUser({ ...user, subscriptionStatus: 'expired' });
        }
    }
  }, [user, updateUser]);


  useEffect(() => {
    if (upcomingAndOverdueBills.length > 0) {
      const nextBill = upcomingAndOverdueBills[0]; // The list is sorted by due date
      
      // Robustness: Validate the date before using methods that can throw errors like .toISOString()
      if (!nextBill.dueDate || isNaN(nextBill.dueDate.getTime())) {
          console.warn("Skipping bill reminder toast due to invalid due date on bill:", nextBill);
          return; // Prevents the app from crashing if a bill has a corrupted date
      }

      const today = new Date();
      today.setHours(0,0,0,0);
      const dueDate = new Date(nextBill.dueDate);
      dueDate.setHours(0,0,0,0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let message = '';
      if (diffDays < 0) {
        message = `${t('overdue')}! "${nextBill.name}"`;
      } else if (diffDays === 0) {
        message = `"${nextBill.name}" ${t('due_today')}!`;
      } else {
        message = `"${nextBill.name}" ${t('due_in_days', { days: diffDays })}`;
      }
      
      try {
        // Show toast once per session for a specific bill on a specific day
        const toastShownKey = `bill_toast_${nextBill.id}_${nextBill.dueDate.toISOString().split('T')[0]}`;
        if (!sessionStorage.getItem(toastShownKey)) {
          setToast({ message, type: 'warning' });
          sessionStorage.setItem(toastShownKey, 'true');
        }
      } catch (error) {
        console.warn("Session storage is not available. Bill reminder toast may show more than once per session.", error);
        // Fallback: Still show the toast, but we can't save its state.
        // The component's state (`toast`) will prevent it from re-showing on every render.
        setToast({ message, type: 'warning' });
      }
    }
  }, [upcomingAndOverdueBills, t]);


  if (!user) {
    return <Login />;
  }
  
  const handleNavigation = (view: View) => {
    setCurrentView(view);
  }
  
  const renderView = () => {
    // Admins see a different dashboard
    if (user.role === 'admin' && currentView === 'dashboard') {
      return <AdminDashboard />;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard setCurrentView={handleNavigation} />;
      case 'accounts': return <Accounts />;
      case 'new-expense': return <NewExpense setCurrentView={handleNavigation} />;
      case 'income-management': return <IncomeManagement />;
      case 'my-expenses': return <MyExpenses />;
      case 'installments': return <Installments />;
      case 'monthly-history': return <MonthlyHistory />;
      case 'reports': return <Reports />;
      case 'goals': return <Goals />;
      case 'mei-calculator': return <MeiCalculator />;
      case 'import-csv': return <ImportCsv />;
      case 'bills': return <Bills />;
      case 'admin': return <AdminPanel />;
      case 'profile': return <Profile />;
      case 'subscription': return <Subscription setCurrentView={handleNavigation} />;
      case 'ai-manager': return <AIManager setCurrentView={handleNavigation} />;
      case 'payment': return <Payment setCurrentView={handleNavigation} />;
      case 'shared-spaces': return <SharedSpaces />;
      case 'contact-support': return <ContactSupport setCurrentView={handleNavigation} />;
      default:
        return <Dashboard setCurrentView={handleNavigation} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={handleNavigation} 
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        reminderCount={billReminderCount}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {user.role !== 'admin' && latestBroadcast && <BroadcastBanner message={latestBroadcast} />}
        <Header 
          toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          currentView={currentView}
          reminderCount={billReminderCount}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
      <AIChatWidget />
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default App;
