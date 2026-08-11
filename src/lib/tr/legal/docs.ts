/**
 * Turkish consumer-facing legal documents for white-label boutiques.
 * Industry-standard drafts — lawyer review required before go-live.
 * Not legal advice.
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
  shippingNote: string | null;
  customDomain: string | null;
  /** Published on künye (normal for TR e-commerce). */
  vergiNo: string | null;
  /** Optional; leave null until boutique has KEP. */
  kepAddress: string | null;
  /** Optional; şahıs often N/A. */
  mersisNo: string | null;
  /** Boutique may send marketing SMS/email (İYS / açık rıza). */
  marketingEnabled: boolean;
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

function brandLabel(ctx: TrLegalBoutiqueContext): string {
  return ctx.name.trim() || sellerLabel(ctx);
}

export function getTrLegalDoc(
  docId: TrLegalDocId,
  ctx: TrLegalBoutiqueContext,
): TrLegalDoc {
  const seller = sellerLabel(ctx);
  const brand = brandLabel(ctx);
  const address =
    ctx.physicalAddress?.trim() ||
    "Adres, satıcı tarafından güncellenecektir.";
  const contact = [
    ctx.whatsappPhone ? `Telefon / WhatsApp: ${ctx.whatsappPhone}` : null,
    `E-posta: ${ctx.email}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const domain =
    ctx.customDomain?.trim().replace(/^www\./, "") ||
    `${ctx.slug}.cortisstyle.com`;
  const siteUrl = `https://${domain}`;
  const vergiLine = ctx.vergiNo?.trim()
    ? `Vergi kimlik no: ${ctx.vergiNo.trim()}`
    : "Vergi kimlik no: satıcı kayıtlarında güncellenecektir.";
  const kepLine = ctx.kepAddress?.trim()
    ? `KEP: ${ctx.kepAddress.trim()}`
    : "KEP adresi: henüz tanımlanmadı (ETBİS / tebligat için satıcı tarafından tamamlanacaktır).";
  const mersisLine = ctx.mersisNo?.trim()
    ? `MERSİS: ${ctx.mersisNo.trim()}`
    : "MERSİS: şahıs işletmelerinde uygulanmayabilir; varsa satıcı tarafından eklenecektir.";
  const shipping =
    ctx.shippingNote?.trim() ||
    "Siparişler, anlaşmalı kargo firması tarafından satıcının adresinden alınır ve Alıcı’nın bildirdiği adrese teslim edilir. Tahmini teslimat süresi sipariş / kargo bilgilendirmesinde paylaşılır; her hâlükârda yasal azami süreler saklıdır.";
  const returns =
    ctx.exchangePolicy?.trim() ||
    "Mesafeli satışlarda cayma hakkı, yasal istisnalar saklı kalmak kaydıyla, malın tesliminden itibaren 14 gün içinde kullanılabilir. Cayma kapsamında iade kargo ücreti satıcıya aittir (mevzuat çerçevesinde).";

  const docs: Record<TrLegalDocId, TrLegalDoc> = {
    kvkk: {
      id: "kvkk",
      title: "KVKK Aydınlatma Metni",
      summary:
        "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) m.10 kapsamında veri sorumlusu bilgilendirmesi.",
      sections: [
        {
          heading: "Veri sorumlusu",
          paragraphs: [
            `Veri sorumlusu: ${seller} (marka: ${brand}).`,
            address,
            contact,
            vergiLine,
            `İnternet sitesi: ${siteUrl}`,
          ],
        },
        {
          heading: "İşlenen kişisel veriler",
          paragraphs: [
            "Kimlik ve iletişim: ad soyad, e-posta, telefon.",
            "Teslimat / fatura: adres bilgileri; kurumsal fatura talebinde unvan, VKN/TCKN, vergi dairesi.",
            "İşlem güvenliği: oturum, cihaz / log kayıtları, çerez kimlikleri (zorunlu çerezler).",
            "Sipariş ve ödeme: sipariş içeriği, tutar, ödeme durumu; kart verileri ödeme kuruluşu nezdinde işlenir (satıcı kart CVV saklamaz).",
            "Müşteri hizmetleri: WhatsApp / e-posta yazışma içeriği.",
          ],
        },
        {
          heading: "Amaçlar ve hukuki sebepler",
          paragraphs: [
            "Sözleşmenin kurulması ve ifası (sipariş, teslimat, iade, üyelik).",
            "Yasal yükümlülükler (vergi, tüketici, e-ticaret kayıtları).",
            "Meşru menfaat: dolandırıcılık önleme, site güvenliği, hizmet iyileştirme (temel hak ve özgürlüklere zarar vermemek kaydıyla).",
            ctx.marketingEnabled
              ? "Ticari elektronik ileti (SMS / e-posta / bildirim): yalnızca açık rızanız ve İYS kuralları çerçevesinde; aydınlatma metni ile açık rıza aynı onay kutusunda birleştirilmez."
              : "Pazarlama iletileri gönderilmeyecekse bu amaç için veri işlenmez; ileride başlanırsa ayrı açık rıza alınır.",
          ],
        },
        {
          heading: "Aktarım",
          paragraphs: [
            "Veriler; barındırma / altyapı, ödeme kuruluşu, kargo / lojistik, e-posta ve bildirim sağlayıcıları ile yalnızca hizmetin ifası için ve gerekli ölçüde paylaşılabilir.",
            "Yasal zorunluluk halinde yetkili kamu kurum ve kuruluşlarına aktarılabilir.",
            "Yurt dışı aktarım söz konusu olursa KVKK’daki şartlara uygun hareket edilir.",
          ],
        },
        {
          heading: "Saklama",
          paragraphs: [
            "Veriler, işleme amacının gerektirdiği süre ve ilgili mevzuattaki zamanaşımı / saklama süreleri boyunca tutulur; süre sonunda silinir, yok edilir veya anonim hale getirilir.",
          ],
        },
        {
          heading: "Haklarınız (KVKK m.11)",
          paragraphs: [
            "Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme / yok etme, itiraz ve zarar halinde tazminat talep etme haklarınız vardır.",
            `Başvurularınızı ${ctx.email} veya yukarıdaki iletişim kanallarından iletebilirsiniz. Başvurular yasal süreler içinde yanıtlanır.`,
          ],
        },
      ],
    },
    gizlilik: {
      id: "gizlilik",
      title: "Gizlilik Politikası",
      summary: `${brand} çevrimiçi mağazasında kişisel verilerin korunmasına ilişkin özet politika.`,
      sections: [
        {
          heading: "Kapsam",
          paragraphs: [
            `Bu politika, ${seller} tarafından ${siteUrl} üzerinden işletilen mağazaya ilişkindir.`,
            "Ayrıntılı bilgilendirme için KVKK Aydınlatma Metni’ne bakınız.",
          ],
        },
        {
          heading: "Toplama",
          paragraphs: [
            "Bilgiler; üyelik, sipariş, iletişim formları, çerezler ve müşteri hizmetleri kanalları üzerinden toplanır.",
          ],
        },
        {
          heading: "Paylaşım ve güvenlik",
          paragraphs: [
            "Veriler üçüncü kişilere yalnızca hizmet sağlayıcılar (ödeme, kargo, barındırma, e-posta) ve yasal zorunluluklar çerçevesinde aktarılabilir.",
            "Teknik ve idari tedbirlerle yetkisiz erişim, kayıp ve değişiklik riskleri azaltılır. Kart ödemeleri yetkili ödeme kuruluşları üzerinden yürütülür.",
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
          heading: "Çerez nedir?",
          paragraphs: [
            "Çerezler, siteyi ziyaret ettiğinizde cihazınıza kaydedilen küçük metin dosyalarıdır. Oturum, sepet ve güvenlik için gereklidirler veya istatistik / tercih amaçlı kullanılabilirler.",
          ],
        },
        {
          heading: "Çerez türleri",
          paragraphs: [
            "Zorunlu çerezler: oturum, sepet, kimlik doğrulama ve güvenlik için gereklidir; site çalışması için kapatılamazlar.",
            "İşlevsel / analitik çerezler: deneyimi iyileştirmek ve anonimleştirilmiş istatistik toplamak için kullanılabilir; açık rıza gerektirenler için tercih mekanizması sunulur.",
            "Pazarlama çerezleri: kullanılıyorsa yalnızca rızanızla etkinleşir.",
          ],
        },
        {
          heading: "Yönetim",
          paragraphs: [
            "Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezler olmadan site bazı işlevleri (sepet, giriş) sunamayabilir.",
          ],
        },
      ],
    },
    "mesafeli-satis": {
      id: "mesafeli-satis",
      title: "Mesafeli Satış Sözleşmesi",
      summary:
        "6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği çerçevesinde (taslak).",
      sections: [
        {
          heading: "Taraflar",
          paragraphs: [
            `Satıcı: ${seller} (marka: ${brand}). ${address}. ${contact}. ${vergiLine}.`,
            "Alıcı / Tüketici: Sipariş formunda belirtilen kişi.",
          ],
        },
        {
          heading: "Konu",
          paragraphs: [
            "Sözleşme, Alıcı’nın elektronik ortamda sipariş verdiği ürün(ler)in satışı ve teslimine ilişkindir. Ürünün temel nitelikleri, vergiler dahil fiyatı ve varsa kargo bedeli sipariş özetinde yer alır.",
          ],
        },
        {
          heading: "Sözleşmenin kurulması",
          paragraphs: [
            "Alıcı; ön bilgilendirme formunu ve bu sözleşmeyi elektronik ortamda onaylayarak siparişi tamamladığında sözleşme kurulmuş sayılır. Sipariş özeti kalıcı veri saklayıcısı ile (e-posta vb.) Alıcı’ya iletilir.",
            "Satıcı, onaylanmış sözleşme / sipariş kayıtlarını mevzuattaki süreler boyunca saklar.",
          ],
        },
        {
          heading: "Ödeme",
          paragraphs: [
            "Ödeme, sitede sunulan yöntemlerle (kart / havale / diğer açıklanan yöntemler) yapılır. Kart ile ödeme açıldığında işlem yetkili ödeme kuruluşu üzerinden gerçekleşir.",
          ],
        },
        {
          heading: "Teslimat",
          paragraphs: [
            shipping,
            "Teslimat, aksi kararlaştırılmadıkça Alıcı’nın bildirdiği adrese yapılır. Mal satışlarında yasal azami teslimat süresi (kural olarak otuz gün) saklıdır; mücbir sebep halleri ayrıca değerlendirilir.",
          ],
        },
        {
          heading: "Cayma hakkı",
          paragraphs: [
            returns,
            "Cayma hakkının istisnaları (kişisel ihtiyaçlara özel üretilen mallar, hijyen nedeniyle iadesi uygun olmayan ürünler vb.) Mesafeli Sözleşmeler Yönetmeliği’nde yer alan hallerde uygulanır.",
            "Cayma bildirimi yazılı veya kalıcı veri saklayıcısı ile satıcıya iletilir.",
          ],
        },
        {
          heading: "Uyuşmazlık",
          paragraphs: [
            "Şikayet ve talepler satıcı iletişim kanallarından iletilebilir. Tüketici uyuşmazlıklarında Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.",
          ],
        },
      ],
    },
    "on-bilgilendirme": {
      id: "on-bilgilendirme",
      title: "Ön Bilgilendirme Formu",
      summary:
        "Mesafeli Sözleşmeler Yönetmeliği m.5 kapsamında sipariş öncesi bilgilendirme (taslak).",
      sections: [
        {
          heading: "Satıcı bilgileri",
          paragraphs: [
            `${seller} (marka: ${brand})`,
            address,
            contact,
            vergiLine,
            siteUrl,
          ],
        },
        {
          heading: "Malın temel nitelikleri ve fiyat",
          paragraphs: [
            "Ürünün temel özellikleri ürün sayfasında ve sipariş özetinde gösterilir.",
            "Satış fiyatı vergiler dahil olarak TL cinsinden belirtilir; varsa kargo bedeli sipariş / ödeme ekranında ayrıca gösterilir.",
          ],
        },
        {
          heading: "Ödeme ve teslimat",
          paragraphs: [
            "Ödeme yöntemleri ödeme adımında listelenir.",
            shipping,
          ],
        },
        {
          heading: "Cayma, iade ve şikayet",
          paragraphs: [
            returns,
            "İade süreci ve istisnalar için İade & Cayma sayfasına bakınız.",
            "Şikayetleriniz için satıcı iletişim kanallarını kullanabilirsiniz. Tüketici Hakem Heyetleri / Tüketici Mahkemeleri başvuru mercileridir.",
          ],
        },
        {
          heading: "Onay",
          paragraphs: [
            "Siparişi tamamlamadan önce bu ön bilgilendirmeyi ve mesafeli satış sözleşmesini okuyup onaylamanız gerekir. Onay verilmeden sipariş alınmaz.",
          ],
        },
      ],
    },
    iade: {
      id: "iade",
      title: "İade ve İade Politikası",
      summary:
        "Mesafeli satışlarda cayma / iade koşulları, süreler, ücretler ve bedel iadesi.",
      sections: [
        {
          heading: "Kapsam",
          paragraphs: [
            `Bu iade politikası ${brand} (${seller}) tarafından Türkiye’de mesafeli satış yoluyla satılan ürünler için geçerlidir.`,
            "Cayma hakkı (vazgeçme) ve ayıplı mal halleri 6502 sayılı Kanun ile Mesafeli Sözleşmeler Yönetmeliği çerçevesinde uygulanır.",
          ],
        },
        {
          heading: "İade süresi (14 gün)",
          paragraphs: [
            returns,
            "Süre, malın Alıcı’ya veya belirlediği kişiye teslim edildiği günden itibaren işlemeye başlar.",
            "Bu süre içinde cayma / iade talebi iletilebilir; yalnızca kusurlu ürünler için değil, sebepsiz cayma (vazgeçme) için de geçerlidir (yasal istisnalar saklıdır).",
          ],
        },
        {
          heading: "İade nasıl yapılır",
          paragraphs: [
            `İade / cayma bildirimi e-posta (${ctx.email}), WhatsApp${ctx.whatsappPhone ? ` (${ctx.whatsappPhone})` : ""} veya yazılı / kalıcı veri saklayıcısı ile satıcıya iletilir.`,
            "Bildirimde sipariş numarası, iade edilmek istenen ürün(ler) ve mümkünse iade nedeni belirtilmelidir.",
            "Satıcı, iade adresini ve varsa anlaşmalı kargo yönlendirmesini bildirir; ürün bu talimata göre gönderilir.",
          ],
        },
        {
          heading: "Ürün durumu",
          paragraphs: [
            "Ürün; kullanılmamış, yeniden satılabilir durumda, mümkünse orijinal ambalajı ve varsa faturası / teslimat belgesi ile iade edilmelidir.",
            "Hijyen nedeniyle iadesi uygun olmayan ürünler, kişiye özel üretilen mallar ve mevzuattaki diğer istisnalar cayma kapsamı dışında kalabilir.",
          ],
        },
        {
          heading: "İade adresi ve kargo ücreti",
          paragraphs: [
            `İade adresi (satıcı): ${address}`,
            "Cayma hakkı kapsamındaki iadelerde iade kargo ücreti, mevzuat çerçevesinde satıcıya aittir. Ayıplı / hasarlı ürünlerde Alıcı’dan ek kargo bedeli talep edilmez.",
            "Yeniden stoklama (restocking) ücreti alınmaz.",
          ],
        },
        {
          heading: "Bedel iadesi",
          paragraphs: [
            "Onaylanan cayma / iadelerde ödenen bedel, mevzuatta öngörülen süre içinde (kural olarak malın satıcıya ulaşmasından itibaren on dört gün içinde) Alıcı’nın ödeme yaptığı yönteme iade edilir.",
            "Ayıplı mal halinde 6502 sayılı Kanun’daki seçimlik haklar saklıdır.",
          ],
        },
        {
          heading: "Değişim",
          paragraphs: [
            "Beden / model değişimi, stok durumuna göre satıcının takdirinde veya karşılıklı anlaşma ile yapılabilir. Değişim koşulları müşteri hizmetleri üzerinden netleştirilir.",
          ],
        },
        {
          heading: "İletişim",
          paragraphs: [
            `Satıcı: ${seller} (marka: ${brand}).`,
            address,
            contact,
            "Şikayet ve uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.",
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
            `Üyelik, ${brand} mağazasında alışveriş, sipariş takibi ve favoriler için oluşturulabilir.`,
            "Hesap bilgilerinizin doğruluğundan siz sorumlusunuz. Aynı e-posta ve şifre ile bu platformdaki diğer mağazalarda da giriş yapılabilir; sepet, favori ve siparişler mağaza bazında ayrı tutulur.",
            "Şifre sıfırlama tüm mağazalar için geçerlidir.",
          ],
        },
        {
          heading: "Kişisel veriler",
          paragraphs: [
            "Üyelik kapsamında işlenen kişisel veriler KVKK Aydınlatma Metni’ne tabidir.",
          ],
        },
        {
          heading: "Yasaklar ve sona erme",
          paragraphs: [
            "Hesabın kötüye kullanımı, sahte bilgi veya mevzuata aykırı kullanım halinde üyelik askıya alınabilir veya sonlandırılabilir.",
            "Hesabınızı kapatma talebinizi satıcı iletişim kanallarından iletebilirsiniz.",
          ],
        },
      ],
    },
    kunye: {
      id: "kunye",
      title: "Künye / İletişim",
      summary: "Satıcı kimlik ve iletişim bilgileri (e-ticaret bilgilendirme).",
      sections: [
        {
          heading: "İşletme",
          paragraphs: [
            `Marka: ${brand}`,
            `Satıcı (yasal ad): ${seller}`,
            `Adres: ${address}`,
            contact,
            vergiLine,
            mersisLine,
            kepLine,
            `Web: ${siteUrl}`,
            "İşletme türü: şahıs işletmesi olabilir; MERSİS / KEP bilgileri mevcut oldukça güncellenir.",
          ],
        },
        {
          heading: "Not",
          paragraphs: [
            `İletişim e-postası şu an ${ctx.email} olarak gösterilmektedir; gerçek posta kutusu açılana kadar WhatsApp birincil iletişim kanalı olabilir.`,
            "ETBİS kaydı ve diğer idari yükümlülükler satıcı / danışman tarafından tamamlanır.",
          ],
        },
      ],
    },
  };

  return docs[docId];
}
