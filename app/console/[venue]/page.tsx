import { redirect } from "next/navigation";

/**
 * The console opens on today's bookings. The old dashboard's two counts live on
 * the list (today) and the calendar (the weeks ahead), so it had nothing of its own.
 */
export default async function VenueHome({ params }: { params: Promise<{ venue: string }> }) {
  const { venue: slug } = await params;
  redirect(`/console/${slug}/list`);
}
