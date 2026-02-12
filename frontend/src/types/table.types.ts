export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  qrCodeUrl?: string;
  floorNumber: number;
  section?: string;
  positionX: number;
  positionY: number;
  isActive: boolean;
}

export interface TableReservation {
  id: string;
  tableId: string;
  customerName: string;
  customerPhone?: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  duration: number;
  status: string;
  notes?: string;
}

export interface CreateTableRequest {
  tableNumber: string;
  capacity: number;
  floorNumber?: number;
  section?: string;
  positionX?: number;
  positionY?: number;
}
