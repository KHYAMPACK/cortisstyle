import { HomePageClient } from "@/app/HomePageClient";
import { getLooks } from "@/data/looks";

export default function Home() {
  return <HomePageClient looks={getLooks()} />;
}
