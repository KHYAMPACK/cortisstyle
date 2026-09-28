import { CustomersNotSetUpError } from "@/lib/tr/commerce/customers";
import { ManualOrderError } from "@/lib/tr/commerce/manualOrder";
import { OrderDraftsNotSetUpError } from "@/lib/tr/commerce/orderDrafts";

/**
 * The response for an error thrown by the manual-order and draft functions. A sentence
 * meant for the owner (`ManualOrderError`, a table that isn't set up) is passed on;
 * anything else is logged and answered generically, never with database details.
 */
export function manualOrderErrorResponse(error: unknown, fallback: string): Response {
  if (error instanceof ManualOrderError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof OrderDraftsNotSetUpError || error instanceof CustomersNotSetUpError) {
    return Response.json({ error: error.message }, { status: 503 });
  }
  console.error("[tr/owner/manual-orders]", error);
  return Response.json({ error: fallback }, { status: 500 });
}
