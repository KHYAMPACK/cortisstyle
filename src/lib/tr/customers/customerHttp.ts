import {
  CustomerEmailTakenError,
  CustomersNotSetUpError,
} from "@/lib/tr/commerce/customers";

/** The response for an error thrown by the customer functions. Never leaks database details. */
export function customerErrorResponse(error: unknown, fallback: string): Response {
  if (error instanceof CustomerEmailTakenError) {
    return Response.json(
      { error: error.message, existingCustomerId: error.existingCustomerId },
      { status: 409 },
    );
  }
  if (error instanceof CustomersNotSetUpError) {
    return Response.json({ error: error.message }, { status: 503 });
  }
  console.error("[tr/owner/customers]", error);
  return Response.json({ error: fallback }, { status: 500 });
}
