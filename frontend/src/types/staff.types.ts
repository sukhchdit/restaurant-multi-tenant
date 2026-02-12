export type StaffShift = 'morning' | 'evening' | 'night';
export type StaffStatus = 'active' | 'inactive' | 'on-leave';

export interface Staff {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  role: string;
  avatarUrl?: string;
  shift: StaffShift;
  status: StaffStatus;
  joinDate: string;
  salary?: number;
}

export interface Attendance {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'half-day' | 'leave';
  notes?: string;
}

export interface CreateStaffRequest {
  fullName: string;
  email?: string;
  phone: string;
  role: string;
  shift: StaffShift;
  joinDate: string;
  salary?: number;
}
