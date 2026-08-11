import Link from "next/link";
import { Compass } from "lucide-react";
import { SiteNavbar } from "@/components/site/navbar";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";

export default function NotFound() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="size-8" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-primary">
            404
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Looks like you&apos;ve taken a wrong turn.
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have moved.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/">Back Home</Link>
          </Button>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
