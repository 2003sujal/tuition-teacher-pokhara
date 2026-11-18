import "server-only";
import { createHash } from "node:crypto";

type Hashable = {
  refNo: string;
  signedName: string;
  mobileNumber: string;
  acceptedAt: Date | string;
  version: string;
  contentText: string;
};

/**
 * SHA-256 over everything that matters in a signed agreement. Recomputing it
 * later and comparing with the stored hash shows the record is unchanged.
 */
export function hashAgreement(r: Hashable) {
  const payload = [
    r.refNo,
    r.signedName,
    r.mobileNumber,
    new Date(r.acceptedAt).toISOString(),
    r.version,
    r.contentText,
  ].join("\n--\n");
  return createHash("sha256").update(payload, "utf8").digest("hex");
}
