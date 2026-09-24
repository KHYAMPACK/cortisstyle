import { Mail, MapPin, Phone, User } from "lucide-react";
import { panelCardShellClass } from "@/components/tr/panel/panelUi";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { trPanelCustomerPath } from "@/lib/tr/paths";
import type { TrOrder } from "@/types/tr-marketplace";

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5 md:px-6 md:first:pl-0 md:last:pr-0">
      <h3 className="text-[13px] font-semibold text-neutral-900">{title}</h3>
      <div className="space-y-0.5 text-[13.5px] leading-relaxed text-neutral-600">
        {children}
      </div>
    </div>
  );
}

function countryName(country: string): string {
  const value = country.trim();
  return value.toUpperCase() === "TR" ? "Türkiye" : value;
}

/**
 * Who bought: contact details, the delivery address, and the invoice details as
 * they were entered at checkout. Read-only — an address is only corrected through
 * the carrier flow when a carrier rejects it.
 */
export function TrOrderCustomerCard({
  order,
  customerOrderNumber,
}: {
  order: Pick<
    TrOrder,
    | "customerName"
    | "customerEmail"
    | "customerPhone"
    | "shippingAddress"
    | "invoiceType"
    | "buyerTitle"
    | "buyerTaxId"
    | "buyerTaxOffice"
  >;
  /** "N. sipariş" — how many orders this customer has placed, counting this one. */
  customerOrderNumber: number;
}) {
  const address = order.shippingAddress;
  const corporate = order.invoiceType === "corporate";

  return (
    <section className={panelCardShellClass}>
      <header className="flex items-center gap-2.5 border-b border-neutral-100 px-4 py-4 sm:px-6">
        <User className="h-[18px] w-[18px] text-neutral-500" strokeWidth={1.75} aria-hidden />
        <h2 className="text-[16px] font-semibold text-neutral-900">Müşteri</h2>
      </header>

      <div className="grid gap-5 px-4 py-5 sm:px-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-neutral-100">
        <Block title="İletişim">
          <Link
            href={trPanelCustomerPath(order.customerEmail)}
            className="block truncate font-medium text-[color:var(--panel-accent-deep)] hover:underline"
          >
            {order.customerName}
          </Link>
          <p className="flex items-center gap-2 break-all">
            <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} aria-hidden />
            <a href={`mailto:${order.customerEmail}`} className="hover:underline">
              {order.customerEmail}
            </a>
          </p>
          {order.customerPhone ? (
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} aria-hidden />
              <a href={`tel:${order.customerPhone}`} className="hover:underline">
                {order.customerPhone}
              </a>
            </p>
          ) : null}
          <p className="pt-1 text-[12.5px] text-neutral-500">
            {customerOrderNumber}. sipariş
          </p>
        </Block>

        <Block title="Teslimat adresi">
          <p className="flex items-start gap-2">
            <MapPin className="mt-1 h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} aria-hidden />
            <span>
              <span className="block font-medium text-neutral-800">
                {order.customerName}
              </span>
              <span className="block">{address.line1}</span>
              {address.line2 ? <span className="block">{address.line2}</span> : null}
              <span className="block">
                {address.district}, {address.city} {address.postalCode}
              </span>
              <span className="block">{countryName(address.country)}</span>
            </span>
          </p>
        </Block>

        <Block title="Fatura bilgileri">
          <p className="font-medium text-neutral-800">
            {corporate ? "Kurumsal" : "Bireysel"}
          </p>
          {corporate && order.buyerTitle ? <p>{order.buyerTitle}</p> : null}
          {order.buyerTaxId ? <p>Vergi no: {order.buyerTaxId}</p> : null}
          {order.buyerTaxOffice ? <p>Vergi dairesi: {order.buyerTaxOffice}</p> : null}
        </Block>
      </div>
    </section>
  );
}
