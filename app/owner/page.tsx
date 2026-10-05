import { requireOwner } from "@/lib/owner/access";
import { ownerOverview } from "@/lib/owner/overview";
import { OverviewView } from "@/components/owner/overview";

export default async function Overview() {
  const { context } = await requireOwner();
  const data = await ownerOverview(context);
  return <OverviewView data={data} timezone={context.timezone} />;
}
