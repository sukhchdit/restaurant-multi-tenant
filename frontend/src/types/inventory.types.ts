export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPerUnit: number;
  supplierId?: string;
  supplierName?: string;
  lastRestockedAt?: string;
  expiryDate?: string;
  storageLocation?: string;
  sku?: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  movementType: 'inward' | 'outward' | 'adjustment' | 'wastage' | 'order-deduction';
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

export interface DishIngredient {
  id: string;
  menuItemId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantityRequired: number;
  unit: string;
  isOptional: boolean;
}
