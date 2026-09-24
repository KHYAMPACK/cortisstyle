import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TrOrderWithItems } from "@/types/tr-marketplace";
import { orderExportFilename, ordersToCsv } from "./orderExport";

function order(over: Record<string, unknown> = {}): TrOrderWithItems {
  return {
    id: "a1b2c3d4-0000-4000-8000-000000000001",
    customerName: "Ayşe Yılmaz",
    customerEmail: "ayse@example.com",
    customerPhone: "+90 555 111 22 33",
    createdAt: "2026-09-24T12:59:00.000Z", // 15:59 in Istanbul
    fulfillmentStatus: "shipped",
    paymentStatus: "paid",
    isSandbox: false,
    iyzicoPaymentId: "pay-1",
    totalKurus: 441_700,
    discountKurus: 20_000,
    shippingAddress: {
      line1: "Gül Sok. No:5",
      line2: "D:3",
      district: "Çankaya",
      city: "Ankara",
      postalCode: "06680",
      country: "TR",
    },
    items: [
      { title: "Keten Elbise", quantity: 1, priceKurus: 189_900, size: "M" },
      { title: "Saten Bluz", quantity: 2, priceKurus: 129_900, size: null },
    ],
    ...over,
  } as unknown as TrOrderWithItems;
}

/** Reads back what a spreadsheet would: ; separators, "" escapes, quoted line breaks. */
function parseCsv(csv: string): string[][] {
  const table: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i]!;
    if (inQuotes) {
      if (char === '"' && csv[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ";") {
      row.push(field);
      field = "";
    } else if (char === "\r" && csv[i + 1] === "\n") {
      row.push(field);
      table.push(row);
      row = [];
      field = "";
      i += 1;
    } else {
      field += char;
    }
  }
  return table;
}

const COLUMN = {
  reference: 0,
  date: 1,
  name: 2,
  email: 3,
  phone: 4,
  fulfillment: 5,
  payment: 6,
  method: 7,
  products: 8,
  units: 9,
  subtotal: 10,
  discount: 11,
  shipping: 12,
  total: 13,
  city: 14,
  district: 15,
  address: 16,
} as const;

function firstRow(over: Record<string, unknown> = {}): string[] {
  return parseCsv(ordersToCsv([order(over)]))[1]!;
}

describe("ordersToCsv", () => {
  it("writes a header and one row per order, each with the same columns", () => {
    const csv = ordersToCsv([order(), order({ id: "ffff0000-x" })]);
    assert.ok(csv.endsWith("\r\n"));
    const table = parseCsv(csv);
    assert.equal(table.length, 3);
    assert.equal(table[0]![COLUMN.reference], "Sipariş No");
    assert.equal(table[1]![COLUMN.reference], "A1B2C3D4");
    assert.equal(table[2]![COLUMN.reference], "FFFF0000");
    assert.ok(table.every((row) => row.length === table[0]!.length));
  });

  it("fills the columns from the order", () => {
    const row = firstRow();
    assert.equal(row[COLUMN.date], "24.09.2026 15:59");
    assert.equal(row[COLUMN.name], "Ayşe Yılmaz");
    assert.equal(row[COLUMN.phone], "+90 555 111 22 33");
    assert.equal(row[COLUMN.fulfillment], "Kargoda");
    assert.equal(row[COLUMN.payment], "Ödendi");
    assert.equal(row[COLUMN.method], "Kart");
    assert.equal(row[COLUMN.products], "1 × Keten Elbise (M); 2 × Saten Bluz");
    assert.equal(row[COLUMN.units], "3");
    assert.equal(row[COLUMN.city], "Ankara");
    assert.equal(row[COLUMN.district], "Çankaya");
    assert.equal(row[COLUMN.address], "Gül Sok. No:5 D:3");
  });

  it("writes money with a decimal comma", () => {
    const row = firstRow();
    // subtotal 1.899 + 2.598 = 4.497; discount 200; shipping 120; total 4.417
    assert.deepEqual(
      [row[COLUMN.subtotal], row[COLUMN.discount], row[COLUMN.shipping], row[COLUMN.total]],
      ["4497,00", "200,00", "120,00", "4417,00"],
    );
  });

  it("keeps fields with the separator, quotes or line breaks intact", () => {
    const row = firstRow({
      customerName: 'Ali "Veli"; Bey',
      shippingAddress: {
        line1: "A\nB",
        district: "d",
        city: "c",
        postalCode: "1",
        country: "TR",
      },
    });
    assert.equal(row[COLUMN.name], 'Ali "Veli"; Bey');
    assert.equal(row[COLUMN.address], "A\nB");
  });

  it("keeps spreadsheets from running customer-typed text as a formula", () => {
    const row = firstRow({
      customerName: '=HYPERLINK("http://evil")',
      customerEmail: "@cmd",
      shippingAddress: {
        line1: "-2+3",
        district: "+1+1",
        city: "\tTab",
        postalCode: "1",
        country: "TR",
      },
    });
    assert.equal(row[COLUMN.name], `'=HYPERLINK("http://evil")`);
    assert.equal(row[COLUMN.email], "'@cmd");
    assert.equal(row[COLUMN.address], "'-2+3");
    assert.equal(row[COLUMN.district], "'+1+1");
    assert.equal(row[COLUMN.city], "'\tTab");
  });

  it("leaves an ordinary international phone number as written", () => {
    assert.equal(firstRow({ customerPhone: "+905551112233" })[COLUMN.phone], "+905551112233");
    // …but not one that could be arithmetic.
    assert.equal(firstRow({ customerPhone: "+1-1" })[COLUMN.phone], "'+1-1");
  });

  it("handles an order with no phone", () => {
    assert.equal(firstRow({ customerPhone: null })[COLUMN.phone], "");
  });

  it("is just the header for no orders", () => {
    assert.equal(parseCsv(ordersToCsv([])).length, 1);
  });
});

describe("orderExportFilename", () => {
  it("names the file by the Istanbul date", () => {
    assert.equal(
      orderExportFilename(Date.parse("2026-09-24T22:00:00Z")),
      "siparisler-2026-09-25.csv",
    );
  });
});
