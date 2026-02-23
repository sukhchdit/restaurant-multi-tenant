import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/services/api/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreditCard, DollarSign, Search, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ApiResponse, PaginatedResult } from '@/types/api.types';
import type { Payment, PaymentMethod, ProcessPaymentRequest } from '@/types/payment.types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'partially-paid': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const paymentApi = {
  getPayments: async (params?: { search?: string }): Promise<ApiResponse<PaginatedResult<Payment>>> => {
    const response = await axiosInstance.get('/payments', { params });
    return response.data;
  },
  processPayment: async (data: ProcessPaymentRequest): Promise<ApiResponse<Payment>> => {
    const response = await axiosInstance.post('/payments', data);
    return response.data;
  },
  refundPayment: async (id: string, amount: number, reason: string): Promise<ApiResponse<Payment>> => {
    const response = await axiosInstance.post(`/payments/${id}/refund`, { amount, reason });
    return response.data;
  },
};

export const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [transactionId, setTransactionId] = useState('');
  const queryClient = useQueryClient();

  const { data: paymentsResponse, isLoading } = useQuery({
    queryKey: ['payments', searchTerm],
    queryFn: () => paymentApi.getPayments({ search: searchTerm || undefined }),
  });

  const processPaymentMutation = useMutation({
    mutationFn: (data: ProcessPaymentRequest) => paymentApi.processPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment processed successfully');
      setProcessDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to process payment';
      toast.error(msg);
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) =>
      paymentApi.refundPayment(id, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Refund initiated');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to process refund';
      toast.error(msg);
    },
  });

  const payments = paymentsResponse?.data?.items ?? [];

  const totalRevenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter((p) => p.status === 'pending').length;

  const resetForm = () => {
    setOrderId('');
    setAmount('');
    setPaymentMethod('cash');
    setTransactionId('');
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast.error('Please enter an Order ID');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    processPaymentMutation.mutate({
      orderId: orderId.trim(),
      amount: parsedAmount,
      paymentMethod,
      transactionId: transactionId || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-5 w-72" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Process and track all payment transactions
          </p>
        </div>
        <Button onClick={() => setProcessDialogOpen(true)}>
          <CreditCard className="mr-2 h-4 w-4" />
          Process Payment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">Rs. {totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by order number or transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.orderNumber || payment.orderId.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    Rs. {payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {payment.transactionId || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[payment.status]}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {payment.status === 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          refundMutation.mutate({
                            id: payment.id,
                            amount: payment.amount,
                            reason: 'Customer request',
                          })
                        }
                        disabled={refundMutation.isPending}
                      >
                        Refund
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Process Payment Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Enter the payment details to process a transaction
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order-id">Order ID</Label>
              <Input
                id="order-id"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter order ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Rs.)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <SearchableSelect
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Card' },
                  { value: 'upi', label: 'UPI' },
                  { value: 'online', label: 'Online' },
                  { value: 'wallet', label: 'Wallet' },
                ]}
                placeholder="Select payment method"
              />
            </div>

            {paymentMethod !== 'cash' && (
              <div className="space-y-2">
                <Label htmlFor="transaction-id">Transaction ID</Label>
                <Input
                  id="transaction-id"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction reference"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProcessDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={processPaymentMutation.isPending}>
                {processPaymentMutation.isPending ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
