import { createHash, createHmac } from "node:crypto";
import type { Adapter } from "../base";
import { envPresent } from "../base";

const OPERATIONS = ["search_items", "get_browse_nodes"] as const;
const HOST = "webservices.amazon.com";
const REGION = "us-east-1";
const SERVICE = "ProductAdvertisingAPI";

interface SignedRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

function signPaapiRequest(
  targetSuffix: string,
  path: string,
  payload: object,
): SignedRequest {
  const ACCESS = process.env.PAAPI5_ACCESS_KEY!;
  const SECRET = process.env.PAAPI5_SECRET_KEY!;
  const target = `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${targetSuffix}`;
  const body = JSON.stringify(payload);
  const amzDate = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const dateStamp = amzDate.substr(0, 8);
  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${HOST}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;
  const signedHeaders =
    "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const payloadHash = createHash("sha256").update(body).digest("hex");
  const canonicalRequest = `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n` +
    createHash("sha256").update(canonicalRequest).digest("hex");
  const kDate = createHmac("sha256", "AWS4" + SECRET)
    .update(dateStamp)
    .digest();
  const kRegion = createHmac("sha256", kDate).update(REGION).digest();
  const kService = createHmac("sha256", kRegion).update(SERVICE).digest();
  const kSigning = createHmac("sha256", kService)
    .update("aws4_request")
    .digest();
  const signature = createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");
  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${ACCESS}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return {
    url: `https://${HOST}${path}`,
    headers: {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      "x-amz-date": amzDate,
      "x-amz-target": target,
      authorization: authHeader,
    },
    body,
  };
}

export const amazonPaapiAdapter: Adapter = {
  provider: "amazon-paapi",
  enabled: envPresent(
    "PAAPI5_ACCESS_KEY",
    "PAAPI5_SECRET_KEY",
    "PAAPI5_PARTNER_TAG",
  ),
  operations: OPERATIONS,
  async call(operation, params) {
    const TAG = process.env.PAAPI5_PARTNER_TAG!;
    if (operation === "search_items") {
      const signed = signPaapiRequest(
        "SearchItems",
        "/paapi5/searchitems",
        {
          PartnerTag: TAG,
          PartnerType: "Associates",
          Marketplace: "www.amazon.com",
          ...params,
        },
      );
      const r = await fetch(signed.url, {
        method: "POST",
        headers: signed.headers,
        body: signed.body,
      });
      if (!r.ok) throw new Error(`amazon-paapi ${r.status}`);
      return await r.json();
    }
    if (operation === "get_browse_nodes") {
      const signed = signPaapiRequest(
        "GetBrowseNodes",
        "/paapi5/getbrowsenodes",
        {
          PartnerTag: TAG,
          PartnerType: "Associates",
          Marketplace: "www.amazon.com",
          ...params,
        },
      );
      const r = await fetch(signed.url, {
        method: "POST",
        headers: signed.headers,
        body: signed.body,
      });
      if (!r.ok) throw new Error(`amazon-paapi ${r.status}`);
      return await r.json();
    }
    throw new Error(`amazon-paapi: unknown operation ${operation}`);
  },
};
