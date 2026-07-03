import { HomePageClient } from "@/app/HomePageClient";
import { getLooks } from "@/data/looks";
import { getDynamicCategories } from "@/lib/dynamicLooks/registry";

export default function Home() {
  return <HomePageClient looks={getLooks()} categories={getDynamicCategories()} />;
}
