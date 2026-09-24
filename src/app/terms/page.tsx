import type { Metadata } from "next";
import {
  LegalHeading,
  LegalList,
  LegalPageShell,
  LegalParagraph,
} from "@/components/legal/LegalPageShell";
import { siteLegal } from "@/lib/siteLegal";

export const metadata: Metadata = {
  title: "Kullanım Koşulları — Cortisstyle",
  description:
    "cortisstyle.com butik vitrin hizmetlerinin kullanım koşulları.",
};

export default function TermsOfUsePage() {
  return (
    <LegalPageShell title="Kullanım Koşulları">
      <LegalParagraph>
        <strong>cortisstyle.com</strong> adresindeki butik vitrinlerini ve
        ilgili hizmetleri kullanarak bu koşulları kabul etmiş olursunuz.
        Kabul etmiyorsanız siteyi kullanmayın.
      </LegalParagraph>
      <LegalParagraph>
        <strong>İşletmeci:</strong> {siteLegal.operatorName}
        <br />
        <strong>İletişim:</strong>{" "}
        <a
          href={`mailto:${siteLegal.contactEmail}`}
          className="text-jet-black underline underline-offset-2"
        >
          {siteLegal.contactEmail}
        </a>
      </LegalParagraph>

      <LegalHeading>1. Hizmet hakkında</LegalHeading>
      <LegalParagraph>
        {siteLegal.siteName}, Türkiye’deki butikler için çok kiracılı bir
        vitrin ve pazaryeri altyapısı sunar. Ürünler satıcı butikler tarafından
        listelenir; platform aracılık rolündedir.
      </LegalParagraph>

      <LegalHeading>2. Hesaplar</LegalHeading>
      <LegalParagraph>
        Belirli özellikler için hesap gerekir. Bilgilerinizin doğruluğundan,
        kimlik bilgilerinizin güvenliğinden ve hesabınız altındaki
        faaliyetlerden siz sorumlusunuz. Koşulları ihlal eden veya hizmete /
        diğer kullanıcılara zarar veren hesaplar askıya alınabilir veya
        kapatılabilir.
      </LegalParagraph>

      <LegalHeading>3. Siparişler ve ödemeler</LegalHeading>
      <LegalParagraph>
        Satın alımlar butik / platform ödeme akışları üzerinden gerçekleşir.
        Ürün kalitesi, beden, kargo ve iade politikaları ilgili butiğin
        sorumluluğundadır; yasal metinler butik vitrinindeki{" "}
        <strong>yasal</strong> sayfalarında yer alır.
      </LegalParagraph>

      <LegalHeading>4. Yasaklı kullanımlar</LegalHeading>
      <LegalList>
        <li>Hizmeti yasa dışı amaçlarla kullanmak</li>
        <li>Diğer kullanıcıların veya butiklerin hesaplarına yetkisiz erişim</li>
        <li>Sistemi bozmaya veya aşırı yüklemeye yönelik davranışlar</li>
      </LegalList>

      <LegalHeading>5. Değişiklikler</LegalHeading>
      <LegalParagraph>
        Bu koşulları güncelleyebiliriz. Önemli değişikliklerde sitede güncel
        metin yayınlanır. Hizmeti kullanmaya devam etmeniz güncel koşulları
        kabul ettiğiniz anlamına gelir.
      </LegalParagraph>

      <LegalHeading>6. İletişim</LegalHeading>
      <LegalParagraph>
        Sorularınız için:{" "}
        <a
          href={`mailto:${siteLegal.contactEmail}`}
          className="text-jet-black underline underline-offset-2"
        >
          {siteLegal.contactEmail}
        </a>
      </LegalParagraph>
    </LegalPageShell>
  );
}
