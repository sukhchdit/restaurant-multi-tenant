import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSignalR } from '@/hooks/useSignalR';
import { orderApi } from '@/services/api/orderApi';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ChefHat, CheckCircle, AlertCircle, Printer } from 'lucide-react';
import { toast } from 'sonner';
import type { KitchenOrderTicket } from '@/types/order.types';
import type { ApiResponse } from '@/types/api.types';

const printKOTTicket = (kot: KitchenOrderTicket) => {
  const printWindow = window.open('', '_blank', 'width=300,height=500');
  if (!printWindow) return;

  const itemsHtml = kot.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:2px 0;font-size:13px">${item.quantity}x ${item.menuItemName}${item.isVeg ? ' (V)' : ''}${item.notes ? `<br><i style="font-size:11px;color:#666">  ${item.notes}</i>` : ''}</td>
        </tr>`
    )
    .join('');

  printWindow.document.write(`<!DOCTYPE html><html><head><title>KOT</title>
    <style>
      body{font-family:monospace;margin:0;padding:8px;width:270px}
      h2,h3,p{margin:4px 0}
      table{width:100%;border-collapse:collapse}
      hr{border:none;border-top:1px dashed #000;margin:6px 0}
      @media print{body{width:100%}}
    </style></head><body>
    <h2 style="text-align:center;font-size:16px">KOT #${kot.kotNumber}</h2>
    <p style="text-align:center;font-size:12px">${kot.tableNumber ? `Table ${kot.tableNumber}` : 'Takeaway'} | Order #${kot.orderNumber}</p>
    <p style="text-align:center;font-size:11px;color:#666">${new Date(kot.sentAt).toLocaleString()}</p>
    <hr/>
    <table>${itemsHtml}</table>
    <hr/>
    <p style="text-align:center;font-size:11px">${kot.items.length} item(s)</p>
    </body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};

export const KitchenDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const queryClient = useQueryClient();
  const { on } = useSignalR('kitchen');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = on('KOTUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['activeKOTs'] });
    });
    return unsubscribe;
  }, [on, queryClient]);

  useEffect(() => {
    const unsubscribe = on('NewKOT', () => {
      queryClient.invalidateQueries({ queryKey: ['activeKOTs'] });
      toast.info('New order received!');
    });
    return unsubscribe;
  }, [on, queryClient]);

  const { data: kotsResponse, isLoading } = useQuery({
    queryKey: ['activeKOTs'],
    queryFn: () => orderApi.getActiveKOTs(),
    refetchInterval: 15000,
  });

  const startPreparingMutation = useMutation({
    mutationFn: (id: string) => orderApi.startPreparingKOT(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['activeKOTs'] });
      const previous = queryClient.getQueryData(['activeKOTs']);
      queryClient.setQueryData(['activeKOTs'], (old: ApiResponse<KitchenOrderTicket[]> | undefined) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((k) => k.id === id ? { ...k, status: 'preparing' as const } : k) };
      });
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeKOTs'] });
      toast.success('Started preparing');
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['activeKOTs'], context.previous);
      toast.error('Failed to update status');
    },
  });

  const markPrintedMutation = useMutation({
    mutationFn: (id: string) => orderApi.markKOTPrinted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeKOTs'] });
    },
  });

  const handlePrintKOT = (kot: KitchenOrderTicket) => {
    printKOTTicket(kot);
    markPrintedMutation.mutate(kot.id);
  };

  const markReadyMutation = useMutation({
    mutationFn: (id: string) => orderApi.markKOTReady(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['activeKOTs'] });
      const previous = queryClient.getQueryData(['activeKOTs']);
      queryClient.setQueryData(['activeKOTs'], (old: ApiResponse<KitchenOrderTicket[]> | undefined) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((k) => k.id === id ? { ...k, status: 'ready' as const } : k) };
      });
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeKOTs'] });
      toast.success('Order ready for serving');
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['activeKOTs'], context.previous);
      toast.error('Failed to mark as ready');
    },
  });

  const activeKOTs = kotsResponse?.data ?? [];

  const getStatusColor = (status: string, priority: string) => {
    if (status === 'ready') return 'border-green-500 bg-green-50 dark:bg-green-950/20';
    if (status === 'preparing') return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
    if (priority === 'high' || priority === 'urgent') return 'border-red-500 bg-red-50 dark:bg-red-950/20';
    if (priority === 'medium') return 'border-amber-500 bg-amber-50 dark:bg-amber-950/20';
    return 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950/20';
  };

  const getTimeElapsed = (sentAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(sentAt).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-primary to-primary/80 px-5 py-4 text-primary-foreground shadow">
        <div className="flex items-center gap-3">
          <ChefHat className="h-7 w-7" />
          <div>
            <h1 className="text-xl font-bold">Kitchen Display</h1>
            <p className="text-xs text-primary-foreground/70">Real-time order tracking</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-primary-foreground/70">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center gap-2 p-3">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="text-xl font-bold">{activeKOTs.filter((k) => k.status === 'sent').length}</span>
            <span className="text-xs text-muted-foreground">New</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="flex items-center gap-2 p-3">
            <ChefHat className="h-5 w-5 text-blue-500" />
            <span className="text-xl font-bold">{activeKOTs.filter((k) => k.status === 'preparing').length}</span>
            <span className="text-xs text-muted-foreground">Preparing</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="flex items-center gap-2 p-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-xl font-bold">{activeKOTs.filter((k) => k.status === 'ready').length}</span>
            <span className="text-xs text-muted-foreground">Ready</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="flex items-center gap-2 p-3">
            <Clock className="h-5 w-5 text-purple-500" />
            <span className="text-xl font-bold">{activeKOTs.length}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {activeKOTs
          .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
          .map((kot) => (
            <Card
              key={kot.id}
              className={`border-2 ${getStatusColor(kot.status, kot.priority)} transition-all hover:shadow-lg`}
            >
              <CardHeader className="px-3 py-2">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">
                      {kot.tableNumber ? `Table ${kot.tableNumber}` : 'Takeaway'} &middot; {kot.kotNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Order #{kot.orderNumber}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <Badge
                      className="text-[10px] px-1.5 py-0"
                      variant={
                        kot.priority === 'high' || kot.priority === 'urgent'
                          ? 'destructive'
                          : kot.priority === 'medium'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {kot.priority.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {getTimeElapsed(kot.sentAt)}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 px-3 pb-3 pt-0">
                {/* Items */}
                <div className="space-y-1">
                  {kot.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-1.5 rounded bg-card px-2 py-1.5 text-sm"
                    >
                      <span className="shrink-0 font-bold text-primary">{item.quantity}x</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-tight">{item.menuItemName}</p>
                        {item.notes && (
                          <p className="text-[11px] italic text-muted-foreground truncate">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      {item.isVeg !== undefined && (
                        <span className={`shrink-0 text-[10px] font-bold ${item.isVeg ? 'text-green-600' : 'text-red-600'}`}>
                          {item.isVeg ? 'V' : 'NV'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 border-t border-border pt-2">
                  {(kot.status === 'sent' || kot.status === 'acknowledged') && (
                    <>
                      <Button
                        size="sm"
                        className="h-7 flex-1 text-xs"
                        onClick={() => startPreparingMutation.mutate(kot.id)}
                        disabled={startPreparingMutation.isPending}
                      >
                        <ChefHat className="mr-1 h-3 w-3" />
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => handlePrintKOT(kot)}
                        title="Print Ticket"
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                    </>
                  )}

                  {kot.status === 'preparing' && (
                    <>
                      <Button
                        size="sm"
                        className="h-7 flex-1 bg-green-600 text-xs hover:bg-green-700"
                        onClick={() => markReadyMutation.mutate(kot.id)}
                        disabled={markReadyMutation.isPending}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Ready
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => handlePrintKOT(kot)}
                        title="Print Ticket"
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                    </>
                  )}

                  {kot.status === 'ready' && (
                    <>
                      <div className="flex flex-1 items-center justify-center rounded bg-green-100 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Ready
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => handlePrintKOT(kot)}
                        title="Print Ticket"
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {activeKOTs.length === 0 && (
        <Card className="p-8">
          <div className="text-center">
            <ChefHat className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-semibold">No Active Orders</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              New orders will appear here automatically
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
