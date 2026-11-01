import { accessTtlToMs, refreshTtlToMs } from "@/lib/auth/jwt";

export const ACCESS_COOKIE = "mahum_access_token";
export const REFRESH_COOKIE = "mahum_refresh_token";

const isProd = process.env.NODE_ENV === "production";

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
};

export interface CookieWriter {
  set(name: string, value: string, options?: CookieOptions): void;
}

export function setAuthCookies(
  cookies: CookieWriter,
  tokens: { accessToken: string; refreshToken: string },
) {
  cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(accessTtlToMs() / 1000),
  });
  cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(refreshTtlToMs() / 1000),
  });
}

export function clearAuthCookies(cookies: CookieWriter) {
  cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
}
