import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '@/services/api/staffApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Plus, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { Staff, StaffShift, CreateStaffRequest } from '@/types/staff.types';

const shiftColors: Record<StaffShift, string> = {
  morning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  evening: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  night: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const emptyStaffForm: CreateStaffRequest = {
  fullName: '',
  email: '',
  phone: '',
  role: 'waiter',
  shift: 'morning',
  joinDate: new Date().toISOString().split('T')[0],
};

export const StaffManagement = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffForm, setStaffForm] = useState<CreateStaffRequest>({ ...emptyStaffForm });
  const queryClient = useQueryClient();

  const pageShortcuts = useMemo(() => ({
    'n': () => setAddDialogOpen(true),
  }), []);

  useKeyboardShortcuts(pageShortcuts);

  const { data: staffResponse, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getStaff(),
  });

  const createStaffMutation = useMutation({
    mutationFn: (data: CreateStaffRequest) => staffApi.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member added');
      setAddDialogOpen(false);
      setStaffForm({ ...emptyStaffForm });
    },
    onError: () => {
      toast.error('Failed to add staff member');
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateStaffRequest }) =>
      staffApi.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member updated');
      setEditDialogOpen(false);
      setEditingStaff(null);
    },
    onError: () => {
      toast.error('Failed to update staff member');
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => staffApi.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member removed');
    },
    onError: () => {
      toast.error('Failed to remove staff member');
    },
  });

  const openEditDialog = (member: Staff) => {
    setEditingStaff(member);
    setStaffForm({
      fullName: member.fullName,
      email: member.email || '',
      phone: member.phone,
      role: member.role,
      shift: member.shift,
      joinDate: member.joinDate,
      salary: member.salary,
    });
    setEditDialogOpen(true);
  };

  const staff = staffResponse?.data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-52" />
            <Skeleton className="mt-2 h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage your restaurant team</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Staff</p>
            <p className="text-3xl font-bold">{staff.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {staff.filter((s) => s.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Morning Shift</p>
            <p className="text-3xl font-bold">
              {staff.filter((s) => s.shift === 'morning').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Evening Shift</p>
            <p className="text-3xl font-bold">
              {staff.filter((s) => s.shift === 'evening').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <Card key={member.id} className="border border-primary/20 bg-primary/[0.03] transition-all hover:border-primary/40 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                    <AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{member.fullName}</h3>
                      <Badge
                        variant={member.status === 'active' ? 'default' : 'secondary'}
                      >
                        {member.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <Badge className={shiftColors[member.shift]} variant="secondary">
                      {member.shift} shift
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {member.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{member.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-border pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(member)}
                  >
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Schedule
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteStaffMutation.mutate(member.id)}
                    disabled={deleteStaffMutation.isPending}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingStaff(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update staff member details.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingStaff || !staffForm.fullName || !staffForm.phone) {
                toast.error('Please fill in name and phone number');
                return;
              }
              updateStaffMutation.mutate({ id: editingStaff.id, data: staffForm });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="editFullName">Full Name *</Label>
              <Input
                id="editFullName"
                value={staffForm.fullName}
                onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={staffForm.email || ''}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone *</Label>
                <Input
                  id="editPhone"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={staffForm.role}
                  onValueChange={(value) => setStaffForm({ ...staffForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="chef">Chef</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shift *</Label>
                <Select
                  value={staffForm.shift}
                  onValueChange={(value) => setStaffForm({ ...staffForm, shift: value as StaffShift })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editJoinDate">Join Date</Label>
                <Input
                  id="editJoinDate"
                  type="date"
                  value={staffForm.joinDate}
                  onChange={(e) => setStaffForm({ ...staffForm, joinDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSalary">Salary</Label>
                <Input
                  id="editSalary"
                  type="number"
                  min="0"
                  value={staffForm.salary || ''}
                  onChange={(e) => setStaffForm({ ...staffForm, salary: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateStaffMutation.isPending}>
                {updateStaffMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>Add a new member to your restaurant team.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!staffForm.fullName || !staffForm.phone) {
                toast.error('Please fill in name and phone number');
                return;
              }
              createStaffMutation.mutate(staffForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={staffForm.fullName}
                onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={staffForm.email || ''}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  placeholder="+91-9999999999"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={staffForm.role}
                  onValueChange={(value) => setStaffForm({ ...staffForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="chef">Chef</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shift *</Label>
                <Select
                  value={staffForm.shift}
                  onValueChange={(value) => setStaffForm({ ...staffForm, shift: value as StaffShift })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={staffForm.joinDate}
                  onChange={(e) => setStaffForm({ ...staffForm, joinDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  value={staffForm.salary || ''}
                  onChange={(e) => setStaffForm({ ...staffForm, salary: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createStaffMutation.isPending}>
                {createStaffMutation.isPending ? 'Adding...' : 'Add Staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
