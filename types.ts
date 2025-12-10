
export type UserRole = 'user' | 'admin';

export type SubscriptionStatus = 'none' | 'trial' | 'active' | 'expired' | 'cancellation_pending';

export type View = 
  'dashboard' | 
  'accounts' | 
  'new-expense' | 
  'income-management' |
  'my-expenses' |
  'installments' |
  'monthly-history' |
  'reports' |
  'goals' |
  'mei-calculator' |
  'import-csv' |
  'bills' |
  'admin' |
  'profile' |
  'subscription' |
  'ai-manager' |
  'payment' |
  'shared-spaces' |
  'contact-support';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  role: UserRole;
  bio?: string;
  goals?: string;
  subscriptionStatus?: SubscriptionStatus;
  trialEndDate?: Date;
  cancellationDate?: Date;
}

export interface SharedSpace {
    id: number;
    name: string;
    memberIds: number[];
}

export interface Account {
  id: number;
  userId: number;
  name: string;
  description: string;
  balance: number;
  sharedSpaceId?: number | null;
}

export type ExpenseType = 'unique' | 'fixed' | 'installment';

export interface Transaction {
  id: number;
  userId: number;
  accountId: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date; // Was string; changed for consistency and robustness
  paymentMethod: string;
  expenseType?: ExpenseType;
  installments?: {
    current: number;
    total: number;
  };
  recurrenceId?: number; // Links generated transactions to a 'fixed' template
  sharedSpaceId?: number | null;
}

export interface Message {
  sender: 'user' | 'ai' | 'system';
  text: string;
}

export interface Bill {
  id: number;
  userId: number;
  name: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  isRecurring: boolean;
  recurrence?: 'monthly' | 'yearly';
  recurrenceId?: number;
  sharedSpaceId?: number | null;
}

export interface PaymentSettings {
    pixKey: string;
    bankName: string;
    agency: string;
    accountNumber: string;
    accountHolderName: string;
}

export interface FeedbackItem {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  message: string;
  timestamp: Date;
  status: 'new' | 'resolved';
}

export interface BroadcastMessage {
  id: number;
  content: string;
  timestamp: Date;
}

export interface FeatureUsageStats {
  name: string;
  clicks: number;
}

export interface Goal {
  id: number;
  userId: number;
  category: string;
  limit: number;
  month: number; 
  year: number;
}
