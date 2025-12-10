import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Transaction, Account, Bill, SharedSpace, FeedbackItem, BroadcastMessage, Goal } from '../types';
import { dbService } from '../services/dbService';
import { useLocalization } from './LocalizationContext';
import { useAuth } from './AuthContext';

interface DataContextType {
  transactions: Transaction[];
  allTransactions: Transaction[];
  accounts: Account[];
  bills: Bill[];
  goals: Goal[];
  sharedSpaces: SharedSpace[];
  feedbackItems: FeedbackItem[];
  latestBroadcast: BroadcastMessage | null;
  currentSpaceId: number | null;
  setCurrentSpaceId: (spaceId: number | null) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (transactionId: number) => Promise<void>;
  addBill: (bill: Omit<Bill, 'id' | 'isPaid'>) => Promise<void>;
  updateBill: (bill: Bill) => Promise<void>;
  updateBillStatus: (billId: number, isPaid: boolean) => Promise<void>;
  addAccount: (account: Omit<Account, 'id' | 'balance'>) => Promise<void>;
  deleteAccount: (accountId: number) => Promise<void>;
  createSharedSpace: (name: string) => Promise<void>;
  addFeedbackItem: (message: string) => Promise<void>;
  updateFeedbackStatus: (feedbackId: number, status: 'new' | 'resolved') => Promise<void>;
  addBroadcastMessage: (content: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  deleteGoal: (goalId: number) => Promise<void>;
  upcomingAndOverdueBills: Bill[];
  billReminderCount: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [sharedSpaces, setSharedSpaces] = useState<SharedSpace[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [broadcastMessages, setBroadcastMessages] = useState<BroadcastMessage[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [currentSpaceId, setCurrentSpaceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLocalization();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [dbTransactions, dbAccounts, dbBills, dbSharedSpaces, dbFeedback, dbBroadcasts, dbGoals] = await Promise.all([
            dbService.getAll<Transaction>(dbService.STORES.TRANSACTIONS),
            dbService.getAll<Account>(dbService.STORES.ACCOUNTS),
            dbService.getAll<Bill>(dbService.STORES.BILLS),
            dbService.getAll<SharedSpace>(dbService.STORES.SHARED_SPACES),
            dbService.getAll<FeedbackItem>(dbService.STORES.FEEDBACK_ITEMS),
            dbService.getAll<BroadcastMessage>(dbService.STORES.BROADCAST_MESSAGES),
            dbService.getAll<Goal>(dbService.STORES.GOALS),
        ]);
        
        setAllTransactions(dbTransactions);
        setAllAccounts(dbAccounts);
        setAllBills(dbBills);
        setFeedbackItems(dbFeedback.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setBroadcastMessages(dbBroadcasts);
        setAllGoals(dbGoals);
        
        const userSpaces = dbSharedSpaces.filter(space => space.memberIds.includes(user.id));
        setSharedSpaces(userSpaces);

      } catch (error) {
        console.error("Failed to load data from DB", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    if (user.role === 'admin' && currentSpaceId === null) {
      setAccounts(allAccounts);
      setTransactions(allTransactions);
      setBills(allBills);
      setGoals(allGoals);
      return;
    }

    if (currentSpaceId === null) {
      setAccounts(allAccounts.filter(acc => acc.userId === user.id && !acc.sharedSpaceId));
      setTransactions(allTransactions.filter(tx => tx.userId === user.id && !tx.sharedSpaceId));
      setBills(allBills.filter(bill => bill.userId === user.id && !bill.sharedSpaceId));
      setGoals(allGoals.filter(goal => goal.userId === user.id));
    } else {
      const space = sharedSpaces.find(s => s.id === currentSpaceId);
      if (space && space.memberIds.includes(user.id)) {
        setAccounts(allAccounts.filter(acc => acc.sharedSpaceId === currentSpaceId));
        setTransactions(allTransactions.filter(tx => tx.sharedSpaceId === currentSpaceId));
        setBills(allBills.filter(bill => bill.sharedSpaceId === currentSpaceId));
        setGoals([]); // Goals are currently personal only
      } else {
        setAccounts([]); setTransactions([]); setBills([]); setGoals([]);
      }
    }
  }, [currentSpaceId, allTransactions, allAccounts, allBills, allGoals, user, sharedSpaces]);
  
  const upcomingAndOverdueBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    return bills
        .filter(bill => !bill.isPaid)
        .filter(bill => {
            const dueDate = new Date(bill.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate <= threeDaysFromNow;
        })
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [bills]);

  const billReminderCount = useMemo(() => upcomingAndOverdueBills.length, [upcomingAndOverdueBills]);
  
  const latestBroadcast = useMemo(() => {
      if(broadcastMessages.length === 0) return null;
      return [...broadcastMessages].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }, [broadcastMessages]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) throw new Error("User not authenticated");
    const newTransaction: Transaction = { ...transaction, id: Date.now(), sharedSpaceId: currentSpaceId };
    await dbService.add(dbService.STORES.TRANSACTIONS, newTransaction);
    setAllTransactions(prev => [newTransaction, ...prev]);
  }, [user, currentSpaceId]);

  const deleteTransaction = useCallback(async (transactionId: number) => {
      await dbService.delete(dbService.STORES.TRANSACTIONS, transactionId);
      setAllTransactions(prev => prev.filter(t => t.id !== transactionId));
  }, []);

  const addBill = useCallback(async (bill: Omit<Bill, 'id' | 'isPaid'>) => {
    if (!user) throw new Error("User not authenticated");
    const newBill: Bill = { ...bill, id: Date.now(), isPaid: false, sharedSpaceId: currentSpaceId };
    await dbService.add(dbService.STORES.BILLS, newBill);
    setAllBills(prev => [...prev, newBill]);
  }, [user, currentSpaceId]);

  const updateBill = useCallback(async (updatedBill: Bill) => {
    if (!user) throw new Error("User not authenticated");
    await dbService.put(dbService.STORES.BILLS, updatedBill);
    setAllBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
  }, [user]);

  const updateBillStatus = useCallback(async (billId: number, isPaid: boolean) => {
    const billToUpdate = allBills.find(b => b.id === billId);
    if (!billToUpdate) throw new Error(`Bill with ID ${billId} not found.`);
    const updatedBill = { ...billToUpdate, isPaid };
    await updateBill(updatedBill);
  }, [allBills, updateBill]);

  const addAccount = useCallback(async (account: Omit<Account, 'id' | 'balance'>) => {
    if (!user) throw new Error("User not authenticated");
    const newAccount: Account = {
        ...account,
        id: Date.now(),
        balance: 0,
        sharedSpaceId: currentSpaceId,
    };
    await dbService.add(dbService.STORES.ACCOUNTS, newAccount);
    setAllAccounts(prev => [...prev, newAccount]);
  }, [user, currentSpaceId]);

  const deleteAccount = useCallback(async (accountId: number) => {
    const hasTransactions = allTransactions.some(tx => tx.accountId === accountId);
    if (hasTransactions) {
      throw new Error(t('account_has_transactions_alert'));
    }
    await dbService.delete(dbService.STORES.ACCOUNTS, accountId);
    setAllAccounts(prev => prev.filter(acc => acc.id !== accountId));
  }, [allTransactions, t]);
  
  const createSharedSpace = useCallback(async (name: string) => {
    if (!user) throw new Error("User not authenticated");
    const newSpace: SharedSpace = {
        id: Date.now(),
        name,
        memberIds: [user.id],
    };
    await dbService.add(dbService.STORES.SHARED_SPACES, newSpace);
    setSharedSpaces(prev => [...prev, newSpace]);
  }, [user]);

  const addFeedbackItem = useCallback(async (message: string) => {
    if (!user) throw new Error("User not authenticated");
    const newItem: FeedbackItem = {
      id: Date.now(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      message,
      timestamp: new Date(),
      status: 'new',
    };
    await dbService.add(dbService.STORES.FEEDBACK_ITEMS, newItem);
    setFeedbackItems(prev => [newItem, ...prev]);
  }, [user]);

  const updateFeedbackStatus = useCallback(async (feedbackId: number, status: 'new' | 'resolved') => {
    const item = feedbackItems.find(f => f.id === feedbackId);
    if (item) {
      const updatedItem = { ...item, status };
      await dbService.put(dbService.STORES.FEEDBACK_ITEMS, updatedItem);
      setFeedbackItems(prev => prev.map(f => f.id === feedbackId ? updatedItem : f));
    }
  }, [feedbackItems]);

  const addBroadcastMessage = useCallback(async (content: string) => {
    const newItem: BroadcastMessage = {
      id: Date.now(),
      content,
      timestamp: new Date(),
    };
    await dbService.add(dbService.STORES.BROADCAST_MESSAGES, newItem);
    setBroadcastMessages(prev => [newItem, ...prev]);
  }, []);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id'>) => {
      if (!user) throw new Error("User not authenticated");
      const newGoal: Goal = { ...goal, id: Date.now() };
      await dbService.add(dbService.STORES.GOALS, newGoal);
      setAllGoals(prev => [...prev, newGoal]);
  }, [user]);

  const deleteGoal = useCallback(async (goalId: number) => {
      await dbService.delete(dbService.STORES.GOALS, goalId);
      setAllGoals(prev => prev.filter(g => g.id !== goalId));
  }, []);
  
  if (isLoading) {
      return <div>{t('loading_data')}</div>;
  }

  return (
    <DataContext.Provider value={{ 
        transactions, allTransactions, accounts, bills, goals, sharedSpaces, feedbackItems, latestBroadcast, currentSpaceId, setCurrentSpaceId,
        addTransaction, deleteTransaction, addBill, updateBill, updateBillStatus, addAccount, deleteAccount, 
        createSharedSpace, addFeedbackItem, updateFeedbackStatus, addBroadcastMessage, addGoal, deleteGoal,
        upcomingAndOverdueBills, billReminderCount 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};