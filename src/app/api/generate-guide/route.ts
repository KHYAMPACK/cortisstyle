import { looks } from "@/data/looks";
import { resolveStyleGuide } from "@/lib/resolveStyleGuide";

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

  const purchaseDate = new Date();
  const guide = resolveStyleGuide(look, { buyerName, purchaseDate });

  const pdfBuffer = await renderToBuffer(
    createGuideDocument({
      guide,
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
