/** Where a member chooses a password: after an invite, a reset, or by choice. */
export const PASSWORD_PATH = "/sign-in/password";

/** A destination is navigation only; permission is checked at the data boundary. */
export function safeDestination(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/u.test(value)
  )
    return null;
  try {
    const url = new URL(value, "https://peregrine.invalid");
    const path = decodeURIComponent(url.pathname);
    if (
      url.origin !== "https://peregrine.invalid" ||
      /[\\\u0000-\u0020\u007f]/u.test(path) ||
      /%2f|%5c|%2e/iu.test(url.pathname) ||
      /%[0-9a-f]{2}/iu.test(path)
    )
      return null;
    return path === PASSWORD_PATH ||
      ["/owner", "/console"].some(
        (root) => path === root || path.startsWith(root + "/"),
      )
      ? url.pathname + url.search
      : null;
  } catch {
    return null;
  }
}
export function defaultDestination(requested: unknown, owner: boolean): string {
  return safeDestination(requested) ?? (owner ? "/owner" : "/console");
}
/** The selected project changes sign-in only, never authorization. */
export function authProject(
  next: unknown,
  project?: unknown,
): "booking" | "internal" {
  if (project === "booking" || project === "internal") return project;
  const destination = safeDestination(next);
  if (!destination) return "booking";
  const url = new URL(destination, "https://peregrine.invalid");
  // The password page belongs to whichever workspace it goes on to.
  if (url.pathname === PASSWORD_PATH)
    return authProject(url.searchParams.get("next"));
  return url.pathname === "/owner" || url.pathname.startsWith("/owner/")
    ? "internal"
    : "booking";
}
/** Where the password page goes once it is done: a workspace, never itself. */
export function workspaceDestination(
  value: unknown,
  project: "booking" | "internal",
): string {
  const to = safeDestination(value);
  if (to && !to.startsWith(PASSWORD_PATH)) return to;
  return project === "internal" ? "/owner" : "/console";
}
export function credentialDestination(
  authenticated: boolean,
  level: string | null,
): string | null {
  if (!authenticated) return "/sign-in?next=%2Fowner";
  return level === "aal2" ? null : "/sign-in/verify?next=%2Fowner";
}
