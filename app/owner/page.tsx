import { requireOwner } from "@/lib/owner/access";
import { ownerOverview } from "@/lib/owner/overview";
import { OverviewView } from "@/components/owner/overview";
import { reportPeriod } from "@/lib/booking/report";

export default async function Overview({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const days = reportPeriod((await searchParams).days);
  const { context } = await requireOwner();
  const data = await ownerOverview(context, days);
  return <OverviewView data={data} timezone={context.timezone} days={days} />;
}
