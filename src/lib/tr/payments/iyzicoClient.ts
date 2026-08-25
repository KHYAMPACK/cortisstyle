import { createHmac, randomBytes } from "node:crypto";
import type { TrIyzicoCredentials } from "@/lib/tr/payments/registry";

const INIT_PATH = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
const RETRIEVE_PATH = "/payment/iyzipos/checkoutform/auth/ecom/detail";

export class IyzicoError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "IyzicoError";
    this.status = status;
  }
}

type JsonRecord = Record<string, unknown>;

function authorizationHeader(
  creds: TrIyzicoCredentials,
  uri: string,
  bodyString: string,
  randomKey: string,
): string {
  const signature = createHmac("sha256", creds.secretKey)
    .update(randomKey + uri + bodyString)
    .digest("hex");
  const payload = [
    `apiKey:${creds.apiKey}`,
    `randomKey:${randomKey}`,
    `signature:${signature}`,
  ].join("&");
  return `IYZWSv2 ${Buffer.from(payload).toString("base64")}`;
}

async function iyzicoPost<T>(
  creds: TrIyzicoCredentials,
  path: string,
  body: JsonRecord,
): Promise<T> {
  const bodyString = JSON.stringify(body);
  const randomKey = randomBytes(8).toString("hex");
  const response = await fetch(`${creds.baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: authorizationHeader(creds, path, bodyString, randomKey),
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-iyzi-rnd": randomKey,
    },
    body: bodyString,
  });

  const text = await response.text();
  let parsed: JsonRecord;
  try {
    parsed = JSON.parse(text) as JsonRecord;
  } catch {
    throw new IyzicoError(
      `iyzico yanıtı okunamadı (${response.status}).`,
      response.status || 502,
    );
  }

  if (!response.ok) {
    const message =
      (typeof parsed.errorMessage === "string" && parsed.errorMessage) ||
      `iyzico HTTP ${response.status}`;
    throw new IyzicoError(message, response.status);
  }

  return parsed as T;
}

export type IyzicoInitializeResult = {
  status?: string;
  errorMessage?: string;
  token?: string;
  paymentPageUrl?: string;
  conversationId?: string;
};

export type IyzicoRetrieveResult = {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  paymentStatus?: string;
  paymentId?: string | number;
  conversationId?: string;
  basketId?: string;
  token?: string;
  paidPrice?: string | number;
  currency?: string;
  mdStatus?: string | number;
};

export async function iyzicoInitializeCheckoutForm(
  creds: TrIyzicoCredentials,
  body: JsonRecord,
): Promise<IyzicoInitializeResult> {
  return iyzicoPost<IyzicoInitializeResult>(creds, INIT_PATH, body);
}

export async function iyzicoRetrieveCheckoutForm(
  creds: TrIyzicoCredentials,
  input: { token: string; conversationId?: string },
): Promise<IyzicoRetrieveResult> {
  const body: JsonRecord = {
    locale: "tr",
    token: input.token,
  };
  if (input.conversationId) {
    body.conversationId = input.conversationId;
  }
  return iyzicoPost<IyzicoRetrieveResult>(creds, RETRIEVE_PATH, body);
}
