import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '@/services/api/menuApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, Trash2, ChefHat } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { MenuItem, CreateMenuItemRequest, UpdateMenuItemRequest } from '@/types/menu.types';

const emptyForm: CreateMenuItemRequest = {
  categoryId: '',
  name: '',
  description: '',
  price: 0,
  isVeg: true,
  preparationTime: 15,
  tags: [],
};

export const MenuManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<CreateMenuItemRequest>({ ...emptyForm });
  const [editForm, setEditForm] = useState<UpdateMenuItemRequest>({});
  const [tagInput, setTagInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
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

  const createItemMutation = useMutation({
    mutationFn: (data: CreateMenuItemRequest) => menuApi.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu item created');
      setAddDialogOpen(false);
      setForm({ ...emptyForm });
      setTagInput('');
    },
    onError: () => {
      toast.error('Failed to create menu item');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuItemRequest }) =>
      menuApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu item updated');
      setEditDialogOpen(false);
      setEditingItem(null);
      setEditTagInput('');
    },
    onError: () => {
      toast.error('Failed to update menu item');
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

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setEditForm({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || '',
      cuisine: item.cuisine || '',
      price: item.price,
      isVeg: item.isVeg,
      preparationTime: item.preparationTime,
      tags: [...item.tags],
      isAvailable: item.isAvailable,
      discountedPrice: item.discountedPrice,
    });
    setEditTagInput('');
    setEditDialogOpen(true);
  };

  const menu = menuResponse?.data?.items ?? [];
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
                <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
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
        <Button onClick={() => setAddDialogOpen(true)}>
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

      {/* Edit Menu Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>Update menu item details.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingItem || !editForm.name || !editForm.categoryId || !editForm.price || editForm.price <= 0) {
                toast.error('Please fill in name, category, and a valid price');
                return;
              }
              updateItemMutation.mutate({ id: editingItem.id, data: editForm });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="editName">Name *</Label>
              <Input
                id="editName"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={editForm.categoryId || ''}
                  onValueChange={(value) => setEditForm({ ...editForm, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPrice">Price *</Label>
                <Input
                  id="editPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price || ''}
                  onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPrepTime">Prep Time (min)</Label>
                <Input
                  id="editPrepTime"
                  type="number"
                  min="1"
                  value={editForm.preparationTime || ''}
                  onChange={(e) => setEditForm({ ...editForm, preparationTime: parseInt(e.target.value) || 15 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCuisine">Cuisine</Label>
                <Input
                  id="editCuisine"
                  value={editForm.cuisine || ''}
                  onChange={(e) => setEditForm({ ...editForm, cuisine: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="editIsVeg"
                  checked={editForm.isVeg ?? false}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, isVeg: checked })}
                />
                <Label htmlFor="editIsVeg">Vegetarian</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="editIsAvailable"
                  checked={editForm.isAvailable ?? true}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, isAvailable: checked })}
                />
                <Label htmlFor="editIsAvailable">Available</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  placeholder="Add a tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const tag = editTagInput.trim();
                      if (tag && !editForm.tags?.includes(tag)) {
                        setEditForm({ ...editForm, tags: [...(editForm.tags || []), tag] });
                        setEditTagInput('');
                      }
                    }
                  }}
                />
              </div>
              {editForm.tags && editForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {editForm.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setEditForm({ ...editForm, tags: editForm.tags?.filter((t) => t !== tag) })}
                    >
                      {tag} x
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateItemMutation.isPending}>
                {updateItemMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Menu Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogDescription>Create a new item for your menu.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name || !form.categoryId || form.price <= 0) {
                toast.error('Please fill in name, category, and a valid price');
                return;
              }
              createItemMutation.mutate(form);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Butter Chicken"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => setForm({ ...form, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price || ''}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the dish"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prepTime">Prep Time (min)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  min="1"
                  value={form.preparationTime}
                  onChange={(e) => setForm({ ...form, preparationTime: parseInt(e.target.value) || 15 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine</Label>
                <Input
                  id="cuisine"
                  value={form.cuisine || ''}
                  onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                  placeholder="e.g. Indian"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isVeg"
                checked={form.isVeg}
                onCheckedChange={(checked) => setForm({ ...form, isVeg: checked })}
              />
              <Label htmlFor="isVeg">Vegetarian</Label>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const tag = tagInput.trim();
                      if (tag && !form.tags?.includes(tag)) {
                        setForm({ ...form, tags: [...(form.tags || []), tag] });
                        setTagInput('');
                      }
                    }
                  }}
                />
              </div>
              {form.tags && form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setForm({ ...form, tags: form.tags?.filter((t) => t !== tag) })}
                    >
                      {tag} x
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createItemMutation.isPending}>
                {createItemMutation.isPending ? 'Creating...' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
