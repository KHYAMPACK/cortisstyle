import type {
  TrAiModelGenerateRequest,
  TrAiModelGenerateResult,
  TrAiModelProviderId,
} from "@/lib/tr/aiModel/types";

export interface TrAiModelProvider {
  id: TrAiModelProviderId;
  isConfigured(): boolean;
  generate(
    request: TrAiModelGenerateRequest & {
      modelReferenceUrls: string[];
      faceReferenceUrls: string[];
    },
  ): Promise<TrAiModelGenerateResult>;
}

const stubProvider: TrAiModelProvider = {
  id: "stub",
  isConfigured: () => true,
  async generate(request) {
    return {
      status: "not_configured",
      providerId: "stub",
      stub: true,
      error:
        request.modelReferenceUrls.length === 0
          ? "Model referans fotoğrafları henüz eklenmedi."
          : "AI model sağlayıcısı henüz bağlanmadı (stub).",
    };
  },
};

export function resolveAiModelProvider(
  preferred?: TrAiModelProviderId,
): TrAiModelProvider {
  // Future: fal / replicate when env keys exist.
  if (preferred && preferred !== "stub") {
    return stubProvider;
  }
  return stubProvider;
}
