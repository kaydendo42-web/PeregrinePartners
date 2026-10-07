import { requireClientVenue } from "@/lib/client-crm/data";
import {
  WorkspaceLiveRefresh,
  LiveStatus,
} from "@/components/crm/live-refresh";
import { supabaseEnv } from "@/lib/supabase/server";
import "@/app/owner/owner.css";
export default async function ClientCrmLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ venue: string }>;
}) {
  const { venue: slug } = await params;
  const { venue, user } = await requireClientVenue(slug);
  const env = supabaseEnv()!;
  return (
    <WorkspaceLiveRefresh
      workspaceId={venue.id}
      userId={user.id}
      url={env.url}
      anonKey={env.key}
      scope="venue"
      destination={`/console/${slug}/crm`}
    >
      <div className="owner-shell guest-crm">
        <div className="dash-client-tool-label">
          <span>Customer workspace</span>
          <LiveStatus label="CRM & bookings" />
        </div>
        {children}
      </div>
    </WorkspaceLiveRefresh>
  );
}
