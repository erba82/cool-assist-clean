// سرویس مدیریت اشتراک‌ها
import axios from 'axios';
import { Plan, Subscription, Transaction } from '../models/subscription';

export const SubscriptionService = {
  // دریافت لیست پلن‌های موجود
  getPlans: async (): Promise<Plan[]> => {
    try {
      const response = await axios.get('/api/plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  },
  
  // دریافت اشتراک فعلی کاربر
  getCurrentSubscription: async (): Promise<Subscription | null> => {
    try {
      const response = await axios.get('/api/subscriptions/current');
      return response.data;
    } catch (error) {
      // اگر اشتراکی یافت نشد، null برگردان
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching current subscription:', error);
      throw error;
    }
  },
  
  // دریافت تاریخچه تراکنش‌ها
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await axios.get('/api/transactions');
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },
  
  // ایجاد سشن پرداخت جدید
  createCheckoutSession: async (planId: string, interval: string): Promise<{ paymentUrl: string, transactionId: string }> => {
    try {
      const response = await axios.post('/api/subscriptions/checkout', {
        planId,
        interval
      });
      return response.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },
  
  // لغو اشتراک
  cancelSubscription: async (): Promise<{ success: boolean, message: string }> => {
    try {
      const response = await axios.post('/api/subscriptions/cancel');
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },
  
  // تغییر وضعیت تمدید خودکار
  toggleAutoRenew: async (autoRenew: boolean): Promise<{ success: boolean, message: string }> => {
    try {
      const response = await axios.post('/api/subscriptions/auto-renew', { autoRenew });
      return response.data;
    } catch (error) {
      console.error('Error toggling auto-renew:', error);
      throw error;
    }
  },
  
  // تغییر پلن اشتراک
  changePlan: async (planId: string): Promise<{ paymentUrl: string, transactionId: string }> => {
    try {
      const response = await axios.post('/api/subscriptions/change-plan', { planId });
      return response.data;
    } catch (error) {
      console.error('Error changing plan:', error);
      throw error;
    }
  }
};