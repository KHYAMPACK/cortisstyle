"use client";

import { Percent, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { TrPanelModal } from "@/components/tr/panel/TrPanelModal";
import { trPanelNewCampaignPath } from "@/lib/tr/paths";

/** "Kampanya Ekle": which kind of campaign, automatic or code — both buildable since M4. */
export function TrCampaignTypeChooser({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  return (
    <TrPanelModal open={open} onClose={onClose} title="Kampanya Ekle">
      <div className="grid gap-3 p-6 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => router.push(trPanelNewCampaignPath("automatic"))}
          className="group flex flex-col items-start gap-3 rounded-xl border border-neutral-200/80 bg-white p-5 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[border-color,box-shadow] duration-150 hover:border-[color:var(--panel-accent)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)]"
        >
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]">
            <Percent className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <span>
            <span className="block text-[16px] font-semibold text-neutral-900">
              Otomatik İndirim
            </span>
            <span className="mt-1 block text-[13.5px] leading-relaxed text-neutral-600">
              Koşulları sağlayan sepetlere kod girilmeden uygulanır.
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => router.push(trPanelNewCampaignPath("code"))}
          className="group flex flex-col items-start gap-3 rounded-xl border border-neutral-200/80 bg-white p-5 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[border-color,box-shadow] duration-150 hover:border-[color:var(--panel-accent)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)]"
        >
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]">
            <Ticket className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <span>
            <span className="block text-[16px] font-semibold text-neutral-900">
              İndirim Kodu
            </span>
            <span className="mt-1 block text-[13.5px] leading-relaxed text-neutral-600">
              Müşteri ödeme adımında bir kod girer.
            </span>
          </span>
        </button>
      </div>
    </TrPanelModal>
  );
}
