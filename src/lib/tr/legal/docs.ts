/**
 * Turkish consumer-facing legal documents for white-label boutiques.
 * Draft copy — lawyer review required before go-live.
 */

export const TR_LEGAL_DOC_IDS = [
  "kvkk",
  "gizlilik",
  "cerez",
  "mesafeli-satis",
  "on-bilgilendirme",
  "iade",
  "uyelik",
  "kunye",
] as const;

export type TrLegalDocId = (typeof TR_LEGAL_DOC_IDS)[number];

export function isTrLegalDocId(value: string): value is TrLegalDocId {
  return (TR_LEGAL_DOC_IDS as readonly string[]).includes(value);
}

export type TrLegalBoutiqueContext = {
  name: string;
  legalName: string | null;
  slug: string;
  physicalAddress: string | null;
  whatsappPhone: string | null;
  email: string;
  exchangePolicy: string | null;
  customDomain: string | null;
};

export type TrLegalDoc = {
  id: TrLegalDocId;
  title: string;
  summary: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
};

function sellerLabel(ctx: TrLegalBoutiqueContext): string {
  return ctx.legalName?.trim() || ctx.name;
}

export function getTrLegalDoc(
  docId: TrLegalDocId,
  ctx: TrLegalBoutiqueContext,
): TrLegalDoc {
  const seller = sellerLabel(ctx);
  const address = ctx.physicalAddress?.trim() || "Adres güncellenecek";
  const contact = [
    ctx.whatsappPhone ? `Telefon: ${ctx.whatsappPhone}` : null,
    `E-posta: ${ctx.email}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const domain = ctx.customDomain?.trim() || `${ctx.slug}.cortisstyle.com`;
  const returns =
    ctx.exchangePolicy?.trim() ||
    "Mesafeli satışlarda cayma hakkı, yasal istisnalar saklı kalmak kaydıyla, malın tesliminden itibaren 14 gün içinde kullanılabilir.";

  const docs: Record<TrLegalDocId, TrLegalDoc> = {
    kvkk: {
      id: "kvkk",
      title: "KVKK Aydınlatma Metni",
      summary:
        "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu bilgilendirmesi.",
      sections: [
        {
          heading: "Veri sorumlusu",
          paragraphs: [
            `${seller}, ${address}. ${contact}`,
            `İnternet sitesi: ${domain}`,
          ],
        },
        {
          heading: "İşlenen veriler ve amaçlar",
          paragraphs: [
            "Sipariş, üyelik, müşteri hizmetleri ve yasal yükümlülükler kapsamında ad-soyad, iletişim, teslimat adresi, sipariş ve ödeme kayıtları işlenebilir.",
            "Veriler; sözleşmenin ifası, meşru menfaat ve hukuki yükümlülük hukuki sebeplerine dayanılarak işlenir.",
          ],
        },
        {
          heading: "Haklarınız",
          paragraphs: [
            "KVKK m.11 kapsamındaki haklarınızı yukarıdaki iletişim kanallarından kullanabilirsiniz. Başvurular yasal süreler içinde yanıtlanır.",
          ],
        },
      ],
    },
    gizlilik: {
      id: "gizlilik",
      title: "Gizlilik Politikası",
      summary: "Kişisel verilerinizin nasıl korunduğuna dair özet politika.",
      sections: [
        {
          heading: "Kapsam",
          paragraphs: [
            `Bu politika, ${seller} tarafından işletilen çevrimiçi mağazada toplanan bilgilere ilişkindir.`,
            "Veriler üçüncü kişilere, yalnızca hizmet sağlayıcılar (ödeme, kargo, barındırma) ve yasal zorunluluklar çerçevesinde aktarılabilir.",
          ],
        },
        {
          heading: "Güvenlik",
          paragraphs: [
            "Teknik ve idari tedbirlerle yetkisiz erişim, kayıp ve değişiklik riskleri azaltılır. Ödeme işlemleri yetkili ödeme kuruluşları üzerinden yürütülür.",
          ],
        },
      ],
    },
    cerez: {
      id: "cerez",
      title: "Çerez Politikası",
      summary: "Sitede kullanılan çerezler ve tercihleriniz.",
      sections: [
        {
          heading: "Çerez türleri",
          paragraphs: [
            "Zorunlu çerezler: oturum, sepet ve güvenlik için gereklidir.",
            "İşlevsel / analitik çerezler: deneyimi iyileştirmek ve istatistik toplamak için kullanılabilir; açık rıza gerektirenler için tercih paneli sunulur.",
          ],
        },
        {
          heading: "Yönetim",
          paragraphs: [
            "Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezler olmadan site bazı işlevleri sunamayabilir.",
          ],
        },
      ],
    },
    "mesafeli-satis": {
      id: "mesafeli-satis",
      title: "Mesafeli Satış Sözleşmesi",
      summary: "6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği çerçevesinde.",
      sections: [
        {
          heading: "Taraflar",
          paragraphs: [
            `Satıcı: ${seller}, ${address}. ${contact}`,
            "Alıcı: Sipariş formunda belirtilen kişi.",
          ],
        },
        {
          heading: "Konu",
          paragraphs: [
            "Sözleşme, Alıcı’nın elektronik ortamda sipariş verdiği ürün(ler)in satışı ve teslimine ilişkindir. Ürün nitelikleri, fiyatı ve kargo bilgisi sipariş özetinde yer alır.",
          ],
        },
        {
          heading: "Ödeme ve teslimat",
          paragraphs: [
            "Ödeme, sitede sunulan yöntemlerle yapılır. Teslimat, Alıcı’nın bildirdiği adrese kargo ile yapılır; süre ve kargo koşulları sipariş ekranında belirtilir.",
          ],
        },
        {
          heading: "Cayma hakkı",
          paragraphs: [
            returns,
            "Cayma hakkının istisnaları (kişisel ihtiyaçlara özel üretilen mallar, hijyenik ürünler vb.) mevzuatta yer alan hallerde uygulanır.",
          ],
        },
      ],
    },
    "on-bilgilendirme": {
      id: "on-bilgilendirme",
      title: "Ön Bilgilendirme Formu",
      summary: "Sipariş öncesi zorunlu bilgilendirme özeti.",
      sections: [
        {
          heading: "Satıcı bilgileri",
          paragraphs: [`${seller} · ${address} · ${contact}`],
        },
        {
          heading: "Ürün ve fiyat",
          paragraphs: [
            "Ürün temel özellikleri, vergi dahil satış fiyatı ve varsa kargo bedeli sipariş sepeti / ödeme sayfasında gösterilir.",
          ],
        },
        {
          heading: "Cayma ve şikayet",
          paragraphs: [
            returns,
            "Şikayet ve taleplerinizi satıcı iletişim kanallarından iletebilirsiniz. Tüketici uyuşmazlıklarında Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.",
          ],
        },
      ],
    },
    iade: {
      id: "iade",
      title: "İade, Cayma ve Değişim",
      summary: "Yasal cayma hakkı ve değişim süreçleri.",
      sections: [
        {
          heading: "Cayma hakkı",
          paragraphs: [
            returns,
            "Cayma bildirimi yazılı veya kalıcı veri saklayıcısı ile yapılabilir. Ürün, kullanılmamış ve yeniden satılabilir durumda, fatura ve ambalajıyla birlikte iade edilmelidir (istisnalar saklıdır).",
          ],
        },
        {
          heading: "İade süreci",
          paragraphs: [
            "Onaylanan iadelerde bedel, mevzuatta öngörülen süre içinde Alıcı’nın ödeme yaptığı yönteme iade edilir.",
            "Ayıplı mal halinde 6502 sayılı Kanun’daki seçimlik haklar saklıdır.",
          ],
        },
      ],
    },
    uyelik: {
      id: "uyelik",
      title: "Üyelik Sözleşmesi",
      summary: "Hesap oluşturma ve kullanım şartları.",
      sections: [
        {
          heading: "Hesap",
          paragraphs: [
            `Üyelik, ${seller} mağazasında alışveriş ve sipariş takibi için oluşturulur. Hesap bilgilerinizin doğruluğundan siz sorumlusunuz.`,
            "Aynı e-posta ile Cortisstyle ekosistemindeki diğer butiklerde de giriş yapılabilir; kayıt kaynağı sistemde saklanır.",
          ],
        },
        {
          heading: "Yasaklar",
          paragraphs: [
            "Hesabın kötüye kullanımı, sahte bilgi veya mevzuata aykırı kullanım halinde üyelik askıya alınabilir veya sonlandırılabilir.",
          ],
        },
      ],
    },
    kunye: {
      id: "kunye",
      title: "Künye / İletişim",
      summary: "Satıcı kimlik ve iletişim bilgileri.",
      sections: [
        {
          heading: "İşletme",
          paragraphs: [
            `Ticari unvan / marka: ${seller}`,
            `Adres: ${address}`,
            contact,
            `Web: ${domain}`,
            "Vergi kimlik bilgileri vergi levhası alındığında bu sayfada yayınlanacaktır.",
          ],
        },
      ],
    },
  };

  return docs[docId];
}
