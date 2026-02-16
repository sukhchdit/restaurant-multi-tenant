import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '@/services/api/menuApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import type { Category } from '@/types/menu.types';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated: (categoryId: string) => void;
  category?: Category;
  existingCategories?: Category[];
}

export const CategoryDialog = ({
  open,
  onOpenChange,
  onCategoryCreated,
  category,
  existingCategories = [],
}: CategoryDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();
  const isEdit = !!category;

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
      setDescription(category?.description ?? '');
    }
  }, [open, category]);

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      menuApi.createCategory(data),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
      toast.success(`Category "${name}" created`);
      const newCategoryId = response.data?.id;
      if (newCategoryId) {
        onCategoryCreated(newCategoryId);
      }
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to create category');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      menuApi.updateCategory(category!.id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
      await queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success(`Category "${name}" updated`);
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to update category');
    },
  });

  const isPending = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  const isDuplicateName = (trimmed: string) => {
    return existingCategories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== category?.id
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Category name is required');
      return;
    }
    if (isDuplicateName(trimmed)) {
      toast.error(`A category named "${trimmed}" already exists`);
      return;
    }
    const data = { name: trimmed, description: description.trim() || undefined };
    if (isEdit) {
      updateCategoryMutation.mutate(data);
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the category details.' : 'Create a new menu category.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Name *</Label>
            <Input
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Appetizers"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryDescription">Description</Label>
            <Textarea
              id="categoryDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/** @deprecated Use CategoryDialog instead */
export const CreateCategoryDialog = CategoryDialog;
