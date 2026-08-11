"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { LogoutMenuItem } from "@/components/site/logout-button";
import { mainNav } from "@/config/site";
import { roleHome } from "@/lib/auth/role-home";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/supabase/get-current-user";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function SiteNavbar({ user = null }: { user?: CurrentUser | null }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors",
        scrolled
          ? "border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70"
          : "border-transparent bg-background/60 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="JhapaRide home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 rounded-full pl-2 pr-3">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {initials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-28 truncate text-sm font-medium">{user.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={roleHome[user.role]}>
                    <LayoutDashboard className="size-4" />
                    Dashboard
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
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/passenger/book">Book a Ride</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[360px]">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4" aria-label="Mobile">
              {mainNav.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-accent"
                  >
                    {item.title}
                  </Link>
                </SheetClose>
              ))}
              {user ? (
                <SheetClose asChild>
                  <Link
                    href="/profile"
                    className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-accent"
                  >
                    Profile
                  </Link>
                </SheetClose>
              ) : null}
            </nav>
            <div className="mt-4 flex flex-col gap-2 px-4">
              {user ? (
                <SheetClose asChild>
                  <Button asChild>
                    <Link href={roleHome[user.role]}>Dashboard</Link>
                  </Button>
                </SheetClose>
              ) : (
                <>
                  <SheetClose asChild>
                    <Button variant="outline" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild>
                      <Link href="/passenger/book">Book a Ride</Link>
                    </Button>
                  </SheetClose>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
