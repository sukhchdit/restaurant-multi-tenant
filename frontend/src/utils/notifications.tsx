import {
  Check,
  CheckCheck,
  ShoppingBag,
  ChefHat,
  XCircle,
  Utensils,
  AlertTriangle,
  Users,
  CreditCard,
  CalendarClock,
  Settings,
} from 'lucide-react';

export const notificationTypeIcons: Record<string, React.ReactNode> = {
  'order-placed': <ShoppingBag className="h-5 w-5 text-blue-500" />,
  'kot-created': <ChefHat className="h-5 w-5 text-orange-500" />,
  'order-accepted': <Check className="h-5 w-5 text-green-500" />,
  'order-rejected': <XCircle className="h-5 w-5 text-red-500" />,
  'order-ready': <Utensils className="h-5 w-5 text-emerald-500" />,
  'order-delivered': <CheckCheck className="h-5 w-5 text-green-600" />,
  'low-stock': <AlertTriangle className="h-5 w-5 text-amber-500" />,
  'staff-update': <Users className="h-5 w-5 text-purple-500" />,
  'payment-received': <CreditCard className="h-5 w-5 text-teal-500" />,
  'new-reservation': <CalendarClock className="h-5 w-5 text-indigo-500" />,
  'system': <Settings className="h-5 w-5 text-gray-500" />,
};

export const notificationTypeIconsSm: Record<string, React.ReactNode> = {
  'order-placed': <ShoppingBag className="h-4 w-4 text-blue-500" />,
  'kot-created': <ChefHat className="h-4 w-4 text-orange-500" />,
  'order-accepted': <Check className="h-4 w-4 text-green-500" />,
  'order-rejected': <XCircle className="h-4 w-4 text-red-500" />,
  'order-ready': <Utensils className="h-4 w-4 text-emerald-500" />,
  'order-delivered': <CheckCheck className="h-4 w-4 text-green-600" />,
  'low-stock': <AlertTriangle className="h-4 w-4 text-amber-500" />,
  'staff-update': <Users className="h-4 w-4 text-purple-500" />,
  'payment-received': <CreditCard className="h-4 w-4 text-teal-500" />,
  'new-reservation': <CalendarClock className="h-4 w-4 text-indigo-500" />,
  'system': <Settings className="h-4 w-4 text-gray-500" />,
};

export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
