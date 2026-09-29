"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useUnsavedChangesGuard } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrPanelConfirmPopover } from "@/components/tr/panel/TrPanelConfirmPopover";
import {
  TrPanelEditorCard,
  TrPanelEditorSave,
  TrPanelEditorTabs,
} from "@/components/tr/panel/TrPanelEditor";
import { TrPanelBusySpinner } from "@/components/tr/panel/TrPanelMotion";
import {
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { useOwnerProducts } from "@/components/tr/panel/useOwnerProducts";
import { TrCampaignProductPicker } from "@/components/tr/panel/discounts/TrCampaignProductPicker";
import {
  createOwnerDiscountCampaign,
  deleteOwnerDiscountCampaign,
  updateOwnerDiscountCampaign,
} from "@/lib/tr/ownerClient";
import {
  campaignFormFromCampaign,
  campaignInput,
  emptyCampaignForm,
  validateCampaignForm,
  type CampaignFormState,
} from "@/lib/tr/panel/campaignForm";
import { CAMPAIGN_LIMITS } from "@/lib/tr/discounts/campaignRules";
import type { TrDiscountCampaign, TrDiscountType } from "@/lib/tr/discounts/types";
import { toast } from "@/lib/tr/panel/toast";

const TABS = [
  { id: "editor-temel", label: "Temel Bilgiler" },
  { id: "editor-kosullar", label: "Koşullar" },
  { id: "editor-gereksinimler", label: "Gereksinimler" },
  { id: "editor-limitler", label: "Kullanım Limitleri" },
  { id: "editor-ayarlar", label: "Ayarlar" },
  { id: "editor-tarihler", label: "Aktif Tarihler" },
] as const;

const DISCOUNT_TYPE_OPTIONS: { id: TrDiscountType; label: string }[] = [
  { id: "percent", label: "Yüzde İndirim" },
  { id: "fixed", label: "Sabit Tutar" },
  { id: "free_shipping", label: "Ücretsiz Kargo" },
];

/**
 * The automatic-campaign editor (create and edit): Temel Bilgiler, Koşullar,
 * Gereksinimler, Kullanım Limitleri, Ayarlar, Aktif Tarihler. `kind: 'code'` and its
 * Kuponlar tab land in M4. Manual save with an exit guard, like every panel form.
 */
export function TrDiscountCampaignEditor({
  boutiqueId,
  campaign,
  onCreated,
  onSaved,
  onDeleted,
}: {
  boutiqueId: string;
  /** Absent = creating a new campaign. */
  campaign?: TrDiscountCampaign;
  onCreated?: (campaign: TrDiscountCampaign) => void;
  onSaved?: (campaign: TrDiscountCampaign) => void;
  onDeleted?: () => void;
}) {
  const [form, setForm] = useState<CampaignFormState>(() =>
    campaign ? campaignFormFromCampaign(campaign) : emptyCampaignForm(),
  );
  const [baseline, setBaseline] = useState(() => JSON.stringify(form));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { products, loaded: productsLoaded } = useOwnerProducts(boutiqueId, !form.scopeAll);

  const dirty = JSON.stringify(form) !== baseline;
  useUnsavedChangesGuard("discount-campaign-editor", dirty || saving || deleting);

  const change = (patch: Partial<CampaignFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const save = async () => {
    if (saving) return;
    const problem = validateCampaignForm(form);
    if (problem) {
      toast.error(problem);
      return;
    }
    const submitted = JSON.stringify(form);
    setSaving(true);
    try {
      const input = campaignInput(form);
      if (!campaign) {
        const created = await createOwnerDiscountCampaign(boutiqueId, input);
        setBaseline(submitted);
        toast.success("Kampanya eklendi.");
        onCreated?.(created);
      } else {
        const saved = await updateOwnerDiscountCampaign(campaign.id, input);
        setBaseline(submitted);
        setSavedOnce(true);
        toast.success("Kampanya kaydedildi.");
        onSaved?.(saved);
      }
    } catch (saveError) {
      toast.error(saveError, "Kampanya kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!campaign) return;
    setDeleting(true);
    try {
      await deleteOwnerDiscountCampaign(campaign.id);
      toast.success("Kampanya silindi.");
      setBaseline(JSON.stringify(form)); // nothing left to lose: release the exit guard
      onDeleted?.();
    } catch (deleteError) {
      toast.error(deleteError, "Kampanya silinemedi.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const selectedProducts = products.filter((product) => form.productIds.includes(product.id));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-5"
    >
      <TrPanelEditorSave
        dirty={dirty}
        saving={saving}
        saved={savedOnce}
        requireDirty={Boolean(campaign)}
        disabled={deleting}
        onSave={() => void save()}
      />

      <TrPanelEditorTabs tabs={TABS} />

      <div className="space-y-5">
        <TrPanelEditorCard
          id="editor-temel"
          title="Temel Bilgiler"
          hint="Kampanyanın adı ve indirim türü."
        >
          <label className="block space-y-2">
            <span className={panelLabelClass}>
              Kampanya adı
              <span className="text-[color:var(--panel-accent)]"> *</span>
            </span>
            <input
              value={form.title}
              onChange={(event) =>
                change({ title: event.target.value.slice(0, CAMPAIGN_LIMITS.titleMax) })
              }
              placeholder="Örn. Yaz İndirimi"
              className={panelFieldClass}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className={panelLabelClass}>İndirim türü</span>
              <select
                value={form.discountType}
                onChange={(event) =>
                  change({ discountType: event.target.value as TrDiscountType })
                }
                className={panelFieldClass}
              >
                {DISCOUNT_TYPE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {form.discountType === "percent" ? (
              <label className="block space-y-2">
                <span className={panelLabelClass}>İndirim oranı (%)</span>
                <input
                  value={form.percentOff}
                  onChange={(event) =>
                    change({ percentOff: event.target.value.replace(/[^\d]/g, "") })
                  }
                  inputMode="numeric"
                  placeholder="Örn. 20"
                  className={panelFieldClass}
                />
              </label>
            ) : form.discountType === "fixed" ? (
              <label className="block space-y-2">
                <span className={panelLabelClass}>İndirim tutarı (TL)</span>
                <input
                  value={form.amountOffTry}
                  onChange={(event) => change({ amountOffTry: event.target.value })}
                  inputMode="decimal"
                  placeholder="Örn. 100"
                  className={panelFieldClass}
                />
              </label>
            ) : null}
          </div>
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-kosullar"
          title="Koşullar"
          hint="Kampanya hangi ürünlere uygulanacak."
        >
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-[14px] text-neutral-800">
              <input
                type="radio"
                checked={form.scopeAll}
                onChange={() => change({ scopeAll: true })}
                className="h-4 w-4 accent-[color:var(--panel-accent)]"
              />
              Tüm ürünler
            </label>
            <label className="flex items-center gap-3 text-[14px] text-neutral-800">
              <input
                type="radio"
                checked={!form.scopeAll}
                onChange={() => change({ scopeAll: false })}
                className="h-4 w-4 accent-[color:var(--panel-accent)]"
              />
              Belirli ürünler
            </label>
          </div>

          {!form.scopeAll ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className={panelSecondaryBtnClass}
              >
                Ürün Seç
              </button>
              {selectedProducts.length === 0 ? (
                <p className={panelHintClass}>
                  {productsLoaded ? "Henüz ürün seçilmedi." : "Ürünler yükleniyor…"}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {selectedProducts.map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white py-1.5 pr-1.5 pl-3 text-[13px] text-neutral-800"
                    >
                      <span className="max-w-[220px] truncate">{product.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          change({
                            productIds: form.productIds.filter((id) => id !== product.id),
                          })
                        }
                        aria-label={`${product.title} seçimini kaldır`}
                        className="grid h-6 w-6 place-items-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          <label className="flex items-center gap-3 text-[14px] text-neutral-800">
            <input
              type="checkbox"
              checked={form.includeSaleItems}
              onChange={(event) => change({ includeSaleItems: event.target.checked })}
              className="h-4 w-4 accent-[color:var(--panel-accent)]"
            />
            İndirimli ürünleri kampanyaya dahil et
          </label>
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-gereksinimler"
          title="Gereksinimler"
          hint="Sepetin tamamı için isteğe bağlı koşullar."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className={panelLabelClass}>Minimum sepet tutarı (TL)</span>
              <input
                value={form.minSubtotalTry}
                onChange={(event) => change({ minSubtotalTry: event.target.value })}
                inputMode="decimal"
                placeholder="Yok"
                className={panelFieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className={panelLabelClass}>Maksimum sepet tutarı (TL)</span>
              <input
                value={form.maxSubtotalTry}
                onChange={(event) => change({ maxSubtotalTry: event.target.value })}
                inputMode="decimal"
                placeholder="Yok"
                className={panelFieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className={panelLabelClass}>Minimum ürün adedi</span>
              <input
                value={form.minItems}
                onChange={(event) =>
                  change({ minItems: event.target.value.replace(/[^\d]/g, "") })
                }
                inputMode="numeric"
                placeholder="Yok"
                className={panelFieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className={panelLabelClass}>Maksimum ürün adedi</span>
              <input
                value={form.maxItems}
                onChange={(event) =>
                  change({ maxItems: event.target.value.replace(/[^\d]/g, "") })
                }
                inputMode="numeric"
                placeholder="Yok"
                className={panelFieldClass}
              />
            </label>
          </div>
          <p className={panelHintClass}>
            Bu koşullar sepetin tamamına göre değerlendirilir, yalnızca kampanyanın
            kapsadığı ürünlere göre değil.
          </p>
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-limitler"
          title="Kullanım Limitleri"
          hint="Bu kampanya toplamda veya müşteri başına kaç kez kullanılabilir."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className={panelLabelClass}>Toplam kullanım limiti</span>
              <input
                value={form.usageLimitTotal}
                onChange={(event) =>
                  change({ usageLimitTotal: event.target.value.replace(/[^\d]/g, "") })
                }
                inputMode="numeric"
                placeholder="Sınırsız"
                className={panelFieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className={panelLabelClass}>Müşteri başına kullanım limiti</span>
              <input
                value={form.usageLimitPerCustomer}
                onChange={(event) =>
                  change({
                    usageLimitPerCustomer: event.target.value.replace(/[^\d]/g, ""),
                  })
                }
                inputMode="numeric"
                placeholder="Sınırsız"
                className={panelFieldClass}
              />
            </label>
          </div>
        </TrPanelEditorCard>

        <TrPanelEditorCard id="editor-ayarlar" title="Ayarlar">
          <label className="flex items-center gap-3 text-[14px] text-neutral-800">
            <input
              type="checkbox"
              checked={form.stackable}
              onChange={(event) => change({ stackable: event.target.checked })}
              className="h-4 w-4 accent-[color:var(--panel-accent)]"
            />
            Diğer kampanyalarla birleştirilsin
          </label>
          <label className="flex items-center gap-3 text-[14px] text-neutral-800">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => change({ active: event.target.checked })}
              className="h-4 w-4 accent-[color:var(--panel-accent)]"
            />
            Kampanya aktif
          </label>
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-tarihler"
          title="Aktif Tarihler"
          hint="Boş bırakılan tarih o yönde sınırsız demektir."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className={panelLabelClass}>Başlangıç tarihi</span>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => change({ startsAt: event.target.value })}
                className={panelFieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className={panelLabelClass}>Bitiş tarihi</span>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => change({ endsAt: event.target.value })}
                className={panelFieldClass}
              />
            </label>
          </div>
        </TrPanelEditorCard>

        {campaign ? (
          <TrPanelEditorCard id="editor-sil" title="Kampanyayı sil" tone="danger">
            <p className={panelHintClass}>Bu işlem geri alınamaz.</p>
            <TrPanelConfirmPopover
              open={confirmDelete}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => void remove()}
              message="Bu kampanya silinsin mi?"
              confirmLabel="Evet, sil"
            >
              <button
                type="button"
                disabled={saving || deleting}
                onClick={() => setConfirmDelete(true)}
                className={`${panelSecondaryBtnClass} border-red-300 text-red-800`}
              >
                Kampanyayı sil
              </button>
            </TrPanelConfirmPopover>
            {deleting ? (
              <p className="flex items-center gap-2 text-[13px] text-neutral-600">
                <TrPanelBusySpinner />
                Siliniyor…
              </p>
            ) : null}
          </TrPanelEditorCard>
        ) : null}
      </div>

      <TrCampaignProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        products={products}
        loading={!productsLoaded}
        selectedIds={form.productIds}
        onApply={(ids) => change({ productIds: ids })}
      />
    </form>
  );
}
