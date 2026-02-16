import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '@/services/api/menuApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryDialog } from '@/components/CreateCategoryDialog';
import { Pencil, Trash2, Plus, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '@/types/menu.types';

interface CategoryListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CategoryListDialog = ({ open, onOpenChange }: CategoryListDialogProps) => {
  const [editCategory, setEditCategory] = useState<Category | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ['menuCategories'],
    queryFn: () => menuApi.getCategories(),
    enabled: open,
  });

  const { data: menuResponse } = useQuery({
    queryKey: ['menu', ''],
    queryFn: () => menuApi.getItems({ pageSize: 200 }),
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Category deleted');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete category';
      toast.error(message);
    },
  });

  const categories = categoriesResponse?.data ?? [];
  const menuItems = menuResponse?.data?.items ?? [];

  const getItemCount = (categoryName: string) =>
    menuItems.filter((item) => item.categoryName === categoryName).length;

  const handleDelete = (cat: Category) => {
    const count = getItemCount(cat.name);
    if (count > 0) {
      toast.error(`Cannot delete "${cat.name}" — it has ${count} menu item${count > 1 ? 's' : ''}. Remove or reassign them first.`);
      return;
    }
    if (confirm(`Delete category "${cat.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(cat.id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>View, edit, or delete menu categories.</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FolderOpen className="h-10 w-10 mb-2" />
                <p className="font-medium">No categories yet</p>
                <p className="text-sm">Create your first category to get started.</p>
              </div>
            ) : (
              categories.map((cat) => {
                const count = getItemCount(cat.name);
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{cat.name}</p>
                        {cat.description && (
                          <p className="text-sm text-muted-foreground truncate">{cat.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {count} item{count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditCategory(cat);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CategoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        existingCategories={categories}
        onCategoryCreated={() => {}}
      />

      <CategoryDialog
        open={editDialogOpen}
        onOpenChange={(o) => {
          setEditDialogOpen(o);
          if (!o) setEditCategory(undefined);
        }}
        existingCategories={categories}
        onCategoryCreated={() => {}}
        category={editCategory}
      />
    </>
  );
};
