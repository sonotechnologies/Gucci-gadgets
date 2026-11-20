import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects every /admin route except /admin/login. Refreshes the Supabase
 * session cookie on each request. In demo mode (no Supabase env vars) admin
 * is open but read-only — server actions refuse to write.
 */
export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = req.nextUrl.pathname === "/admin/login";
  if (!user && !isLogin) {
    const to = req.nextUrl.clone();
    to.pathname = "/admin/login";
    to.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(to);
  }
  if (user && isLogin) {
    const to = req.nextUrl.clone();
    to.pathname = "/admin";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
