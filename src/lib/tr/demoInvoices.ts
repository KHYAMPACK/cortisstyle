import { formatTryFromKurus } from "@/types/tr-marketplace";

export type DemoInvoiceType = "e-arsiv" | "e-fatura";
export type DemoInvoiceStatus = "kesildi" | "gonderildi" | "iptal";

export interface DemoInvoiceLine {
  title: string;
  quantity: number;
  unitKurus: number;
}

export interface DemoInvoice {
  id: string;
  number: string;
  issuedAt: string;
  type: DemoInvoiceType;
  status: DemoInvoiceStatus;
  customerName: string;
  customerEmail: string;
  orderRef: string;
  lines: DemoInvoiceLine[];
  /** KDV dahil toplam */
  totalKurus: number;
  vatRate: number;
}

const TYPE_LABEL: Record<DemoInvoiceType, string> = {
  "e-arsiv": "e-Arşiv",
  "e-fatura": "e-Fatura",
};

const STATUS_LABEL: Record<DemoInvoiceStatus, string> = {
  kesildi: "Kesildi",
  gonderildi: "Gönderildi",
  iptal: "İptal",
};

export function demoInvoiceTypeLabel(type: DemoInvoiceType): string {
  return TYPE_LABEL[type];
}

export function demoInvoiceStatusLabel(status: DemoInvoiceStatus): string {
  return STATUS_LABEL[status];
}

