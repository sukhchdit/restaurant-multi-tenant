import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tableApi } from '@/services/api/tableApi';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Users, QrCode, Plus, Pencil } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { toast } from 'sonner';
import type { RestaurantTable, TableStatus, CreateTableRequest } from '@/types/table.types';

const statusBadgeColors: Record<TableStatus, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  occupied: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  reserved: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const emptyTableForm: CreateTableRequest = {
  tableNumber: '',
  capacity: 4,
  floorNumber: 1,
  section: '',
};

export const TableManagement = () => {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [tableForm, setTableForm] = useState<CreateTableRequest>({ ...emptyTableForm });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTableForm, setEditTableForm] = useState<CreateTableRequest>({ ...emptyTableForm });
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

  const createTableMutation = useMutation({
    mutationFn: (data: CreateTableRequest) => tableApi.createTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table created');
      setAddDialogOpen(false);
      setTableForm({ ...emptyTableForm });
    },
    onError: () => {
      toast.error('Failed to create table');
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

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTableRequest> }) =>
      tableApi.updateTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table updated');
      setEditDialogOpen(false);
      setSelectedTable(null);
    },
    onError: () => {
      toast.error('Failed to update table');
    },
  });

  const openEditDialog = (table: RestaurantTable) => {
    setEditTableForm({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      floorNumber: table.floorNumber,
      section: table.section || '',
    });
    setEditDialogOpen(true);
  };

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
        <Button onClick={() => setAddDialogOpen(true)}>
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
                  onClick={() => openEditDialog(selectedTable)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Table
                </Button>
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
      {/* Add Table Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
            <DialogDescription>Add a new table to your restaurant floor.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!tableForm.tableNumber) {
                toast.error('Please enter a table number');
                return;
              }
              createTableMutation.mutate(tableForm);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number *</Label>
                <Input
                  id="tableNumber"
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                  placeholder="e.g. T1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) || 4 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floorNumber">Floor</Label>
                <Input
                  id="floorNumber"
                  type="number"
                  min="0"
                  value={tableForm.floorNumber ?? 1}
                  onChange={(e) => setTableForm({ ...tableForm, floorNumber: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={tableForm.section || ''}
                  onChange={(e) => setTableForm({ ...tableForm, section: e.target.value })}
                  placeholder="e.g. Outdoor"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTableMutation.isPending}>
                {createTableMutation.isPending ? 'Creating...' : 'Create Table'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>Update table details.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedTable) return;
              if (!editTableForm.tableNumber) {
                toast.error('Please enter a table number');
                return;
              }
              updateTableMutation.mutate({ id: selectedTable.id, data: editTableForm });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTableNumber">Table Number *</Label>
                <Input
                  id="editTableNumber"
                  value={editTableForm.tableNumber}
                  onChange={(e) => setEditTableForm({ ...editTableForm, tableNumber: e.target.value })}
                  placeholder="e.g. T1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCapacity">Capacity *</Label>
                <Input
                  id="editCapacity"
                  type="number"
                  min="1"
                  value={editTableForm.capacity}
                  onChange={(e) => setEditTableForm({ ...editTableForm, capacity: parseInt(e.target.value) || 4 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFloorNumber">Floor</Label>
                <Input
                  id="editFloorNumber"
                  type="number"
                  min="0"
                  value={editTableForm.floorNumber ?? 1}
                  onChange={(e) => setEditTableForm({ ...editTableForm, floorNumber: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSection">Section</Label>
                <Input
                  id="editSection"
                  value={editTableForm.section || ''}
                  onChange={(e) => setEditTableForm({ ...editTableForm, section: e.target.value })}
                  placeholder="e.g. Outdoor"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTableMutation.isPending}>
                {updateTableMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
