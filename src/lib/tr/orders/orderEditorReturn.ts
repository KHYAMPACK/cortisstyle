/**
 * The order editor sends the owner to the new-customer page ("Yeni müşteri ekle") and
 * the new customer comes back with them: the customer page returns to the editor with
 * `?musteri=<id>`, which the editor turns into the selected customer. Pure.
 */

export const NEW_CUSTOMER_PARAM = "musteri";

const ORDER_EDITOR_PATHS = [
  /^\/tr\/panel\/siparisler\/yeni\/?$/,
  /^\/tr\/panel\/taslaklar\/[^/]+\/?$/,
];

/** Whether an in-panel path (with or without a query) is the order editor. */
export function isOrderEditorPath(path: string): boolean {
  const pathname = path.split("?")[0] ?? "";
  return ORDER_EDITOR_PATHS.some((pattern) => pattern.test(pathname));
}

/** `originPath` with `musteri=<customerId>` set, replacing an earlier one and keeping the rest of the query. */
export function withNewCustomer(originPath: string, customerId: string): string {
  const [pathname = "", query = ""] = splitOnce(originPath, "?");
  const params = new URLSearchParams(query);
  params.set(NEW_CUSTOMER_PARAM, customerId);
  return `${pathname}?${params.toString()}`;
}

/** `path` without the `musteri` param (once it has been used), keeping everything else. */
export function withoutNewCustomer(path: string): string {
  const [pathname = "", query = ""] = splitOnce(path, "?");
  const params = new URLSearchParams(query);
  params.delete(NEW_CUSTOMER_PARAM);
  const rest = params.toString();
  return rest ? `${pathname}?${rest}` : pathname;
}

function splitOnce(value: string, separator: string): [string, string] {
  const index = value.indexOf(separator);
  return index < 0 ? [value, ""] : [value.slice(0, index), value.slice(index + 1)];
}
