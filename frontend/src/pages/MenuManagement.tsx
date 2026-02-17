import { useState, useRef, useMemo } from 'react';
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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryDialog } from '@/components/CreateCategoryDialog';
import { CategoryListDialog } from '@/components/CategoryListDialog';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, Trash2, ChefHat, Settings, List, Columns2, Columns3, Columns4, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutHint } from '@/components/keyboard/KeyboardShortcutHint';
import type { MenuItem, Category, CreateMenuItemRequest, UpdateMenuItemRequest } from '@/types/menu.types';

const CREATE_CATEGORY_SENTINEL = '__create_new__';
const PAGE_SIZE = 15;

const emptyForm: CreateMenuItemRequest = {
  categoryId: '',
  name: '',
  description: '',
  price: 0,
  isVeg: true,
  isHalf: false,
  preparationTime: 15,
  tags: [],
};

export const MenuManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<CreateMenuItemRequest>({ ...emptyForm });
  const [editForm, setEditForm] = useState<UpdateMenuItemRequest>({});
  const [tagInput, setTagInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [gridCols, setGridCols] = useState<1 | 2 | 3 | 4>(4);
  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false);
  const [categoryListDialogOpen, setCategoryListDialogOpen] = useState(false);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: categoriesResponse } = useQuery({
    queryKey: ['menuCategories'],
    queryFn: () => menuApi.getCategories(),
  });

  const categories = categoriesResponse?.data ?? [];

  const activeCategoryId = activeTab === 'all'
    ? undefined
    : categories.find((c) => c.name === activeTab)?.id;

  const { data: menuResponse, isLoading } = useQuery({
    queryKey: ['menu', searchTerm, activeTab, pageNumber],
    queryFn: () => menuApi.getItems({
      search: searchTerm || undefined,
      categoryId: activeCategoryId,
      pageNumber,
      pageSize: PAGE_SIZE,
    }),
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
      isHalf: item.isHalf,
      preparationTime: item.preparationTime,
      tags: [...item.tags],
      isAvailable: item.isAvailable,
      discountedPrice: item.discountedPrice,
    });
    setEditTagInput('');
    setEditDialogOpen(true);
  };

  const menu = menuResponse?.data?.items ?? [];
  const paginatedData = menuResponse?.data;
  const totalCount = paginatedData?.totalCount ?? 0;
  const totalPages = paginatedData?.totalPages ?? 1;
  const categoryNames = categories.map((c) => c.name);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPageNumber(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPageNumber(1);
  };

  const pageShortcuts = useMemo(() => {
    const shortcuts: Record<string, () => void> = {
      'n': () => setAddDialogOpen(true),
      '/': () => searchInputRef.current?.focus(),
      'c': () => setCategoryListDialogOpen(true),
      '1': () => handleTabChange('all'),
    };
    categoryNames.forEach((name, idx) => {
      const key = String(idx + 2);
      if (parseInt(key) <= 9) {
        shortcuts[key] = () => handleTabChange(name);
      }
    });
    return shortcuts;
  }, [categoryNames]);

  useKeyboardShortcuts(pageShortcuts);

  const handleToggleAvailability = (itemId: string) => {
    toggleAvailabilityMutation.mutate(itemId);
  };

  const handleDelete = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const gridColsClass = {
    1: 'grid gap-3 grid-cols-1',
    2: 'grid gap-3 grid-cols-1 lg:grid-cols-2',
    3: 'grid gap-3 grid-cols-1 lg:grid-cols-3',
    4: 'grid gap-3 grid-cols-1 lg:grid-cols-4',
  }[gridCols];

  const MenuItemCard = ({ item }: { item: MenuItem }) => (
    <Card className="gap-0 border border-primary/40 bg-primary/[0.03] transition-all hover:border-primary/60 hover:shadow-lg">
      <CardContent className="flex p-0 [&:last-child]:pb-0">
        {/* Left: Image / Icon — 20% */}
        <div className="flex w-[20%] shrink-0 items-center justify-center rounded-l-xl bg-primary/10">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full rounded-l-xl object-cover"
            />
          ) : (
            <ChefHat className="h-8 w-8 text-primary/60" />
          )}
        </div>

        {/* Right: Details — 80% */}
        <div className="flex flex-1 flex-col gap-1.5 p-3 min-w-0">
          {/* Row 1: Name + Veg badge + Price */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-semibold leading-tight truncate text-sm">{item.name}</h3>
              <Badge
                variant="secondary"
                className={`shrink-0 text-[10px] px-1.5 ${
                  item.isVeg
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {item.isVeg ? 'VEG' : 'NON-VEG'}
              </Badge>
            </div>
            <p className="shrink-0 font-bold text-primary text-sm">${item.price.toFixed(2)}</p>
          </div>

          {/* Row 2: Description */}
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
          )}

          {/* Row 3: Tags */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px] px-1 py-0">{item.categoryName}</Badge>
            {item.cuisine && <Badge variant="outline" className="text-[10px] px-1 py-0">{item.cuisine}</Badge>}
            <Badge variant="outline" className="text-[10px] px-1 py-0">{item.preparationTime} min</Badge>
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Row 4: Actions */}
          <div className="flex items-center justify-between border-t border-border pt-1.5 mt-auto">
            <div className="flex items-center gap-1.5">
              <Switch
                checked={item.isAvailable}
                onCheckedChange={() => handleToggleAvailability(item.id)}
              />
              <span className="text-[10px] text-muted-foreground">
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => openEditDialog(item)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryListDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Categories
            <KeyboardShortcutHint shortcut="C" />
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
            <KeyboardShortcutHint shortcut="N" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex rounded-lg border border-border bg-card text-card-foreground">
        <div className="flex flex-1 items-center justify-between px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">Total Items</span>
          <span className="text-xl font-bold">{totalCount}</span>
        </div>
        <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">Available</span>
          <span className="text-xl font-bold text-green-600">{menu.filter((i) => i.isAvailable).length}</span>
        </div>
        <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">Unavailable</span>
          <span className="text-xl font-bold text-red-600">{menu.filter((i) => !i.isAvailable).length}</span>
        </div>
        <div className="flex flex-1 items-center justify-between border-l border-border px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">Categories</span>
          <span className="text-xl font-bold">{categoryNames.length}</span>
        </div>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="hidden lg:flex items-center gap-1 rounded-lg border border-border p-1">
          {([
            { cols: 1 as const, icon: List, label: 'List view' },
            { cols: 2 as const, icon: Columns2, label: '2 columns' },
            { cols: 3 as const, icon: Columns3, label: '3 columns' },
            { cols: 4 as const, icon: Columns4, label: '4 columns' },
          ]).map(({ cols, icon: Icon, label }) => (
            <Button
              key={cols}
              size="icon"
              variant={gridCols === cols ? 'default' : 'ghost'}
              className="h-8 w-8"
              title={label}
              onClick={() => setGridCols(cols)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Items by Category */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <TabsList className="w-full justify-start gap-1">
            <TabsTrigger value="all" className="min-w-max">
              All Items
              {activeTab === 'all' && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                  {totalCount}
                </Badge>
              )}
            </TabsTrigger>
            {categoryNames.map((category) => (
              <TabsTrigger key={category} value={category} className="min-w-max">
                {category}
                {activeTab === category && (
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                    {totalCount}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-4">
          {menu.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ChefHat className="h-12 w-12 mb-3" />
              <p className="font-medium">
                {activeTab === 'all' ? 'No menu items yet' : `No items in ${activeTab}`}
              </p>
              <p className="text-sm">
                {activeTab === 'all'
                  ? 'Add your first menu item to get started.'
                  : 'Add a menu item to this category.'}
              </p>
            </div>
          ) : (
            <>
              <div className={gridColsClass}>
                {menu.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pageNumber - 1) * PAGE_SIZE + 1}&ndash;{Math.min(pageNumber * PAGE_SIZE, totalCount)} of {totalCount}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      disabled={pageNumber <= 1}
                      onClick={() => setPageNumber(1)}
                      title="First page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      disabled={pageNumber <= 1}
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm font-medium">
                      Page {pageNumber} of {totalPages}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      disabled={pageNumber >= totalPages}
                      onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      disabled={pageNumber >= totalPages}
                      onClick={() => setPageNumber(totalPages)}
                      title="Last page"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Show count even when only 1 page */}
              {totalPages <= 1 && totalCount > 0 && (
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {totalCount} item{totalCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Tabs>

      {/* Edit Menu Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingItem(null); }}>
        <DialogContent className="!w-[60vw] !max-w-[60vw] !max-h-[80vh] !flex !flex-col !gap-0 !p-0">
          <div className="shrink-0 border-b border-border px-8 py-5">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Menu Item</DialogTitle>
              <DialogDescription>Update menu item details.</DialogDescription>
            </DialogHeader>
          </div>

          <form
            id="edit-menu-item-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingItem || !editForm.name || !editForm.categoryId || !editForm.price || editForm.price <= 0) {
                toast.error('Please fill in name, category, and a valid price');
                return;
              }
              updateItemMutation.mutate({ id: editingItem.id, data: editForm });
            }}
            className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="editName" className="text-sm font-medium">Name *</Label>
                <Input
                  id="editName"
                  className="h-10"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category *</Label>
                <Select
                  value={editForm.categoryId || ''}
                  onValueChange={(value) => {
                    if (value === CREATE_CATEGORY_SENTINEL) {
                      setCreateCategoryDialogOpen(true);
                      return;
                    }
                    setEditForm({ ...editForm, categoryId: value });
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={CREATE_CATEGORY_SENTINEL} className="text-primary font-medium">
                      <Plus className="mr-1 h-4 w-4 inline" />
                      Add Category
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPrice" className="text-sm font-medium">Price *</Label>
                <Input
                  id="editPrice"
                  className="h-10"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price || ''}
                  onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription" className="text-sm font-medium">Description</Label>
              <Textarea
                id="editDescription"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="editPrepTime" className="text-sm font-medium">Prep Time (min)</Label>
                <Input
                  id="editPrepTime"
                  className="h-10"
                  type="number"
                  min="1"
                  value={editForm.preparationTime || ''}
                  onChange={(e) => setEditForm({ ...editForm, preparationTime: parseInt(e.target.value) || 15 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCuisine" className="text-sm font-medium">Cuisine</Label>
                <Input
                  id="editCuisine"
                  className="h-10"
                  value={editForm.cuisine || ''}
                  onChange={(e) => setEditForm({ ...editForm, cuisine: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="editIsVeg"
                  checked={editForm.isVeg ?? false}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, isVeg: checked })}
                />
                <Label htmlFor="editIsVeg">Vegetarian</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="editIsHalf"
                  checked={editForm.isHalf ?? false}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, isHalf: checked })}
                />
                <Label htmlFor="editIsHalf">Half Qty</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="editIsAvailable"
                  checked={editForm.isAvailable ?? true}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, isAvailable: checked })}
                />
                <Label htmlFor="editIsAvailable">Available</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex gap-2">
                <Input
                  className="h-10"
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
                <div className="flex flex-wrap gap-1.5 pt-1">
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
          </form>

          <div className="shrink-0 border-t border-border px-8 py-4">
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="edit-menu-item-form" disabled={updateItemMutation.isPending}>
                {updateItemMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Menu Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="!w-[60vw] !max-w-[60vw] !max-h-[80vh] !flex !flex-col !gap-0 !p-0">
          <div className="shrink-0 border-b border-border px-8 py-5">
            <DialogHeader>
              <DialogTitle className="text-xl">Add Menu Item</DialogTitle>
              <DialogDescription>Create a new item for your menu.</DialogDescription>
            </DialogHeader>
          </div>

          <form
            id="add-menu-item-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name || !form.categoryId || form.price <= 0) {
                toast.error('Please fill in name, category, and a valid price');
                return;
              }
              createItemMutation.mutate(form);
            }}
            className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                <Input
                  id="name"
                  className="h-10"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Butter Chicken"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => {
                    if (value === CREATE_CATEGORY_SENTINEL) {
                      setCreateCategoryDialogOpen(true);
                      return;
                    }
                    setForm({ ...form, categoryId: value });
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={CREATE_CATEGORY_SENTINEL} className="text-primary font-medium">
                      <Plus className="mr-1 h-4 w-4 inline" />
                      Add Category
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">Price *</Label>
                <Input
                  id="price"
                  className="h-10"
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
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the dish"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="prepTime" className="text-sm font-medium">Prep Time (min)</Label>
                <Input
                  id="prepTime"
                  className="h-10"
                  type="number"
                  min="1"
                  value={form.preparationTime}
                  onChange={(e) => setForm({ ...form, preparationTime: parseInt(e.target.value) || 15 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisine" className="text-sm font-medium">Cuisine</Label>
                <Input
                  id="cuisine"
                  className="h-10"
                  value={form.cuisine || ''}
                  onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                  placeholder="e.g. Indian"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="isVeg"
                  checked={form.isVeg}
                  onCheckedChange={(checked) => setForm({ ...form, isVeg: checked })}
                />
                <Label htmlFor="isVeg">Vegetarian</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="isHalf"
                  checked={form.isHalf}
                  onCheckedChange={(checked) => setForm({ ...form, isHalf: checked })}
                />
                <Label htmlFor="isHalf">Half Quantity</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex gap-2">
                <Input
                  className="h-10"
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
                <div className="flex flex-wrap gap-1.5 pt-1">
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
          </form>

          <div className="shrink-0 border-t border-border px-8 py-4">
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="add-menu-item-form" disabled={createItemMutation.isPending}>
                {createItemMutation.isPending ? 'Creating...' : 'Create Item'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <CategoryDialog
        open={createCategoryDialogOpen}
        onOpenChange={setCreateCategoryDialogOpen}
        existingCategories={categories}
        onCategoryCreated={(categoryId) => {
          if (addDialogOpen) {
            setForm((prev) => ({ ...prev, categoryId }));
          }
          if (editDialogOpen) {
            setEditForm((prev) => ({ ...prev, categoryId }));
          }
        }}
      />

      {/* Edit Category Dialog (from dropdown sentinel) */}
      <CategoryDialog
        open={editCategoryDialogOpen}
        onOpenChange={(open) => {
          setEditCategoryDialogOpen(open);
          if (!open) setEditingCategory(undefined);
        }}
        existingCategories={categories}
        onCategoryCreated={() => {}}
        category={editingCategory}
      />

      {/* Category Management List Dialog */}
      <CategoryListDialog
        open={categoryListDialogOpen}
        onOpenChange={setCategoryListDialogOpen}
      />
    </div>
  );
};
