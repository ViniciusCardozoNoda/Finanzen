import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types';
import { dbService } from '../services/dbService';
import { useLocalization } from './LocalizationContext';

// Helper to safely create a Date object from a string or another Date object
const safeCreateDate = (dateValue: any): Date | undefined => {
    if (!dateValue) return undefined;
    // Attempt to create a date
    const date = new Date(dateValue);
    // Check if the created date is valid. An invalid date's time is NaN.
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date value encountered in localStorage and was ignored: "${dateValue}"`);
        return undefined;
    }
    return date;
};

// LocalStorage is still useful for session management (keeping the user logged in)
const getCurrentUserFromStorage = (): User | null => {
  try {
    const item = window.localStorage.getItem('currentUser');
    if (!item) return null;
    const parsed = JSON.parse(item);
    // Robustly hydrate and validate dates
    if (parsed) {
        if (parsed.trialEndDate) parsed.trialEndDate = safeCreateDate(parsed.trialEndDate);
        if (parsed.cancellationDate) parsed.cancellationDate = safeCreateDate(parsed.cancellationDate);
    }
    return parsed;
  } catch (error) {
    console.warn(`Error reading currentUser from localStorage:`, error);
    return null;
  }
};

const setCurrentUserToStorage = (user: User | null) => {
  try {
    if (user === null) {
      window.localStorage.removeItem('currentUser');
    } else {
      window.localStorage.setItem('currentUser', JSON.stringify(user));
    }
  } catch (error) {
    console.error(`Error writing currentUser to localStorage:`, error);
  }
};

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  updateUser: (updatedUser: User) => Promise<void>;
  updateOtherUser: (updatedUser: User) => Promise<void>;
  register: (name: string, email: string, password?: string, autoLogin?: boolean) => Promise<{ success: boolean; messageKey: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; messageKey: string }>;
  changePassword: (userId: number, oldPassword: string, newPassword: string) => Promise<{ success: boolean; messageKey: string }>;
  createAdmin: (name: string, email: string, password: string) => Promise<{ success: boolean; messageKey: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(() => getCurrentUserFromStorage());
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLocalization();

  // Fetch initial data from IndexedDB
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const dbUsers = await dbService.getAll<User>(dbService.STORES.USERS);
        setUsers(dbUsers);
      } catch (error) {
        console.error("Failed to fetch users from DB", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);
  
  const updateUser = useCallback(async (updatedUser: User) => {
    // This function is for the current user to update their own data.
    // The call sites construct `updatedUser` from the existing `user` object,
    // so an ID check is redundant and was causing an unstable callback.
    await dbService.put<User>(dbService.STORES.USERS, updatedUser);
    setUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  }, []);
  
  // 24h grace period cancellation logic
  useEffect(() => {
    if (user && user.subscriptionStatus === 'cancellation_pending' && user.cancellationDate) {
        const now = new Date();
        const cancellationTime = new Date(user.cancellationDate).getTime();
        const gracePeriodEnd = cancellationTime + 24 * 60 * 60 * 1000;

        if (now.getTime() > gracePeriodEnd) {
            const updatedUser: User = {
                ...user,
                subscriptionStatus: 'none',
                trialEndDate: undefined,
                cancellationDate: undefined,
            };
            updateUser(updatedUser);
        }
    }
  }, [user, updateUser]);


  useEffect(() => {
    setCurrentUserToStorage(user);
  }, [user]);

  const login = useCallback((email: string, password?: string): boolean => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser) return false;

    // If password is provided, it's a form login. Check password.
    if (password) {
      if (foundUser.password === password) {
        setUser(foundUser);
        return true;
      }
      return false; // Wrong password
    }

    // If no password, it's a social login.
    // For this simulation, we assume if the user exists and no password is provided, it's valid.
    setUser(foundUser);
    return true;

  }, [users]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateOtherUser = useCallback(async (updatedUser: User) => {
    // This function is for admin use only and is protected by UI-level role checks.
    await dbService.put<User>(dbService.STORES.USERS, updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  }, []);
  
  const register = useCallback(async (name: string, email: string, password?: string, autoLogin = false): Promise<{ success: boolean; messageKey: string }> => {
    const normalizedEmail = email.toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (foundUser) {
        return { success: false, messageKey: 'user_already_exists' };
    }

    const trialEndDate = new Date();
    trialEndDate.setMonth(trialEndDate.getMonth() + 1);

    const newUser: User = {
        id: Date.now(),
        name,
        email: normalizedEmail,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
        role: 'user',
        subscriptionStatus: 'trial',
        trialEndDate: trialEndDate,
    };
    
    if (password) {
        newUser.password = password;
    }

    try {
        await dbService.add<User>(dbService.STORES.USERS, newUser);
        setUsers(prevUsers => [...prevUsers, newUser]);
        if (autoLogin) {
            setUser(newUser);
        }
        return { success: true, messageKey: 'registration_successful' };
    } catch (error) {
        console.error("Failed to register user:", error);
        return { success: false, messageKey: 'registration_failed' };
    }
  }, [users]);

  const resetPassword = useCallback(async (email: string, newPassword: string): Promise<{ success: boolean; messageKey: string }> => {
    const normalizedEmail = email.toLowerCase();
    const userToUpdate = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!userToUpdate) {
        return { success: false, messageKey: 'account_not_found' };
    }
    const updatedUser = { ...userToUpdate, password: newPassword };
    await dbService.put<User>(dbService.STORES.USERS, updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    return { success: true, messageKey: 'password_reset_success' };
  }, [users]);

  const changePassword = useCallback(async (userId: number, oldPassword: string, newPassword: string): Promise<{ success: boolean; messageKey: string }> => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) {
        return { success: false, messageKey: 'user_not_found' }; // Should not happen if user is logged in
    }
    if (userToUpdate.password !== oldPassword) {
        return { success: false, messageKey: 'incorrect_current_password' };
    }
    const updatedUser = { ...userToUpdate, password: newPassword };
    await dbService.put<User>(dbService.STORES.USERS, updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (user && user.id === userId) {
        setUser(updatedUser);
    }
    return { success: true, messageKey: 'password_changed_successfully' };
  }, [users, user]);

  const createAdmin = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; messageKey: string }> => {
    const normalizedEmail = email.toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (foundUser) {
        return { success: false, messageKey: 'user_already_exists' };
    }

    const newAdmin: User = {
        id: Date.now(),
        name,
        email: normalizedEmail,
        password: password,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
        role: 'admin',
        subscriptionStatus: 'active',
    };

    try {
        await dbService.add<User>(dbService.STORES.USERS, newAdmin);
        setUsers(prevUsers => [...prevUsers, newAdmin]);
        return { success: true, messageKey: 'admin_created_successfully' };
    } catch (error) {
        console.error("Failed to create admin:", error);
        return { success: false, messageKey: 'admin_creation_failed' };
    }
  }, [users]);

  if (isLoading) {
      return <div>{t('loading_application')}</div>; 
  }

  return (
    <AuthContext.Provider value={{ user, users, login, logout, updateUser, updateOtherUser, register, resetPassword, changePassword, createAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
