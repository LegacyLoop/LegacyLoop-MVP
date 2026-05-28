export type ProviderName =
  | "shippo"
  | "easypost"
  | "fedex-direct"
  | "amazon-paapi"
  | "reddit-oauth"
  | "ups"
  | "usps"
  | "dhl"
  | "rainforest"
  | "meta";

export type OperationName = string;

export interface ProxyRequest {
  provider: ProviderName;
  operation: OperationName;
  params?: Record<string, unknown>;
  requestId?: string;
}

export interface ProxyResponseMeta {
  request_id: string;
  latency_ms: number;
  provider_call_id?: string;
}

export interface ProxyResponseError {
  code: string;
  message: string;
  provider_status?: number;
}

export interface ProxyResponse {
  ok: boolean;
  provider: ProviderName | "unknown";
  operation: OperationName;
  data?: unknown;
  error?: ProxyResponseError;
  meta: ProxyResponseMeta;
}
