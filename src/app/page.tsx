import { redirect } from "next/navigation";

/** Platform root — Turkey-first product lives under `/tr`. */
export default function RootPage() {
  redirect("/tr");
}
