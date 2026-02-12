import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSignalR } from '@/hooks/useSignalR';
import { orderApi } from '@/services/api/orderApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ChefHat, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const KitchenDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const queryClient = useQueryClient();
  const { on } = useSignalR('kitchen');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for real-time KOT updates
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

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => orderApi.acknowledgeKOT(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeKOTs'] });
      toast.success('Order acknowledged');
    },
    onError: () => {
      toast.error('Failed to acknowledge order');
    },
  });

  const startPreparingMutation = useMutation({
    mutationFn: (id: string) => orderApi.startPreparingKOT(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeKOTs'] });
      toast.success('Started preparing');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: (id: string) => orderApi.markKOTReady(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeKOTs'] });
      toast.success('Order ready for serving');
    },
    onError: () => {
      toast.error('Failed to mark as ready');
    },
  });

  const activeKOTs = kotsResponse?.data ?? [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-950/20';
      default:
        return 'border-green-500 bg-green-50 dark:bg-green-950/20';
    }
  };

  const getTimeElapsed = (sentAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(sentAt).getTime()) / 60000);
    return `${minutes} min ago`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <ChefHat className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kitchen Display System</h1>
            <p className="text-primary-foreground/80">Real-time order tracking</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="text-primary-foreground/80">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">
                  {activeKOTs.filter((k) => k.status === 'sent').length}
                </p>
                <p className="text-sm text-muted-foreground">New Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {activeKOTs.filter((k) => k.status === 'preparing').length}
                </p>
                <p className="text-sm text-muted-foreground">Preparing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {activeKOTs.filter((k) => k.status === 'ready').length}
                </p>
                <p className="text-sm text-muted-foreground">Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{activeKOTs.length}</p>
                <p className="text-sm text-muted-foreground">Total Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeKOTs
          .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
          .map((kot) => (
            <Card
              key={kot.id}
              className={`border-2 ${getPriorityColor(kot.priority)} transition-all hover:shadow-xl`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {kot.tableNumber || 'Takeaway'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      KOT #{kot.kotNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getTimeElapsed(kot.sentAt)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {kot.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between rounded-lg bg-card p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-bold">
                            {item.quantity}x
                          </Badge>
                          <p className="font-semibold">{item.menuItemName}</p>
                        </div>
                        {item.isVeg !== undefined && (
                          item.isVeg ? (
                            <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              VEG
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="mt-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              NON-VEG
                            </Badge>
                          )
                        )}
                        {item.notes && (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-border pt-3">
                  {kot.status === 'sent' && (
                    <Button
                      className="flex-1"
                      onClick={() => acknowledgeMutation.mutate(kot.id)}
                      variant="outline"
                      disabled={acknowledgeMutation.isPending}
                    >
                      Acknowledge
                    </Button>
                  )}

                  {(kot.status === 'acknowledged' || kot.status === 'sent') && (
                    <Button
                      className="flex-1"
                      onClick={() => startPreparingMutation.mutate(kot.id)}
                      disabled={startPreparingMutation.isPending}
                    >
                      <ChefHat className="mr-2 h-4 w-4" />
                      Start Cooking
                    </Button>
                  )}

                  {kot.status === 'preparing' && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => markReadyMutation.mutate(kot.id)}
                      disabled={markReadyMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Ready
                    </Button>
                  )}

                  {kot.status === 'ready' && (
                    <div className="flex flex-1 items-center justify-center rounded-lg bg-green-100 py-2 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span className="font-semibold">Ready to Serve</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {activeKOTs.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <ChefHat className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No Active Orders</h3>
            <p className="mt-2 text-muted-foreground">
              New orders will appear here automatically
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
