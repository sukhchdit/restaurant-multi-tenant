import { useNavigate } from 'react-router';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Table as TableIcon,
  ChefHat,
  Package,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Percent,
  UserCircle,
  Receipt,
  BookOpen,
  ClipboardList,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, shortcut: 'G then D' },
  { name: 'Menu', path: '/menu', icon: UtensilsCrossed, shortcut: 'G then M' },
  { name: 'Orders', path: '/orders', icon: ShoppingCart, shortcut: 'G then O' },
  { name: 'Tables', path: '/tables', icon: TableIcon, shortcut: 'G then T' },
  { name: 'Kitchen', path: '/kitchen', icon: ChefHat, shortcut: 'G then K' },
  { name: 'Inventory', path: '/inventory', icon: Package, shortcut: 'G then I' },
  { name: 'Staff', path: '/staff', icon: Users, shortcut: 'G then S' },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Discounts', path: '/discounts', icon: Percent },
  { name: 'Customers', path: '/customers', icon: UserCircle },
  { name: 'Billing', path: '/billing', icon: Receipt },
  { name: 'Accounts', path: '/accounts', icon: BookOpen },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const navigate = useNavigate();

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a page name to navigate..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.path}
              value={item.name}
              onSelect={() => handleSelect(item.path)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
