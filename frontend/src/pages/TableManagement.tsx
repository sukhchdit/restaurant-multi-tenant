import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tableApi } from '@/services/api/tableApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, QrCode, Plus } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { toast } from 'sonner';
import type { RestaurantTable, TableStatus } from '@/types/table.types';

const statusBadgeColors: Record<TableStatus, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  occupied: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  reserved: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

export const TableManagement = () => {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const queryClient = useQueryClient();

  const { data: tablesResponse, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableApi.getTables(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tableApi.updateTableStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table status updated');
    },
    onError: () => {
      toast.error('Failed to update table status');
    },
  });

  const freeTableMutation = useMutation({
    mutationFn: (id: string) => tableApi.freeTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table freed');
    },
    onError: () => {
      toast.error('Failed to free table');
    },
  });

  const tables = tablesResponse?.data ?? [];
  const availableTables = tables.filter((t) => t.status === 'available').length;
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const reservedTables = tables.filter((t) => t.status === 'reserved').length;

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
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Table Management</h1>
          <p className="text-muted-foreground">Visual floor layout and table status</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Table
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Tables</p>
            <p className="text-3xl font-bold">{tables.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-3xl font-bold text-green-600">{availableTables}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Occupied</p>
            <p className="text-3xl font-bold text-red-600">{occupiedTables}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Reserved</p>
            <p className="text-3xl font-bold text-amber-600">{reservedTables}</p>
          </CardContent>
        </Card>
      </div>

      {/* Floor Layout */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Floor Layout</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-green-500" />
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-red-500" />
              <span className="text-sm">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-amber-500" />
              <span className="text-sm">Reserved</span>
            </div>
          </div>
        </div>

        {/* Table Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg',
                selectedTable?.id === table.id && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedTable(table)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold">{table.tableNumber}</p>
                    <Badge className={statusBadgeColors[table.status]}>
                      {table.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{table.capacity} seats</span>
                  </div>

                  {table.status === 'available' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatusMutation.mutate({ id: table.id, status: 'occupied' });
                      }}
                    >
                      Assign
                    </Button>
                  )}

                  {table.status === 'occupied' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        freeTableMutation.mutate(table.id);
                      }}
                    >
                      Free Table
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Card>

      {/* Selected Table Details */}
      {selectedTable && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Table {selectedTable.tableNumber}</h3>
                <Button variant="outline" size="sm">
                  <QrCode className="mr-2 h-4 w-4" />
                  View QR Code
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="text-lg font-semibold">{selectedTable.capacity} people</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusBadgeColors[selectedTable.status]}>
                    {selectedTable.status}
                  </Badge>
                </div>
                {selectedTable.currentOrderId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Current Order</p>
                    <p className="text-lg font-semibold">#{selectedTable.currentOrderId.slice(0, 8)}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    updateStatusMutation.mutate({ id: selectedTable.id, status: 'available' })
                  }
                >
                  Mark Available
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    updateStatusMutation.mutate({ id: selectedTable.id, status: 'reserved' })
                  }
                >
                  Mark Reserved
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
