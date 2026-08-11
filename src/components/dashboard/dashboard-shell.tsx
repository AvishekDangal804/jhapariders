"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bike,
  Car,
  Clock,
  CreditCard,
  FileClock,
  Home,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  ShieldCheck,
  Star,
  User as UserIcon,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutMenuItem } from "@/components/site/logout-button";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/supabase/get-current-user";

// Nav configs (config/passenger-nav.ts etc.) are plain data defined in
// server-renderable modules and passed down through a Server Component
// layout — they can only hold serializable values, never a component
// reference. Icons are looked up by name in this client-only registry
// instead, which keeps the boundary crossing to plain strings.
const ICONS = {
  Bell,
  Bike,
  Car,
  Clock,
  CreditCard,
  FileClock,
  Home,
  MapPin,
  Package,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Wallet,
} as const;
export type DashboardIconName = keyof typeof ICONS;

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: DashboardIconName;
  exact?: boolean;
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function DashboardShell({
  user,
  navItems,
  mobileNavItems,
  headerRight,
  children,
}: {
  user: CurrentUser;
  navItems: DashboardNavItem[];
  mobileNavItems?: DashboardNavItem[];
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bottomItems = (mobileNavItems ?? navItems).slice(0, 5);

  const isActive = (item: DashboardNavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="flex min-h-svh bg-secondary/20">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background lg:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Link href="/" aria-label="JhapaRide home">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Dashboard">
          {navItems.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <UserMenu user={user} />
        </div>
      </aside>

      <div className="flex min-h-svh flex-1 flex-col">
        {/* Mobile / shared top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:justify-end lg:px-6">
          <Link href="/" className="lg:hidden" aria-label="JhapaRide home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            {headerRight}
            <span className="lg:hidden">
              <UserMenu user={user} compact />
            </span>
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0">{children}</main>

        {/* Mobile bottom nav */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 grid border-t bg-background/95 backdrop-blur lg:hidden"
          style={{ gridTemplateColumns: `repeat(${bottomItems.length}, minmax(0, 1fr))` }}
          aria-label="Dashboard"
        >
          {bottomItems.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function UserMenu({ user, compact = false }: { user: CurrentUser; compact?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2 rounded-lg p-1.5 text-left hover:bg-accent",
            compact && "w-auto"
          )}
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs text-primary">
              {initials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          {!compact ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.fullName}</span>
              <Badge variant="secondary" className="mt-0.5 h-4 px-1.5 text-[10px] capitalize">
                {user.role}
              </Badge>
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} className="w-48">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">
            <LayoutDashboard className="size-4" />
            Public Site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <LogoutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
