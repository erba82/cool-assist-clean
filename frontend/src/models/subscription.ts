// تعریف انواع داده مربوط به اشتراک‌ها

export interface PlanFeature {
  name: string;
  available: boolean;
}

export type PlanInterval = 'monthly' | 'quarterly' | 'annual';

export interface Plan {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number; // قیمت قبلی برای نمایش تخفیف
  interval: PlanInterval;
  features: PlanFeature[];
  recommended?: boolean;
  limits?: {
    aiQueries?: number;
    fileStorage?: number;
    advancedTools?: boolean;
  };
}

export type SubscriptionStatus = 'active' | 'expired' | 'canceled';

export interface Subscription {
  id: string;
  plan: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  paymentMethod: string;
}

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionType = 'purchase' | 'refund' | 'credit';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  status: TransactionStatus;
  transactionId: string;
  relatedSubscription?: string;
  createdAt: string;
  paymentMethod: string;
}