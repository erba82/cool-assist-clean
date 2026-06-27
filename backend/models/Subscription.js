// backend/models/Subscription.js
const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  interval: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual'],
    default: 'monthly'
  },
  features: [String],
  limits: {
    aiQueries: Number,
    fileStorage: Number,
    advancedTools: Boolean
  },
  active: {
    type: Boolean,
    default: true
  }
});

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'canceled'],
    default: 'active'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'online_payment'],
    required: true
  }
});

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['purchase', 'refund', 'credit'],
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  relatedSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'online_payment']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// قبل از ذخیره‌سازی updatedAt را به‌روز کن
TransactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Plan = mongoose.model('Plan', PlanSchema);
const Subscription = mongoose.model('Subscription', SubscriptionSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { Plan, Subscription, Transaction };