import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BedDouble,
  CalendarCheck,
  Car,
  Coffee,
  CreditCard,
  Gift,
  Hotel,
  KeyRound,
  LogIn,
  MessageCircle,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { HotelSlideshow } from '@/components/common/HotelSlideshow';
import { StaySyncLogo } from '@/components/common/StaySyncLogo';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/portal',             label: 'Home',         Icon: Hotel,         end: true },
  { to: '/portal/booking',     label: 'Booking',      Icon: BedDouble },
  { to: '/portal/check-in',    label: 'Check-in',     Icon: UserCheck },
  { to: '/portal/key',         label: 'Digital Key',  Icon: KeyRound },
  { to: '/portal/reservations',label: 'Reservations', Icon: CalendarCheck },
  { to: '/portal/room-service',label: 'Room Service', Icon: Coffee },
  { to: '/portal/concierge',   label: 'Concierge',    Icon: Car },
  { to: '/portal/billing',     label: 'Billing',      Icon: CreditCard },
  { to: '/portal/loyalty',     label: 'Loyalty',      Icon: Gift },
  { to: '/portal/chat',        label: 'AI Concierge', Icon: MessageCircle },
];

export default function PortalLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/portal' || location.pathname === '/portal/';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="fixed inset-0">
        <HotelSlideshow interval={8000} showLabel={isLanding} overlay />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,19,38,0.62),rgba(9,42,73,0.46),rgba(13,86,114,0.32))]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/portal" className="flex items-center gap-2">
            <StaySyncLogo size="sm" />
          </Link>
          <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-cyan-50/75 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/login"
            className="ml-auto flex h-9 items-center gap-1.5 rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
          >
            <LogIn className="h-3.5 w-3.5" />
            Staff sign in
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] font-medium',
                  isActive
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-white/5 text-cyan-50/75',
                )
              }
            >
              <Icon className="h-3 w-3" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="relative z-10 mt-12 border-t border-white/10 bg-slate-950/55 py-8 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
          <p className="text-xs text-cyan-100/60">
            © {new Date().getFullYear()} StaySync Hotels. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-cyan-100/60">
            <Sparkles className="h-3 w-3" /> Smart hospitality, beautifully delivered.
          </p>
        </div>
      </footer>
    </div>
  );
}
