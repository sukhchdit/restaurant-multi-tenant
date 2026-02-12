import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/services/api/inventoryApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, AlertTriangle, TrendingDown, Package } from 'lucide-react';
import { toast } from 'sonner';

export const Inventory = () => {
  const queryClient = useQueryClient();

  const { data: inventoryResponse, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.getItems(),
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, quantity, costPerUnit }: { id: string; quantity: number; costPerUnit: number }) =>
      inventoryApi.restock(id, { quantity, costPerUnit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item restocked successfully');
    },
    onError: () => {
      toast.error('Failed to restock item');
    },
  });

  const inventory = inventoryResponse?.data ?? [];
  const lowStockItems = inventory.filter((i) => i.currentStock <= i.minStock);
  const totalValue = inventory.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-2 h-5 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage stock levels</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">
                  {new Set(inventory.map((i) => i.category)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="font-semibold">
                {lowStockItems.length} items need restocking
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory List */}
      <div className="space-y-4">
        {inventory.map((item) => {
          const stockPercentage = (item.currentStock / item.maxStock) * 100;
          const isLowStock = item.currentStock <= item.minStock;
          const isExpiringSoon =
            item.expiryDate &&
            new Date(item.expiryDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

          return (
            <Card key={item.id} className="transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <Badge variant="outline">{item.category}</Badge>
                        {isLowStock && (
                          <Badge variant="destructive">Low Stock</Badge>
                        )}
                        {isExpiringSoon && (
                          <Badge variant="default" className="bg-amber-500">
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Unit: {item.unit} - Cost: ${item.costPerUnit.toFixed(2)}/{item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {item.currentStock} {item.unit}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Min: {item.minStock} - Max: {item.maxStock}
                      </p>
                    </div>
                  </div>

                  {/* Stock Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stock Level</span>
                      <span className={isLowStock ? 'text-red-600' : 'text-green-600'}>
                        {stockPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={stockPercentage}
                      className={isLowStock ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="flex gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Last Restocked</p>
                        <p className="font-medium">
                          {item.lastRestockedAt
                            ? new Date(item.lastRestockedAt).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      {item.expiryDate && (
                        <div>
                          <p className="text-muted-foreground">Expiry Date</p>
                          <p className={`font-medium ${isExpiringSoon ? 'text-amber-600' : ''}`}>
                            {new Date(item.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          restockMutation.mutate({
                            id: item.id,
                            quantity: item.maxStock - item.currentStock,
                            costPerUnit: item.costPerUnit,
                          })
                        }
                        disabled={restockMutation.isPending}
                      >
                        Restock
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
