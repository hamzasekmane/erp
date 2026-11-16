// app/actions/logout.ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiBaseUrl } from "@/app/lib/apiBase";
import { clearSession, REFRESH_COOKIE } from "@/app/lib/session";

/**
 * Signs out.
 *
 * Order matters. The refresh token must be revoked AT THE API before the cookie
 * is thrown away, otherwise the session row stays usable until it expires —
 * deleting a cookie only forgets it in this browser, it does not end the
 * session. A stolen copy of that token would keep working for up to 30 days.
 *
 * The local cookies are cleared even if the API call fails: a user who clicks
 * "log out" must end up logged out of this browser regardless of the network.
 */
export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (token || refreshToken) {
    try {
      await fetch(`${apiBaseUrl()}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
        cache: "no-store",
        // Do not let a hung API keep the user on the page.
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Best effort: the cookies below still end the local session.
    }
  }

  await clearSession();
  redirect("/login");
}
