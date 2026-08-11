import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/shared/container";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col bg-secondary/30">
      <div className="py-6">
        <Container className="flex justify-center">
          <Link href="/" aria-label="JhapaRide home">
            <Logo />
          </Link>
        </Container>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
