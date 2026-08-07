/**
 * Opens a print-friendly HTML document in a new window and triggers print.
 * Used for demo kargo etiketleri and e-fatura önizleme.
 */
export function printHtmlDocument(html: string, title: string): void {
  if (typeof window === "undefined") return;

  const popup = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
  if (!popup) {
    throw new Error(
      "Yazdırma penceresi açılamadı. Tarayıcı pop-up engelini kaldırıp tekrar deneyin.",
    );
  }

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.document.title = title;

  const triggerPrint = () => {
    try {
      popup.focus();
      popup.print();
    } catch {
      /* ignore */
    }
  };

  if (popup.document.readyState === "complete") {
    window.setTimeout(triggerPrint, 250);
  } else {
    popup.addEventListener("load", () => {
      window.setTimeout(triggerPrint, 250);
    });
  }
}
