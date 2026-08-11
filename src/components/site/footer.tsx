import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { footerNav, siteConfig } from "@/config/site";

const columns = [
  { title: "Company", links: footerNav.company },
  { title: "Services", links: footerNav.services },
  { title: "Support", links: footerNav.support },
  { title: "Legal", links: footerNav.legal },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {siteConfig.description} Proudly built for {siteConfig.region}.
            </p>
            <div className="mt-4 flex items-center gap-3 text-muted-foreground">
              {["FB", "IG", "YT"].map((label) => (
                <span
                  key={label}
                  aria-label={`Social media placeholder: ${label}`}
                  className="flex size-8 items-center justify-center rounded-full border text-[10px] font-semibold hover:text-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p>Made for {siteConfig.region}.</p>
        </div>
      </div>
    </footer>
  );
}
