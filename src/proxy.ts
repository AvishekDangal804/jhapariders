import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { roleHome } from "@/lib/auth/role-home";
import type { UserRole, UserStatus } from "@/types";

const roleScopedPrefixes: { prefix: string; role: UserRole }[] = [
  { prefix: "/passenger", role: "passenger" },
  { prefix: "/rider", role: "rider" },
  { prefix: "/admin", role: "admin" },
];
const protectedPrefixes = [...roleScopedPrefixes.map((r) => r.prefix), "/profile"];
const authPages = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isProtected && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle<{ role: UserRole; status: UserStatus }>();

    if (profile?.status === "suspended" || profile?.status === "deleted") {
      await supabase.auth.signOut();
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("suspended", "1");
      return NextResponse.redirect(redirectUrl);
    }

    const roleScoped = roleScopedPrefixes.find((r) => pathname.startsWith(r.prefix));
    if (roleScoped && profile && profile.role !== roleScoped.role) {
      return NextResponse.redirect(new URL(roleHome[profile.role], request.url));
    }
  }

  const isAuthPage = authPages.some((page) => pathname.startsWith(page));
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};