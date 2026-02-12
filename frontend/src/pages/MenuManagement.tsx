import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '@/services/api/menuApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Edit, Trash2, ChefHat } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { MenuItem } from '@/types/menu.types';

export const MenuManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: menuResponse, isLoading } = useQuery({
    queryKey: ['menu', searchTerm],
    queryFn: () => menuApi.getItems({ search: searchTerm || undefined, pageSize: 200 }),
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['menuCategories'],
    queryFn: () => menuApi.getCategories(),
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (id: string) => menuApi.toggleAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Item availability updated');
    },
    onError: () => {
      toast.error('Failed to update item availability');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Item deleted');
    },
    onError: () => {
      toast.error('Failed to delete item');
    },
  });

  const menu = menuResponse?.data ?? [];
  const categories = categoriesResponse?.data ?? [];
  const categoryNames = categories.map((c) => c.name);

  const filterMenu = (category?: string) => {
    let filtered = menu;

    if (category) {
      filtered = filtered.filter((item) => item.categoryName === category);
    }

    return filtered;
  };

  const handleToggleAvailability = (itemId: string) => {
    toggleAvailabilityMutation.mutate(itemId);
  };

  const handleDelete = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const MenuItemCard = ({ item }: { item: MenuItem }) => (
    <Card className="transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Item Image */}
          <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <ChefHat className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          {/* Item Details */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  <Badge
                    variant="secondary"
                    className={
                      item.isVeg
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }
                  >
                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <p className="text-xl font-bold text-primary">${item.price.toFixed(2)}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{item.categoryName}</Badge>
              {item.cuisine && <Badge variant="outline">{item.cuisine}</Badge>}
              <Badge variant="outline">{item.preparationTime} min</Badge>
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Available</span>
                <Switch
                  checked={item.isAvailable}
                  onCheckedChange={() => handleToggleAvailability(item.id)}
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-2 h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-10 w-96" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            Manage your restaurant&apos;s food and drinks menu
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Menu Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-3xl font-bold">{menu.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-3xl font-bold text-green-600">
              {menu.filter((i) => i.isAvailable).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Unavailable</p>
            <p className="text-3xl font-bold text-red-600">
              {menu.filter((i) => !i.isAvailable).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Categories</p>
            <p className="text-3xl font-bold">{categoryNames.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Menu Items */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Items ({menu.length})</TabsTrigger>
          {categoryNames.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category} ({filterMenu(category).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {filterMenu().map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </TabsContent>

        {categoryNames.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4 mt-6">
            {filterMenu(category).map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
