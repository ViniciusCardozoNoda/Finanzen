
import { View } from '../types';

const ANALYTICS_KEY = 'finanzen_analytics';

interface AnalyticsData {
  [key: string]: number;
}

const getAnalyticsData = (): AnalyticsData => {
  try {
    const data = localStorage.getItem(ANALYTICS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse analytics data:", error);
    return {};
  }
};

const saveAnalyticsData = (data: AnalyticsData) => {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch (error) {
    // This warning is important for debugging but should not crash the app.
    console.warn("Could not save analytics data to localStorage. This can happen if storage is disabled (e.g., in private browsing mode).", error);
  }
};

export const logFeatureClick = (feature: View) => {
  const data = getAnalyticsData();
  data[feature] = (data[feature] || 0) + 1;
  saveAnalyticsData(data);
};

export const getUsageStats = (): { name: string; clicks: number }[] => {
  const data = getAnalyticsData();
  return Object.entries(data)
    .map(([name, clicks]) => ({ name, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
};
