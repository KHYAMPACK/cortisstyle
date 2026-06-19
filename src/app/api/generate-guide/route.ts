import { looks } from "@/data/looks";
import {
  formatPurchaseDate,
  generateCertificateSerial,
} from "@/lib/certificate";
import { resolveLookItems } from "@/lib/resolveLookItems";

export const runtime = "nodejs";

interface GenerateGuidePayload {
  buyerName?: string;
  lookId?: string;
}

export async function POST(request: Request) {
  let payload: GenerateGuidePayload;

  try {
    payload = (await request.json()) as GenerateGuidePayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const buyerName = payload.buyerName?.trim();
  const lookId = payload.lookId?.trim();

  if (!buyerName || !lookId) {
    return Response.json(
      { error: "Both buyerName and lookId are required." },
      { status: 400 },
    );
  }

  const look = looks.find((entry) => entry.id === lookId);

  if (!look) {
    return Response.json({ error: `Look "${lookId}" was not found.` }, { status: 404 });
  }

  const [{ renderToBuffer }, { createGuideDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/GuideTemplate"),
  ]);

  const resolvedItems = resolveLookItems(look);
  const purchaseDate = new Date();
  const dateOfPurchase = formatPurchaseDate(purchaseDate);
  const certificateSerial = generateCertificateSerial(
    look.id,
    buyerName,
    purchaseDate.toISOString(),
  );

  const pdfBuffer = await renderToBuffer(
    createGuideDocument({
      buyerName,
      dateOfPurchase,
      lookTitle: look.title,
      certificateSerial,
      items: resolvedItems,
    }),
  );

  const filename = `cortis-style-guide-${look.id}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
