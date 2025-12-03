
import { MOCK_USERS, MOCK_ACCOUNTS, MOCK_TRANSACTIONS, MOCK_BILLS, MOCK_SHARED_SPACES, MOCK_FEEDBACK_ITEMS } from '../constants';
import { User, Account, Transaction, Bill, SharedSpace, FeedbackItem, BroadcastMessage } from '../types';

const DB_NAME = 'FinanZenDB';
const DB_VERSION = 8; // Increment version for schema changes

const STORES = {
  USERS: 'users',
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  BILLS: 'bills',
  SETTINGS: 'settings',
  SHARED_SPACES: 'sharedSpaces',
  FEEDBACK_ITEMS: 'feedbackItems',
  BROADCAST_MESSAGES: 'broadcastMessages',
};

let db: IDBDatabase;
let dbPromise: Promise<IDBDatabase> | null = null; // Handles concurrent init calls

// Helper to safely create a Date object from a string or another Date object
const safeCreateDate = (dateValue: any): Date | undefined => {
    if (!dateValue) return undefined;
    // Attempt to create a date
    const date = new Date(dateValue);
    // Check if the created date is valid. An invalid date's time is NaN.
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date value encountered in DB and was ignored: "${dateValue}"`);
        return undefined;
    }
    return date;
};

const prepareForDb = (obj: any): any => {
    // A robust way to deep-clone and convert Dates to ISO strings.
    // JSON.stringify handles nested objects and arrays, and strips 'undefined' properties.
    return JSON.parse(JSON.stringify(obj));
};

const initDB = (): Promise<IDBDatabase> => {
  if (db) {
    return Promise.resolve(db);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', request.error);
      dbPromise = null;
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      db = request.result;
      dbPromise = null;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction;
      if (!transaction) {
        console.error("Upgrade transaction is null, cannot proceed.");
        return;
      }
      const oldVersion = event.oldVersion;

      console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);

      // Version-based migration ensures that upgrades are applied sequentially and correctly.
      if (oldVersion < 1) {
        // Version 1: Initial schema with core features and mock data for new users.
        if (!db.objectStoreNames.contains(STORES.USERS)) {
            const usersStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
            MOCK_USERS.forEach(user => usersStore.add(prepareForDb(user)));
        }

        if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
            const accountsStore = db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'id' });
            accountsStore.createIndex('by_userId', 'userId');
            MOCK_ACCOUNTS.forEach(account => accountsStore.add(prepareForDb(account)));
        }

        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
            const transactionsStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
            transactionsStore.createIndex('by_userId', 'userId');
            MOCK_TRANSACTIONS.forEach(tx => transactionsStore.add(prepareForDb(tx)));
        }

        if (!db.objectStoreNames.contains(STORES.BILLS)) {
            const billsStore = db.createObjectStore(STORES.BILLS, { keyPath: 'id' });
            billsStore.createIndex('by_userId', 'userId');
            MOCK_BILLS.forEach(bill => billsStore.add(prepareForDb(bill)));
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
            db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      }

      if (oldVersion < 2) {
        // Version 2: Add shared spaces feature.
        if (!db.objectStoreNames.contains(STORES.SHARED_SPACES)) {
            const sharedSpacesStore = db.createObjectStore(STORES.SHARED_SPACES, { keyPath: 'id' });
            MOCK_SHARED_SPACES.forEach(space => sharedSpacesStore.add(prepareForDb(space)));
        }
        
        // Add indexes to existing stores to support shared spaces.
        const accountsStore = transaction.objectStore(STORES.ACCOUNTS);
        if (!accountsStore.indexNames.contains('by_sharedSpaceId')) {
            accountsStore.createIndex('by_sharedSpaceId', 'sharedSpaceId', { unique: false });
        }
        const transactionsStore = transaction.objectStore(STORES.TRANSACTIONS);
         if (!transactionsStore.indexNames.contains('by_sharedSpaceId')) {
            transactionsStore.createIndex('by_sharedSpaceId', 'sharedSpaceId', { unique: false });
        }
        const billsStore = transaction.objectStore(STORES.BILLS);
        if (!billsStore.indexNames.contains('by_sharedSpaceId')) {
            billsStore.createIndex('by_sharedSpaceId', 'sharedSpaceId', { unique: false });
        }
      }

      if (oldVersion < 3) {
        // Version 3: Add feedback items for admin panel.
        if (!db.objectStoreNames.contains(STORES.FEEDBACK_ITEMS)) {
            const feedbackStore = db.createObjectStore(STORES.FEEDBACK_ITEMS, { keyPath: 'id' });
            feedbackStore.createIndex('by_status', 'status');
            MOCK_FEEDBACK_ITEMS.forEach(item => feedbackStore.add(prepareForDb(item)));
        }
      }

      if (oldVersion < 4) {
        // Version 4: Add broadcast messages feature.
        if (!db.objectStoreNames.contains(STORES.BROADCAST_MESSAGES)) {
            db.createObjectStore(STORES.BROADCAST_MESSAGES, { keyPath: 'id' });
        }
      }

      // Subsequent versions (5, 6, 7, 8) can be added here if more schema changes are needed.
    };
  });

  return dbPromise;
};

const performDbOperation = async <T>(storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await initDB();
  const transaction = db.transaction(storeName, mode);
  const store = transaction.objectStore(storeName);
  const request = operation(store);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
};


const hydrateRecord = (record: any, storeName: string): any | null => {
    if (!record) return null;
    
    // Deep clone the record to prevent any potential reference issues with read-only DB objects.
    // This is a robust way to ensure we are always working with a clean, mutable copy.
    const hydrated = JSON.parse(JSON.stringify(record));

    // Central validation logic
    const isInvalidNumber = (value: any) => typeof value !== 'number' || isNaN(value);

    switch (storeName) {
        case STORES.USERS:
            if (hydrated.trialEndDate) hydrated.trialEndDate = safeCreateDate(hydrated.trialEndDate);
            if (hydrated.cancellationDate) hydrated.cancellationDate = safeCreateDate(hydrated.cancellationDate);
            break;

        case STORES.ACCOUNTS:
            // Balance is required but can be sanitized to 0 if invalid.
            if (isInvalidNumber(hydrated.balance)) {
                console.warn(`Sanitizing invalid 'balance' to 0 for Account record:`, record);
                hydrated.balance = 0;
            }
            break;

        case STORES.TRANSACTIONS: {
            const date = safeCreateDate(hydrated.date);
            if (!date) {
                console.warn(`Skipping corrupted Transaction record due to invalid 'date'. Record:`, record);
                return null;
            }
            // Amount is required. Discard record if invalid.
            if (isInvalidNumber(hydrated.amount)) {
                console.warn(`Skipping corrupted Transaction record due to invalid 'amount'. Record:`, record);
                return null;
            }
            hydrated.date = date;
            break;
        }

        case STORES.BILLS: {
            const dueDate = safeCreateDate(hydrated.dueDate);
            if (!dueDate) {
                console.warn(`Skipping corrupted Bill record due to invalid 'dueDate'. Record:`, record);
                return null;
            }
             // Amount is required. Discard record if invalid.
            if (isInvalidNumber(hydrated.amount)) {
                console.warn(`Skipping corrupted Bill record due to invalid 'amount'. Record:`, record);
                return null;
            }
            hydrated.dueDate = dueDate;
            break;
        }

        case STORES.FEEDBACK_ITEMS:
        case STORES.BROADCAST_MESSAGES: {
             // Required date: if invalid, discard the entire record.
            const timestamp = safeCreateDate(hydrated.timestamp);
            if (!timestamp) {
                console.warn(`Skipping corrupted ${storeName} record due to invalid 'timestamp'. Record:`, record);
                return null;
            }
            hydrated.timestamp = timestamp;
            break;
        }

        // No default case is needed for other stores like SHARED_SPACES or SETTINGS
        // as they don't require special hydration. The deep-cloned object is sufficient.
    }

    return hydrated;
};

const get = async <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
    const record = await performDbOperation<any>(storeName, 'readonly', store => store.get(key));
    if (record) {
        const hydrated = hydrateRecord(record, storeName);
        // hydrateRecord can return null for corrupted data
        return hydrated !== null ? (hydrated as T) : undefined;
    }
    return undefined;
};

const getAll = async <T>(storeName: string): Promise<T[]> => {
    const records = await performDbOperation<any[]>(storeName, 'readonly', store => store.getAll());

    // Map over records, hydrate/validate them, and then filter out any null (corrupted) results.
    const validatedRecords = records
        .map(record => hydrateRecord(record, storeName))
        .filter((record): record is T => record !== null); // Type guard ensures the final array is of type T[]
    
    return validatedRecords;
};

const add = async <T>(storeName: string, value: T): Promise<IDBValidKey> => {
    const storableValue = prepareForDb(value);
    return performDbOperation(storeName, 'readwrite', store => store.add(storableValue));
};

const put = async <T>(storeName: string, value: T): Promise<IDBValidKey> => {
    const storableValue = prepareForDb(value);
    return performDbOperation(storeName, 'readwrite', store => store.put(storableValue));
};

const del = async (storeName: string, key: IDBValidKey): Promise<void> => {
    return performDbOperation<void>(storeName, 'readwrite', store => store.delete(key));
};


const getSetting = async <T>(key: string): Promise<T | undefined> => {
    const result = await get<{ key: string, value: T }>(STORES.SETTINGS, key);
    return result?.value;
};

const putSetting = async (setting: { key: string, value: any }): Promise<IDBValidKey> => {
    return put(STORES.SETTINGS, setting);
};


export const dbService = {
  STORES,
  get,
  getAll,
  add,
  put,
  delete: del,
  getSetting,
  putSetting,
};
