import { Bike, Star } from "lucide-react";

// Original, CSS/SVG-only illustration — no third-party map tiles or
// copyrighted assets. Represents a stylized Jhapa route: pickup pin,
// dotted route, a bike marker, and a destination pin, with floating
// info chips reminiscent of a live ride screen.
export function HeroIllustration() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md sm:aspect-square">
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] border bg-gradient-to-br from-emerald-50 via-white to-emerald-100 shadow-2xl dark:from-emerald-950 dark:via-background dark:to-emerald-900">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full opacity-40"
          aria-hidden="true"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i * 10}
              x2="100"
              y2={i * 10}
              stroke="currentColor"
              strokeWidth="0.2"
              className="text-primary"
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 10}
              y1="0"
              x2={i * 10}
              y2="100"
              stroke="currentColor"
              strokeWidth="0.2"
              className="text-primary"
            />
          ))}
        </svg>

        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d="M 20 78 C 35 78, 30 55, 45 52 C 60 49, 58 28, 78 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="0.5 6"
            className="text-primary"
          />
          <circle cx="20" cy="78" r="2.4" className="fill-primary" />
          <circle cx="78" cy="22" r="2.4" className="fill-destructive" />
        </svg>

        <div className="absolute" style={{ left: "44%", top: "50%" }}>
          <div className="flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
            <Bike className="size-4.5" />
          </div>
        </div>

        <div className="absolute left-[10%] top-[68%] rounded-full bg-background px-3 py-1 text-xs font-medium shadow-md">
          Pickup
        </div>
        <div className="absolute right-[6%] top-[12%] rounded-full bg-background px-3 py-1 text-xs font-medium shadow-md">
          Destination
        </div>

        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              SR
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Sagar Rai</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                4.9 &middot; Bike
              </p>
            </div>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            3 min away
          </span>
        </div>
      </div>
    </div>
  );
}