/** Static demo invoices for panel Faturalar — not GİB-connected. */
export function getDemoInvoices(boutiqueName: string): DemoInvoice[] {
  void boutiqueName;
  return [
    {
      id: "inv-demo-1",
      number: "EAR2026-000142",
      issuedAt: "2026-08-05T14:22:00+03:00",
      type: "e-arsiv",
      status: "gonderildi",
      customerName: "Ayşe Yılmaz",
      customerEmail: "ayse.yilmaz@example.com",
      orderRef: "SIP-8F2A1C",
      vatRate: 20,
      totalKurus: 2_890_00,
      lines: [
        { title: "Siyah Bluz", quantity: 1, unitKurus: 1_490_00 },
        { title: "Keten Pantolon", quantity: 1, unitKurus: 1_400_00 },
      ],
    },
    {
      id: "inv-demo-2",
      number: "EAR2026-000141",
      issuedAt: "2026-08-04T11:05:00+03:00",
      type: "e-arsiv",
      status: "gonderildi",
      customerName: "Elif Demir",
      customerEmail: "elif.demir@example.com",
      orderRef: "SIP-3B91D0",
      vatRate: 20,
      totalKurus: 1_790_00,
      lines: [{ title: "Çiçekli Elbise", quantity: 1, unitKurus: 1_790_00 }],
    },
    {
      id: "inv-demo-3",
      number: "EFA2026-000018",
      issuedAt: "2026-08-03T16:40:00+03:00",
      type: "e-fatura",
      status: "kesildi",
      customerName: "Moda Atölyesi Ltd. Şti.",
      customerEmail: "muhasebe@moda-ornek.com",
      orderRef: "SIP-71C4EE",
      vatRate: 20,
      totalKurus: 4_560_00,
      lines: [
        { title: "Jean Pantolon", quantity: 2, unitKurus: 1_190_00 },
        { title: "Beyaz Gömlek", quantity: 2, unitKurus: 1_090_00 },
      ],
    },
    {
      id: "inv-demo-4",
      number: "EAR2026-000140",
      issuedAt: "2026-08-02T09:18:00+03:00",
      type: "e-arsiv",
      status: "gonderildi",
      customerName: "Zeynep Kaya",
      customerEmail: "zeynep.kaya@example.com",
      orderRef: "SIP-A02F55",
      vatRate: 20,
      totalKurus: 980_00,
      lines: [{ title: "Basic Tişört", quantity: 2, unitKurus: 490_00 }],
    },
    {
      id: "inv-demo-5",
      number: "EAR2026-000139",
      issuedAt: "2026-07-29T18:55:00+03:00",
      type: "e-arsiv",
      status: "iptal",
      customerName: "Deniz Arslan",
      customerEmail: "deniz.arslan@example.com",
      orderRef: "SIP-C9E110",
      vatRate: 20,
      totalKurus: 2_250_00,
      lines: [{ title: "Trençkot", quantity: 1, unitKurus: 2_250_00 }],
    },
    {
      id: "inv-demo-6",
      number: "EAR2026-000138",
      issuedAt: "2026-07-28T13:12:00+03:00",
      type: "e-arsiv",
      status: "gonderildi",
      customerName: "Melis Şahin",
      customerEmail: "melis.sahin@example.com",
      orderRef: "SIP-55D8B2",
      vatRate: 20,
      totalKurus: 3_180_00,
      lines: [
        { title: "Yazlık Elbise", quantity: 1, unitKurus: 1_690_00 },
        { title: "Hasır Çanta", quantity: 1, unitKurus: 1_490_00 },
      ],
    },
  ];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatInvoiceDate(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function buildDemoInvoiceHtml(input: {
  invoice: DemoInvoice;
  boutiqueName: string;
}): string {
  const { invoice, boutiqueName } = input;
  const net = Math.round(invoice.totalKurus / (1 + invoice.vatRate / 100));
  const vat = invoice.totalKurus - net;
  const rows = invoice.lines
    .map(
      (line) => `<tr>
        <td>${escapeHtml(line.title)}</td>
        <td style="text-align:right">${line.quantity}</td>
        <td style="text-align:right">${escapeHtml(formatTryFromKurus(line.unitKurus))}</td>
        <td style="text-align:right">${escapeHtml(formatTryFromKurus(line.unitKurus * line.quantity))}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoice.number)}</title>
  <style>
    @page { margin: 16mm; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #111; margin: 0; }
    .sheet { max-width: 720px; margin: 0 auto; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .muted { color: #555; font-size: 12px; }
    .meta { display: flex; justify-content: space-between; gap: 16px; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; text-align: left; }
    th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #555; }
    .totals { margin-top: 16px; margin-left: auto; width: 240px; font-size: 13px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { font-weight: 700; font-size: 15px; border-top: 1px solid #111; margin-top: 6px; padding-top: 8px; }
    .badge { display: inline-block; border: 1px solid #111; padding: 2px 8px; font-size: 11px; font-weight: 700; }
    .foot { margin-top: 24px; font-size: 10px; color: #777; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="meta">
      <div>
        <h1>${escapeHtml(boutiqueName)}</h1>
        <div class="muted">Demo ${escapeHtml(TYPE_LABEL[invoice.type])}</div>
      </div>
      <div style="text-align:right">
        <div class="badge">${escapeHtml(TYPE_LABEL[invoice.type])}</div>
        <div style="margin-top:8px;font-weight:700">${escapeHtml(invoice.number)}</div>
        <div class="muted">${escapeHtml(formatInvoiceDate(invoice.issuedAt))}</div>
      </div>
    </div>

    <div class="meta">
      <div>
        <div class="muted">ALICI</div>
        <div style="font-weight:700">${escapeHtml(invoice.customerName)}</div>
        <div class="muted">${escapeHtml(invoice.customerEmail)}</div>
      </div>
      <div style="text-align:right">
        <div class="muted">SİPARİŞ</div>
        <div>${escapeHtml(invoice.orderRef)}</div>
        <div class="muted">${escapeHtml(STATUS_LABEL[invoice.status])}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Ürün</th>
          <th style="text-align:right">Adet</th>
          <th style="text-align:right">Birim</th>
          <th style="text-align:right">Tutar</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div><span>Ara toplam</span><span>${escapeHtml(formatTryFromKurus(net))}</span></div>
      <div><span>KDV (%${invoice.vatRate})</span><span>${escapeHtml(formatTryFromKurus(vat))}</span></div>
      <div class="grand"><span>Genel toplam</span><span>${escapeHtml(formatTryFromKurus(invoice.totalKurus))}</span></div>
    </div>

    <p class="foot">
      Bu belge demo amaçlıdır. Gerçek e-Arşiv / e-Fatura entegrasyonu bağlandığında
      aynı ekrandan otomatik kesilen faturalar listelenir.
    </p>
  </div>
</body>
</html>`;
}
