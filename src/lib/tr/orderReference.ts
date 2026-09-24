/**
 * The short code that identifies an order to people: the first 8 characters of its
 * id, in capitals. Shoppers see it on their tracking page and the owner sees it in
 * the panel, so either side can quote it to the other.
 */
export function orderReference(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}
