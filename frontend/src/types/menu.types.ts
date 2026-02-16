export interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  imageUrl?: string;
  isActive: boolean;
  parentCategoryId?: string;
  subCategories?: Category[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description?: string;
  cuisine?: string;
  price: number;
  discountedPrice?: number;
  isVeg: boolean;
  isHalf: boolean;
  isAvailable: boolean;
  preparationTime: number;
  imageUrl?: string;
  calorieCount?: number;
  spiceLevel?: number;
  tags: string[];
  ingredients?: string[];
  addons?: MenuItemAddon[];
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface CreateMenuItemRequest {
  categoryId: string;
  name: string;
  description?: string;
  cuisine?: string;
  price: number;
  isVeg: boolean;
  isHalf: boolean;
  preparationTime: number;
  tags?: string[];
}

export interface UpdateMenuItemRequest extends Partial<CreateMenuItemRequest> {
  isAvailable?: boolean;
  discountedPrice?: number;
}
