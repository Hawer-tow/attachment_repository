import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { useAiStore } from '@/app/store/aiStore';
import { HotelSlideshow } from '@/components/common/HotelSlideshow';
import { StaySyncLogo } from '@/components/common/StaySyncLogo';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuthStore();
  const { setRole } = useAiStore();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('admin@staysync.test');
  const [password, setPassword] = useState('password');
  const [error, setError]       = useState('');

  // ✅ After authentication, store role and redirect
  useEffect(() => {
    if (isAuthenticated && user?.roleName) {
      setRole(user.roleName);

      const currentPath = window.location.pathname;
      let targetPath = '/';

      switch (user.roleName) {
        case 'housekeeping':
          targetPath = '/housekeeping';
          break;
        case 'manager':
          targetPath = '/reports';
          break;
        case 'receptionist':
          targetPath = '/frontdesk';
          break;
        case 'admin':
          targetPath = '/ai'; // ✅ admin goes to AI dashboard
          break;
        default:
          targetPath = '/';
      }

      if (currentPath !== targetPath) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [isAuthenticated, user?.roleName, setRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-3/5 relative">
        <HotelSlideshow interval={4000} showLabel={true} overlay={true} />
        <div className="absolute top-8 left-8 z-20"><StaySyncLogo size="md" /></div>
        <div className="absolute bottom-12 left-8 right-8 z-20">
          <h2 className="text-white text-3xl font-bold leading-tight drop-shadow-lg">
            Manage your hotel<br />smarter & faster.
          </h2>
          <p className="text-white/70 text-sm mt-2">Real-time front desk operations, all in one place.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <StaySyncLogo
              size="lg"
              textClassName="text-center [&_p:first-child]:text-foreground [&_p:last-child]:text-muted-foreground"
            />
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to your dashboard</p>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" htmlFor="email">Email</label>
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  autoComplete="email"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" htmlFor="password">Password</label>
                <input
                  id="password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  autoComplete="current-password"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit" disabled={isLoading}
                className="w-full h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Demo accounts: admin / manager / receptionist / housekeeper<br />
              <span className="opacity-70">password: "password" for all</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
