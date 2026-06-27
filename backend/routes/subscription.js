// backend/routes/subscription.js

// API دریافت پلن‌های موجود
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await Plan.find({ active: true }).sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'خطا در دریافت اطلاعات پلن‌ها' });
  }
});

// API دریافت اشتراک فعلی کاربر
app.get('/api/subscriptions/current', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const subscription = await Subscription.findOne({
      user: req.user._id,
      endDate: { $gte: now },
      status: 'active'
    }).sort({ endDate: -1 });
    
    if (!subscription) {
      return res.status(404).json({ error: 'اشتراک فعالی یافت نشد' });
    }
    
    res.json(subscription);
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({ error: 'خطا در دریافت اطلاعات اشتراک' });
  }
});

// API دریافت تاریخچه تراکنش‌ها
app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'خطا در دریافت تراکنش‌ها' });
  }
});

// API ایجاد سشن پرداخت جدید
app.post('/api/subscriptions/checkout', authMiddleware, async (req, res) => {
  try {
    const { planId, interval } = req.body;
    
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'پلن مورد نظر یافت نشد' });
    }
    
    // ایجاد شناسه تراکنش منحصر به فرد
    const transactionId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // ایجاد تراکنش در وضعیت در حال انجام
    const transaction = new Transaction({
      user: req.user._id,
      amount: plan.price,
      type: 'purchase',
      description: `خرید اشتراک ${plan.title}`,
      status: 'pending',
      transactionId,
      paymentMethod: 'online_payment'
    });
    
    await transaction.save();
    
    // ساخت URL پرداخت (این بخش باید با درگاه پرداخت واقعی جایگزین شود)
    const paymentUrl = `/payment-gateway?transactionId=${transactionId}&amount=${plan.price}&description=${encodeURIComponent(`خرید اشتراک ${plan.title}`)}`;
    
    res.json({ paymentUrl, transactionId });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'خطا در ایجاد جلسه پرداخت' });
  }
});

// API تایید پرداخت و فعال‌سازی اشتراک
app.post('/api/subscriptions/confirm', async (req, res) => {
  try {
    const { transactionId, status, paymentReference } = req.body;
    
    // یافتن تراکنش
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ error: 'تراکنش یافت نشد' });
    }
    
    // بررسی وضعیت پرداخت
    if (status === 'success') {
      // به‌روزرسانی وضعیت تراکنش
      transaction.status = 'completed';
      await transaction.save();
      
      // یافتن پلن مرتبط با تراکنش از روی توضیحات
      const planName = transaction.description.replace('خرید اشتراک ', '');
      const plan = await Plan.findOne({ title: planName });
      
      if (!plan) {
        return res.status(404).json({ error: 'پلن مورد نظر یافت نشد' });
      }
      
      // محاسبه تاریخ پایان اشتراک
      const startDate = new Date();
      let endDate = new Date(startDate);
      
      switch(plan.interval) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'annual':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
      
      // ایجاد اشتراک جدید
      const subscription = new Subscription({
        user: transaction.user,
        plan: plan.name,
        startDate,
        endDate,
        status: 'active',
        autoRenew: true,
        paymentMethod: transaction.paymentMethod
      });
      
      // ذخیره اشتراک و ارتباط آن با تراکنش
      await subscription.save();
      transaction.relatedSubscription = subscription._id;
      await transaction.save();
      
      // به‌روزرسانی کاربر
      await User.findByIdAndUpdate(transaction.user, {
        'subscription.plan': plan.name,
        'subscription.status': 'active',
        'subscription.expiresAt': endDate
      });
      
      res.json({ success: true, subscription });
    } else {
      // پرداخت ناموفق
      transaction.status = 'failed';
      await transaction.save();
      
      res.status(400).json({ error: 'پرداخت ناموفق بود' });
    }
  } catch (error) {
    console.error('Error confirming subscription:', error);
    res.status(500).json({ error: 'خطا در تایید اشتراک' });
  }
});