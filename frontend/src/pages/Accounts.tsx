import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/services/api/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BookOpen,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types/api.types';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdBy: string;
}

interface DailySettlement {
  id: string;
  date: string;
  totalRevenue: number;
  totalExpenses: number;
  cashInHand: number;
  cardPayments: number;
  onlinePayments: number;
  netAmount: number;
  status: 'open' | 'settled';
  settledBy?: string;
}

const accountsApi = {
  getLedger: async (params?: {
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<LedgerEntry[]>> => {
    const response = await axiosInstance.get('/accounts/ledger', { params });
    return response.data;
  },
  createEntry: async (data: Partial<LedgerEntry>): Promise<ApiResponse<LedgerEntry>> => {
    const response = await axiosInstance.post('/accounts/ledger', data);
    return response.data;
  },
  getSettlements: async (): Promise<ApiResponse<DailySettlement[]>> => {
    const response = await axiosInstance.get('/accounts/settlements');
    return response.data;
  },
  settleDay: async (date: string): Promise<ApiResponse<DailySettlement>> => {
    const response = await axiosInstance.post('/accounts/settlements', { date });
    return response.data;
  },
};

export const Accounts = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    paymentMethod: 'cash',
    reference: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  const { data: ledgerResponse, isLoading: ledgerLoading } = useQuery({
    queryKey: ['ledger'],
    queryFn: () => accountsApi.getLedger(),
  });

  const { data: settlementsResponse, isLoading: settlementsLoading } = useQuery({
    queryKey: ['settlements'],
    queryFn: () => accountsApi.getSettlements(),
  });

  const createEntryMutation = useMutation({
    mutationFn: (data: Partial<LedgerEntry>) => accountsApi.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      toast.success('Entry added');
      setAddDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to add entry'),
  });

  const settleMutation = useMutation({
    mutationFn: (date: string) => accountsApi.settleDay(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      toast.success('Day settled successfully');
    },
    onError: () => toast.error('Failed to settle day'),
  });

  const ledger = ledgerResponse?.data ?? [];
  const settlements = settlementsResponse?.data ?? [];

  const totalIncome = ledger
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = ledger
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const resetForm = () => {
    setFormData({
      description: '',
      category: '',
      amount: '',
      paymentMethod: 'cash',
      reference: '',
      notes: '',
    });
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    createEntryMutation.mutate({
      description: formData.description,
      type: entryType,
      category: formData.category,
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      reference: formData.reference || undefined,
      notes: formData.notes || undefined,
      date: new Date().toISOString(),
    });
  };

  const isLoading = ledgerLoading || settlementsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-52" />
            <Skeleton className="mt-2 h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">
            Ledger entries, expense tracking, and daily settlement
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* P&L Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${netProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entries</p>
                <p className="text-2xl font-bold">{ledger.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ledger" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ledger">
            <BookOpen className="mr-2 h-4 w-4" />
            Ledger
          </TabsTrigger>
          <TabsTrigger value="settlements">
            <DollarSign className="mr-2 h-4 w-4" />
            Daily Settlement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle>Ledger Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{entry.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            entry.type === 'income'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }
                        >
                          {entry.type === 'income' ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`font-semibold ${
                          entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {entry.type === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {entry.paymentMethod || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {entry.reference || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {ledger.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No ledger entries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daily Settlements</CardTitle>
              <Button
                size="sm"
                onClick={() =>
                  settleMutation.mutate(new Date().toISOString().split('T')[0])
                }
                disabled={settleMutation.isPending}
              >
                Settle Today
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Expenses</TableHead>
                    <TableHead>Cash</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead>Online</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell>
                        {new Date(settlement.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        ${settlement.totalRevenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-red-600 font-semibold">
                        ${settlement.totalExpenses.toFixed(2)}
                      </TableCell>
                      <TableCell>${settlement.cashInHand.toFixed(2)}</TableCell>
                      <TableCell>${settlement.cardPayments.toFixed(2)}</TableCell>
                      <TableCell>${settlement.onlinePayments.toFixed(2)}</TableCell>
                      <TableCell
                        className={`font-bold ${
                          settlement.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ${settlement.netAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            settlement.status === 'settled' ? 'default' : 'secondary'
                          }
                        >
                          {settlement.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {settlements.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No settlements found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Entry Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ledger Entry</DialogTitle>
            <DialogDescription>
              Record a new income or expense entry
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEntry} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={entryType}
                onValueChange={(v) => setEntryType(v as 'income' | 'expense')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter description"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {entryType === 'income' ? (
                      <>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="catering">Catering</SelectItem>
                        <SelectItem value="other-income">Other</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="ingredients">Ingredients</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="salaries">Salaries</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="other-expense">Other</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v) =>
                    setFormData({ ...formData, paymentMethod: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  placeholder="Optional reference"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createEntryMutation.isPending}>
                {createEntryMutation.isPending ? 'Adding...' : 'Add Entry'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
