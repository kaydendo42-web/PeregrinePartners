export type LiveState = {
  connection: "connecting" | "live" | "reconnecting" | "disconnected";
  authorized: boolean;
};
export type LiveEvent = {
  type:
    | "SUBSCRIBED"
    | "CHANNEL_ERROR"
    | "CLOSED"
    | "OFFLINE"
    | "ONLINE"
    | "SESSION_LOST";
};
export const liveState: LiveState = {
  connection: "connecting",
  authorized: true,
};
export function reduceLiveState(state: LiveState, event: LiveEvent): LiveState {
  if (!state.authorized) return state;
  if (event.type === "SESSION_LOST")
    return { authorized: false, connection: "disconnected" };
  if (event.type === "SUBSCRIBED") return { ...state, connection: "live" };
  if (event.type === "OFFLINE") return { ...state, connection: "disconnected" };
  return { ...state, connection: "reconnecting" };
}
/** Coalesce event bursts with a bounded delay, so continuous changes cannot starve a refresh. */
export function createRefreshScheduler(refresh: () => void, delay = 150) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  return {
    schedule() {
      if (stopped || timer) return;
      timer = setTimeout(() => {
        timer = null;
        if (!stopped) refresh();
      }, delay);
    },
    dispose() {
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}
