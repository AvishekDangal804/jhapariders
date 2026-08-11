import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={cn("border-b bg-secondary/30 py-14 sm:py-20", className)}>
      <Container className="max-w-3xl text-center">
        {eyebrow ? (
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 text-base text-muted-foreground text-pretty sm:text-lg">
            {description}
          </p>
        ) : null}
      </Container>
    </section>
  );
}
