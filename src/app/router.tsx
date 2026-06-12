import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/features/auth/LoginPage';
import PortalLayout from '@/features/portal/PortalLayout';
import PortalLandingPage from '@/features/portal/LandingPage';
import PortalBookingPage from '@/features/portal/BookingPage';
import PortalCheckInPage from '@/features/portal/CheckInPage';
import PortalDigitalKeyPage from '@/features/portal/DigitalKeyPage';
import PortalReservationsPage from '@/features/portal/ReservationsPage';
import PortalRoomServicePage from '@/features/portal/RoomServicePage';
import ConciergeInboxPage from '@/features/concierge-inbox/page';
import RoomStatusLogPage from '@/features/room-status-log/page';
import SettingsPage from '@/features/settings/page';
import RateOverridesPage from '@/features/rate-overrides/page';
import RoomServiceOrdersPage from '@/features/room-service-orders/page';
import PortalConciergePage from '@/features/portal/ConciergePage';
import PortalBillingPage from '@/features/portal/BillingPage';
import PortalLoyaltyPage from '@/features/portal/LoyaltyPage';
import PortalChatPage from '@/features/portal/ChatPage';
import DashboardPage from '@/features/dashboard/page';
import TapeChartPage from '@/features/tape-chart/page';
import BookingsPage from '@/features/bookings/page';
import HousekeepingPage from '@/features/housekeeping/page';
import GuestsPage from '@/features/guests/page';
import ReportsPage from '@/features/reports/page';
import AboutPage from '@/features/about/page';
import ContactPage from '@/features/contact/page';
import AiPage from '@/features/ai/page';

// Each role's default landing page after login.
const ROLE_HOME: Record<string, string> = {
  admin: '/',
  manager: '/reports',
  receptionist: '/bookings',
  housekeeper: '/housekeeping',
};

// Pages each role is allowed to visit.
export const ROLE_PAGES: Record<string, string[]> = {
  admin: [
    '/',
    '/tape-chart',
    '/bookings',
    '/housekeeping',
    '/room-status-log',
    '/guests',
    '/reports',
    '/concierge-inbox',
    '/about',
    '/contact',
    '/settings',
    '/rate-overrides',
    '/room-service-orders',
    '/ai',
  ],
  manager: [
    '/',
    '/tape-chart',
    '/bookings',
    '/housekeeping',
    '/room-status-log',
    '/guests',
    '/reports',
    '/concierge-inbox',
    '/about',
    '/contact',
    '/rate-overrides',
    '/room-service-orders',
    '/ai',
  ],
  receptionist: [
    '/',
    '/tape-chart',
    '/bookings',
    '/concierge-inbox',
    '/room-service-orders',
    '/guests',
    '/about',
    '/contact',
    '/ai',
  ],
  housekeeper: ['/', '/housekeeping', '/room-status-log', '/about', '/contact'],
};

export function pageAllowed(role: string | undefined, path: string): boolean {
  if (!role) return false;
  const allowed = ROLE_PAGES[role] ?? [];
  if (allowed.includes('*')) return true;
  return allowed.includes(path);
}

function roles(...roles: string[]): string[] {
  return roles;
}

function RequireAuth() {
  const { user, hasHydrated } = useAuthStore();

  if (!hasHydrated) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

function RequireRole({ allow }: { allow?: string[] }) {
  const { user, hasHydrated } = useAuthStore();
  if (!hasHydrated) return null;
  if (!user?.roleName) return <Navigate to="/login" replace />;

  const roleName = user.roleName;

  if (allow && !allow.includes(roleName)) {
    const currentPath = window.location.pathname;
    const targetPath = ROLE_HOME[roleName] ?? '/';
    if (currentPath !== targetPath) {
      return <Navigate to={targetPath} replace />;
    }
  }

  return <Outlet />;
}

function RoleRedirect() {
  const { user, hasHydrated } = useAuthStore();
  if (!hasHydrated) return null;
  if (!user?.roleName) return <Navigate to="/login" replace />;

  const roleName = user.roleName;
  const targetPath = ROLE_HOME[roleName] ?? '/';
  const currentPath = window.location.pathname;

  if (currentPath !== targetPath) {
    return <Navigate to={targetPath} replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/portal',
    element: <PortalLayout />,
    children: [
      { index: true, element: <PortalLandingPage /> },
      { path: 'booking', element: <PortalBookingPage /> },
      { path: 'check-in', element: <PortalCheckInPage /> },
      { path: 'key', element: <PortalDigitalKeyPage /> },
      { path: 'reservations', element: <PortalReservationsPage /> },
      { path: 'room-service', element: <PortalRoomServicePage /> },
      { path: 'concierge', element: <PortalConciergePage /> },
      { path: 'billing', element: <PortalBillingPage /> },
      { path: 'loyalty', element: <PortalLoyaltyPage /> },
      { path: 'chat', element: <PortalChatPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <RequireRole />, children: [{ index: true, element: <DashboardPage /> }] },
          { path: '/about', element: <RequireRole />, children: [{ index: true, element: <AboutPage /> }] },
          { path: '/contact', element: <RequireRole />, children: [{ index: true, element: <ContactPage /> }] },
          { path: '/tape-chart', element: <RequireRole allow={roles('admin', 'manager', 'receptionist')} />, children: [{ index: true, element: <TapeChartPage /> }] },
          { path: '/bookings', element: <RequireRole allow={roles('admin', 'manager', 'receptionist')} />, children: [{ index: true, element: <BookingsPage /> }] },
          { path: '/guests', element: <RequireRole allow={roles('admin', 'manager', 'receptionist')} />, children: [{ index: true, element: <GuestsPage /> }] },
          { path: '/housekeeping', element: <RequireRole allow={roles('admin', 'manager', 'housekeeper')} />, children: [{ index: true, element: <HousekeepingPage /> }] },
          { path: '/reports', element: <RequireRole allow={roles('admin', 'manager')} />, children: [{ index: true, element: <ReportsPage /> }] },
          { path: '/concierge-inbox', element: <RequireRole allow={roles('admin', 'manager', 'receptionist')} />, children: [{ index: true, element: <ConciergeInboxPage /> }] },
          { path: '/settings', element: <RequireRole allow={roles('admin')} />, children: [{ index: true, element: <SettingsPage /> }] },
          { path: '/room-status-log', element: <RequireRole allow={roles('admin', 'manager', 'housekeeper')} />, children: [{ index: true, element: <RoomStatusLogPage /> }] },
          { path: '/rate-overrides', element: <RequireRole allow={roles('admin', 'manager')} />, children: [{ index: true, element: <RateOverridesPage /> }] },
          { path: '/room-service-orders', element: <RequireRole allow={roles('admin', 'manager', 'receptionist')} />, children: [{ index: true, element: <RoomServiceOrdersPage /> }] },
          { path: '/ai', element: <RequireRole allow={roles('admin', 'manager', 'receptionist')} />, children: [{ index: true, element: <AiPage /> }] },
        ],
      },
    ],
  },
  { path: '*', element: <RoleRedirect /> },
]);
