"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { SiteNavbar } from "@/components/site/navbar";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlert className="size-8" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-destructive">
            Something went wrong
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            We hit a bump in the road.
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            An unexpected error occurred. You can try again, or head back to the homepage.
          </p>
          <div className="mt-8 flex gap-3">
            <Button size="lg" onClick={() => reset()}>
              Try Again
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/">Back Home</Link>
            </Button>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
