import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { menuApi } from '@/services/api/menuApi';
import { orderApi } from '@/services/api/orderApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ShoppingCart, Plus, Minus, Clock, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import type { MenuItem } from '@/types/menu.types';

export const CustomerApp = () => {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Use the public menu API - passing a default restaurant ID from URL or config
  const { data: menuResponse, isLoading } = useQuery({
    queryKey: ['publicMenu', searchTerm],
    queryFn: () => menuApi.getItems({ search: searchTerm || undefined, isAvailable: true, pageSize: 200 }),
  });

  const placeOrderMutation = useMutation({
    mutationFn: () => {
      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity,
      }));
      return orderApi.createOrder({
        orderType: 'online',
        items,
        customerName: 'Guest Customer',
      });
    },
    onSuccess: () => {
      toast.success('Order placed successfully!');
      setCart({});
    },
    onError: () => {
      toast.error('Failed to place order');
    },
  });

  const menu = (menuResponse?.data ?? []).filter((item) => item.isAvailable);
  const categories = Array.from(new Set(menu.map((item) => item.categoryName).filter(Boolean))) as string[];

  const filterMenu = (category?: string) => {
    let filtered = menu;

    if (category) {
      filtered = filtered.filter((item) => item.categoryName === category);
    }

    return filtered;
  };

  const addToCart = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    toast.success('Added to cart');
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const cartItems = Object.entries(cart)
    .map(([itemId, quantity]) => ({
      item: menu.find((m) => m.id === itemId),
      quantity,
    }))
    .filter((ci): ci is { item: MenuItem; quantity: number } => ci.item !== undefined);

  const cartTotal = cartItems.reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );

  const renderMenuItem = (item: MenuItem) => (
    <Card key={item.id} className="transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  {item.isVeg && (
                    <Leaf className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-lg font-bold text-primary">
                  ${item.price.toFixed(2)}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{item.preparationTime} mins</span>
                </div>
              </div>

              {cart[item.id] ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">
                    {cart[item.id]}
                  </span>
                  <Button
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => addToCart(item.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button onClick={() => addToCart(item.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Spice Paradise</h1>
            <p className="text-xs text-muted-foreground">Order Online</p>
          </div>
          <Button variant="outline" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartItems.length > 0 && (
              <Badge className="absolute -right-2 -top-2 h-5 w-5 p-0 flex items-center justify-center">
                {cartItems.length}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              /* Categories */
              <Tabs defaultValue="all">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-6">
                  {filterMenu().map(renderMenuItem)}
                </TabsContent>

                {categories.map((category) => (
                  <TabsContent key={category} value={category} className="space-y-4 mt-6">
                    {filterMenu(category).map(renderMenuItem)}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          {/* Cart Section */}
          <div className="lg:sticky lg:top-20 lg:h-fit">
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Your Cart</h2>

                {cartItems.length > 0 ? (
                  <div className="space-y-4">
                    {cartItems.map(({ item, quantity }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b border-border pb-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} x {quantity}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ${(item.price * quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}

                    <div className="space-y-2 border-t border-border pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (12%)</span>
                        <span>${(cartTotal * 0.12).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">
                          ${(cartTotal * 1.12).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => placeOrderMutation.mutate()}
                      disabled={placeOrderMutation.isPending}
                    >
                      {placeOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                    </Button>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Your cart is empty</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
