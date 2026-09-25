import { foldForSearch } from "@/lib/tr/panel/searchFold";
import type {
  TrBoutiqueCustomer,
  TrBoutiqueCustomerAddress,
} from "@/types/tr-marketplace";

/**
 * Choosing the customer of a manual order. Pure.
 */

/** How many customers the dropdown lists at once; a longer list is a search away. */
export const CUSTOMER_PICK_LIMIT = 8;

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * The customers matching `query` by name, e-mail or phone (digits only, so "0555 111"
 * finds "+90 555 111 22 33"), newest first as given. Every word of the query must match.
 * An empty query lists the first `CUSTOMER_PICK_LIMIT`.
 */
export function pickCustomers(
  customers: readonly TrBoutiqueCustomer[],
  query: string,
): TrBoutiqueCustomer[] {
  const words = foldForSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return customers.slice(0, CUSTOMER_PICK_LIMIT);

  return customers
    .filter((customer) => {
      const text = foldForSearch(`${customer.name} ${customer.email} ${customer.phone ?? ""}`);
      const phone = digits(customer.phone ?? "");
      return words.every(
        (word) =>
          text.includes(word) || (digits(word).length >= 3 && phone.includes(digits(word))),
      );
    })
    .slice(0, CUSTOMER_PICK_LIMIT);
}

/** The address a new order should go to: the default one, else the first, else none. */
export function preferredAddressId(
  addresses: readonly TrBoutiqueCustomerAddress[],
): string | null {
  return (addresses.find((address) => address.isDefault) ?? addresses[0])?.id ?? null;
}
