"use client";
import { createContext, useContext, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/browser";
import {
  liveState,
  reduceLiveState,
  createRefreshScheduler,
} from "@/lib/crm/live-state";
import { parseUuid } from "@/lib/crm/validation";
const StatusContext = createContext(liveState);
export function LiveStatus({ label }: { label?: string }) {
  const state = useContext(StatusContext);
  const text = {
    connecting: "Connecting",
    live: "Live",
    reconnecting: "Reconnecting",
    disconnected: "Disconnected",
  }[state.connection];
  return (
    <span className="owner-live" data-status={state.connection} role="status">
      <span aria-hidden="true" />
      {label ? label + " · " : ""}
      {text}
      {state.connection === "disconnected" ? (
        <span className="owner-live-detail">Updates may be delayed</span>
      ) : null}
    </span>
  );
}
export function WorkspaceLiveRefresh({
  children,
  workspaceId,
  userId,
  url,
  anonKey,
  scope = "owner",
  destination = "/owner",
  venueIds = [],
}: {
  children: React.ReactNode;
  workspaceId: string;
  userId: string;
  url: string;
  anonKey: string;
  scope?: "owner" | "venue";
  destination?: string;
  venueIds?: string[];
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reduceLiveState, liveState);
  const venueKey = [...venueIds].sort().join(",");
  useEffect(() => {
    parseUuid(workspaceId);
    const client = browserSupabase(url, anonKey);
    let active = true;
    let revoked = false;
    let joined = false;
    let validating = false;
    let started = false;
    const refresh = createRefreshScheduler(() => {
      if (active && !revoked) router.refresh();
    });
    const channel = client.channel(scope + ":" + workspaceId);
    function revoke() {
      if (!active || revoked) return;
      revoked = true;
      joined = false;
      refresh.dispose();
      void client.removeChannel(channel);
      sessionStorage.removeItem(
        "peregrine-import:" + workspaceId + ":" + userId,
      );
      dispatch({ type: "SESSION_LOST" });
      router.replace(
        "/sign-in?project=" +
          (scope === "owner" ? "internal" : "booking") +
          "&next=" +
          encodeURIComponent(destination),
      );
      router.refresh();
    }
    async function validate() {
      if (!active || revoked || validating) return false;
      validating = true;
      try {
        const {
          data: { session },
        } = await client.auth.getSession();
        if (
          !session ||
          session.user.id !== userId ||
          (session.expires_at !== undefined &&
            session.expires_at * 1000 <= Date.now())
        ) {
          revoke();
          return false;
        }
        const { data: aal, error: aalError } =
          await client.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError || aal?.currentLevel !== "aal2") {
          revoke();
          return false;
        }
        const check =
          scope === "owner"
            ? await client.rpc("crm_can_access", { p_workspace: workspaceId })
            : await client
                .from("venues")
                .select("id")
                .eq("id", workspaceId)
                .maybeSingle();
        const allowed = Boolean(check.data);
        const error = check.error;
        if (!active || revoked) return false;
        if (error) {
          dispatch({ type: navigator.onLine ? "CHANNEL_ERROR" : "OFFLINE" });
          return false;
        }
        if (!allowed) {
          revoke();
          return false;
        }
        await client.realtime.setAuth(session.access_token);
        if (!active || revoked) return false;
        if (!started) {
          started = true;
          channel.subscribe((status) => {
            if (!active || revoked) return;
            joined = status === "SUBSCRIBED";
            dispatch({
              type: joined
                ? "SUBSCRIBED"
                : navigator.onLine
                  ? "CHANNEL_ERROR"
                  : "OFFLINE",
            });
            if (joined) refresh.schedule();
          });
        } else if (channel.state === "joined" && navigator.onLine) {
          joined = true;
          dispatch({ type: "SUBSCRIBED" });
        }
        return true;
      } catch {
        if (active && !revoked)
          dispatch({ type: navigator.onLine ? "CHANNEL_ERROR" : "OFFLINE" });
        return false;
      } finally {
        validating = false;
      }
    }
    const tables =
      scope === "venue"
        ? ["bookings", "client_crm_entries"]
        : [
            "crm_businesses",
            "crm_contacts",
            "crm_activities",
            "crm_follow_ups",
            "crm_clients",
            "crm_client_tools",
            "crm_billing_records",
            "crm_tool_catalog",
          ];
    for (const table of tables)
      for (const event of ["INSERT", "UPDATE"] as const)
        channel.on(
          "postgres_changes",
          {
            event,
            schema: "public",
            table,
            filter:
              (scope === "venue" ? "venue_id" : "workspace_id") +
              "=eq." +
              workspaceId,
          },
          () => refresh.schedule(),
        );
    if (scope === "owner" && venueKey) {
      for (const venueId of venueKey.split(",")) {
        parseUuid(venueId);
        for (const event of ["INSERT", "UPDATE"] as const)
          channel.on(
            "postgres_changes",
            {
              event,
              schema: "public",
              table: "bookings",
              filter: "venue_id=eq." + venueId,
            },
            () => refresh.schedule(),
          );
      }
    }
    void validate();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        revoke();
        return;
      }
      if (event === "TOKEN_REFRESHED" || event === "MFA_CHALLENGE_VERIFIED") {
        setTimeout(() => {
          void validate().then((allowed) => {
            if (allowed) refresh.schedule();
          });
        }, 0);
      }
    });
    const focus = () => {
      void validate().then((allowed) => {
        if (allowed) refresh.schedule();
      });
    };
    const offline = () => {
      dispatch({ type: "OFFLINE" });
    };
    const online = () => {
      dispatch({ type: "ONLINE" });
      focus();
    };
    const visibility = () => {
      if (document.visibilityState === "visible") focus();
    };
    window.addEventListener("peregrine-access-lost", revoke);
    window.addEventListener("focus", focus);
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    document.addEventListener("visibilitychange", visibility);
    const fallback = setInterval(() => {
      if (!active || revoked) return;
      void validate().then((allowed) => {
        if (allowed && !joined) refresh.schedule();
      });
    }, 30000);
    const timeSensitive = setInterval(() => {
      if (active && !revoked && document.visibilityState === "visible")
        refresh.schedule();
    }, 60000);
    return () => {
      active = false;
      refresh.dispose();
      clearInterval(fallback);
      clearInterval(timeSensitive);
      subscription.unsubscribe();
      void client.removeChannel(channel);
      window.removeEventListener("peregrine-access-lost", revoke);
      window.removeEventListener("focus", focus);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [workspaceId, userId, url, anonKey, router, scope, destination, venueKey]);
  if (!state.authorized)
    return (
      <main className="owner-session-ended" role="alert">
        <h1>Sign in again</h1>
        <p>
          Your workspace session ended. Private records have been cleared from
          this page.
        </p>
        <a
          href={
            "/sign-in?project=" +
            (scope === "owner" ? "internal" : "booking") +
            "&next=" +
            encodeURIComponent(destination)
          }
        >
          Continue to sign-in
        </a>
      </main>
    );
  return (
    <StatusContext.Provider value={state}>{children}</StatusContext.Provider>
  );
}
