import type { TrOrderWithItems } from "@/types/tr-marketplace";

export function demoTrackingNumber(orderId: string): string {
  const compact = orderId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const base = (compact.slice(0, 10) || "DEMOORDER").padEnd(10, "0");
  return `YK${base}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Demo shipping label HTML — looks like a carrier sticker for print demos. */
export function buildDemoCargoLabelHtml(input: {
  order: TrOrderWithItems;
  boutiqueName: string;
  senderAddress?: string | null;
}): string {
  const { order, boutiqueName, senderAddress } = input;
  const tracking = demoTrackingNumber(order.id);
  const addr = order.shippingAddress;
  const itemsSummary = order.items
    .map((item) => `${item.title} ×${item.quantity}`)
    .join(", ");
  const barcodeBars = Array.from({ length: 48 }, (_, i) => {
    const seed = tracking.charCodeAt(i % tracking.length) + i;
    const width = 1 + (seed % 3);
    return `<span style="display:inline-block;width:${width}px;height:56px;background:#111;margin-right:1px"></span>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Kargo etiketi · ${escapeHtml(tracking)}</title>
  <style>
    @page { size: 100mm 150mm; margin: 6mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #111;
      background: #fff;
    }
    .label {
      width: 100%;
      max-width: 360px;
      margin: 0 auto;
      border: 2px solid #111;
      padding: 12px 14px;
    }
    .row { display: flex; justify-content: space-between; gap: 8px; }
    .muted { color: #555; font-size: 11px; }
    .title { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .tracking { font-size: 22px; font-weight: 800; letter-spacing: 0.06em; margin: 6px 0 2px; }
    .barcode { margin: 10px 0; text-align: center; line-height: 0; }
    .section { border-top: 1px solid #111; margin-top: 10px; padding-top: 8px; }
    .name { font-size: 16px; font-weight: 700; margin: 2px 0 4px; }
    .addr { font-size: 13px; line-height: 1.35; }
    .phone { font-size: 13px; font-weight: 600; margin-top: 4px; }
    .footer { font-size: 10px; color: #666; margin-top: 10px; }
    @media print {
      body { background: #fff; }
      .label { border-color: #000; }
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="row">
      <div>
        <div class="title">Kargo etiketi</div>
        <div class="muted">Demo · Yurtiçi Kargo görünümü</div>
      </div>
      <div class="muted" style="text-align:right">Gönderici öder<br/>Standart</div>
    </div>
    <div class="tracking">${escapeHtml(tracking)}</div>
    <div class="barcode" aria-hidden="true">${barcodeBars}</div>
    <div class="muted" style="text-align:center">${escapeHtml(tracking)}</div>

    <div class="section">
      <div class="muted">ALICI</div>
      <div class="name">${escapeHtml(order.customerName)}</div>
      <div class="addr">
        ${escapeHtml(addr.line1)}<br/>
        ${addr.line2 ? `${escapeHtml(addr.line2)}<br/>` : ""}
        ${escapeHtml(addr.district)} / ${escapeHtml(addr.city)} ${escapeHtml(addr.postalCode)}<br/>
        ${escapeHtml(addr.country)}
      </div>
      ${
        order.customerPhone
          ? `<div class="phone">Tel: ${escapeHtml(order.customerPhone)}</div>`
          : ""
      }
    </div>

    <div class="section">
      <div class="muted">GÖNDERİCİ</div>
      <div class="name">${escapeHtml(boutiqueName)}</div>
      <div class="addr">${escapeHtml(senderAddress?.trim() || "Butik çıkış adresi")}</div>
    </div>

    <div class="section">
      <div class="muted">İÇERİK</div>
      <div class="addr">${escapeHtml(itemsSummary || "Giyim")}</div>
      <div class="muted" style="margin-top:6px">Sipariş: ${escapeHtml(order.id.slice(0, 8).toUpperCase())}</div>
    </div>

    <div class="footer">
      Demo etikettir — gerçek kargo API bağlandığında aynı yazdırma akışı kullanılır.
      Kurye adresten alım için paketi hazır bırakın.
    </div>
  </div>
</body>
</html>`;
}
