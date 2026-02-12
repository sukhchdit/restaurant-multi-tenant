import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { login } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

const demoAccounts = [
  { email: 'admin@restaurant.com', role: 'Super Admin' },
];

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await dispatch(login({ email, password })).unwrap();
      toast.success('Login successful!');
      // Use full page navigation to ensure Redux reinitializes from localStorage
      window.location.href = '/';
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Login failed. Please try again.');
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin@123');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Side - Branding */}
          <div className="flex flex-col justify-center space-y-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-12 text-primary-foreground shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <ChefHat className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Spice Paradise</h1>
                <p className="text-primary-foreground/80">Restaurant Management</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <h3 className="mb-2 font-semibold">Multi-Tenant Platform</h3>
                <p className="text-sm text-primary-foreground/80">
                  Manage multiple restaurants with role-based access control
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <h3 className="mb-2 font-semibold">Real-Time Operations</h3>
                <p className="text-sm text-primary-foreground/80">
                  Live order tracking, KOT management, and inventory updates
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <h3 className="mb-2 font-semibold">Complete Solution</h3>
                <p className="text-sm text-primary-foreground/80">
                  Menu, orders, tables, kitchen, inventory, staff & reports - all in one
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to access your restaurant dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Quick Demo Access
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {demoAccounts.map((account) => (
                      <Button
                        key={account.email}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDemoLogin(account.email)}
                        className="w-full justify-start"
                      >
                        <span className="capitalize">
                          {account.role}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {account.email}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Demo password: <span className="font-mono">Admin@123</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
