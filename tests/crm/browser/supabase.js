// Delays the realtime authorization boundary; this never connects to Supabase.
export function browserSupabase() {
  const stats = (window.crmLifecycleStats = { subscribed: 0, removed: 0 });
  const channel = {
    state: "closed",
    on() {
      return channel;
    },
    subscribe() {
      stats.subscribed++;
      return channel;
    },
  };
  return {
    auth: {
      async getSession() {
        return {
          data: {
            session: {
              user: { id: "00000000-0000-4000-8000-000000000011" },
              expires_at: Date.now() / 1000 + 60,
              access_token: "synthetic",
            },
          },
        };
      },
      mfa: {
        async getAuthenticatorAssuranceLevel() {
          return { data: { currentLevel: "aal2" }, error: null };
        },
      },
      onAuthStateChange(callback) {
        window.crmTestSignOut = () => callback("SIGNED_OUT");
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
    async rpc() {
      return { data: true, error: null };
    },
    channel() {
      return channel;
    },
    async removeChannel() {
      stats.removed++;
    },
    realtime: {
      setAuth() {
        window.crmAuthStarted = true;
        return new Promise((resolve) => {
          window.crmResolveAuth = resolve;
        });
      },
    },
  };
}
