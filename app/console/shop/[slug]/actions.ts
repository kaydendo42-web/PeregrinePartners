"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { shopBySlug, shopSession } from "@/lib/shop/data";
import type { ShopBookingStatus } from "@/lib/shop/types";

const OWNER_STATUSES: ShopBookingStatus[] = ["confirmed", "cancelled", "completed", "no_show"];

/** Mark an appointment done, a no-show, cancelled, or back to booked. */
export async function setStatus(slug: string, id: string, status: ShopBookingStatus, back: string) {
  if (!OWNER_STATUSES.includes(status)) return;
  const shop = await shopBySlug(slug);
  const { db } = await shopSession();
  const now = new Date().toISOString();
  const { error } = await db
    .from("bookings")
    .update({ status, updated_at: now, cancelled_at: status === "cancelled" ? now : null })
    .eq("tenant_id", shop.id)
    .eq("id", id);
  if (error?.code === "23P01") {
    redirect(`${back}?problem=${encodeURIComponent("That time has been booked since. Move one of them first.")}`);
  }
  if (error) throw new Error(`Could not update the appointment: ${error.message}`);
  revalidatePath(`/console/shop/${slug}`, "layout");
  redirect(back);
}
