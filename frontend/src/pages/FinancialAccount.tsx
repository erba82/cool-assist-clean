// frontend/src/pages/FinancialAccount.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  Button, CircularProgress
} from '@mui/material';
import axios from 'axios';

interface Transaction {
  id: string;
  amount: number;
  type: 'purchase' | 'refund' | 'credit';
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  createdAt: string;
}

interface SubscriptionDetails {
  plan: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'canceled';
  autoRenew: boolean;
}

const FinancialAccount: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const transactionsResponse = await axios.get('/api/transactions');
      const subscriptionResponse = await axios.get('/api/subscriptions/current');
      
      setTransactions(transactionsResponse.data);
      setSubscription(subscriptionResponse.data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'موفق';
      case 'pending':
        return 'در حال انجام';
      case 'failed':
        return 'ناموفق';
      case 'refunded':
        return 'برگشت وجه';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        حساب مالی
      </Typography>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="financial tabs"
        >
          <Tab label="اشتراک" />
          <Tab label="تراکنش‌ها" />
          <Tab label="صورت‌حساب‌ها" />
        </Tabs>

        <Box p={3}>
          {tabValue === 0 && (
            <Box>
              {subscription ? (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    اطلاعات اشتراک فعلی
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 3 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        نوع اشتراک
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {subscription.plan}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        تاریخ شروع
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(subscription.startDate)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        تاریخ پایان
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(subscription.endDate)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        وضعیت
                      </Typography>
                      <Chip 
                        label={subscription.status === 'active' ? 'فعال' : 
                              subscription.status === 'expired' ? 'منقضی شده' : 'لغو شده'} 
                        color={subscription.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        تمدید خودکار
                      </Typography>
                      <Typography variant="body1">
                        {subscription.autoRenew ? 'فعال' : 'غیرفعال'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" color="primary">
                      تغییر پلن
                    </Button>
                    <Button variant="outlined" color={subscription.autoRenew ? "error" : "primary"}>
                      {subscription.autoRenew ? 'غیرفعال کردن تمدید خودکار' : 'فعال کردن تمدید خودکار'}
                    </Button>
                  </Box>
                </Paper>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" paragraph>
                    شما در حال حاضر اشتراک فعالی ندارید.
                  </Typography>
                  <Button variant="contained" color="primary">
                    خرید اشتراک
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              {transactions.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>تاریخ</TableCell>
                        <TableCell>توضیحات</TableCell>
                        <TableCell>مبلغ</TableCell>
                        <TableCell>نوع</TableCell>
                        <TableCell>وضعیت</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{formatAmount(transaction.amount)}</TableCell>
                          <TableCell>
                            {transaction.type === 'purchase' ? 'خرید' :
                             transaction.type === 'refund' ? 'برگشت وجه' : 'اعتبار'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={getStatusText(transaction.status)}
                              color={getStatusColor(transaction.status) as any}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1">
                    هیچ تراکنشی یافت نشد.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1">
                صورت حساب‌های شما
              </Typography>
              {/* محتوای تب صورت‌حساب‌ها */}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default FinancialAccount;