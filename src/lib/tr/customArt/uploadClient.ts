export async function uploadCustomerReferencePhoto(params: {
  boutiqueId: string;
  productId: string;
  file: File;
}): Promise<{ url: string; referenceId: string }> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("boutiqueId", params.boutiqueId);
  formData.append("productId", params.productId);

  const response = await fetch("/api/tr/customer/upload-reference", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as {
    url?: string;
    referenceId?: string;
    error?: string;
  };

  if (!response.ok || !data.url || !data.referenceId) {
    throw new Error(data.error ?? "Fotoğraf yüklenemedi.");
  }

  return { url: data.url, referenceId: data.referenceId };
}
