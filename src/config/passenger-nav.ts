import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";

export const passengerNav: DashboardNavItem[] = [
  { label: "Home", href: "/passenger", icon: "Home", exact: true },
  { label: "Ride", href: "/passenger/book", icon: "Bike" },
  { label: "History", href: "/passenger/history", icon: "Clock" },
  { label: "Wallet", href: "/passenger/wallet", icon: "Wallet" },
  { label: "Alerts", href: "/passenger/notifications", icon: "Bell" },
  { label: "Support", href: "/passenger/support", icon: "LifeBuoy" },
];

export const passengerMobileNav: DashboardNavItem[] = [
  passengerNav[0],
  passengerNav[1],
  passengerNav[2],
  passengerNav[3],
  passengerNav[4],
];
