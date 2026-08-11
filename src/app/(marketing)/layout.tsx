import { SiteNavbar } from "@/components/site/navbar";
import { SiteFooter } from "@/components/site/footer";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <>
      <SiteNavbar user={user} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
