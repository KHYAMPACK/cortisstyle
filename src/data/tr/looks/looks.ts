import { TR_LOOKBOOK_LOOK_COVERS } from "@/data/tr/lookbookPieceImages";
import type { TrLookDefinition } from "@/types/tr-look";

/**
 * Hand-curated TR looks. Fill `productIds` with live UUIDs when known;
 * `autoPickCount` builds a working outfit from the public catalog until then.
 * Covers use editorial lookbook frames; piece images resolve to cutout PNGs.
 */
export const TR_LOOK_DEFINITIONS: TrLookDefinition[] = [
  {
    id: "tr-look-cadde-01",
    slug: "cadde-gunlugu",
    title: "Cadde günlüğü",
    subtitle: "Butik vitrinlerinden bir araya gelen sade bir günlük çizgi.",
    coverImage: TR_LOOKBOOK_LOOK_COVERS[0],
    productIds: [],
    autoPickCount: 3,
    sortOrder: 1,
    status: "published",
  },
  {
    id: "tr-look-aksam-02",
    slug: "aksam-katmani",
    title: "Akşam katmanı",
    subtitle: "Farklı butiklerden parçalarla tek bir silüet.",
    coverImage: TR_LOOKBOOK_LOOK_COVERS[1],
    productIds: [],
    autoPickCount: 3,
    sortOrder: 2,
    status: "published",
  },
  {
    id: "tr-look-hafif-03",
    slug: "hafif-gecis",
    title: "Hafif geçiş",
    subtitle: "Mevsimler arası, ortak sepetle tamamlanan bir kombin.",
    coverImage: TR_LOOKBOOK_LOOK_COVERS[2],
    productIds: [],
    autoPickCount: 4,
    sortOrder: 3,
    status: "published",
  },
];
