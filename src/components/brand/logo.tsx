import { cn } from "@/lib/utils";

// Original JhapaRide mark: a rounded route-pin motif built from a single
// stroke, evoking a ride route arriving at a destination pin. No third-party
// assets or existing ride-hailing branding referenced.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M9 21c0-4.5 2.8-6.2 5.6-9C17 9.6 17.6 8 16 8c-1.8 0-2.6 2-1.2 3.4"
        stroke="var(--primary-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="21.5" cy="20.5" r="3.5" stroke="var(--primary-foreground)" strokeWidth="2" />
      <path
        d="M9 21h3.2"
        stroke="var(--primary-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark className={iconClassName} />
      <span className="text-lg leading-none">
        Jhapa<span className="text-primary">Ride</span>
      </span>
    </span>
  );
}
