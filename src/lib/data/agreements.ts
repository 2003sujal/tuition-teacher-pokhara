import "server-only";
import { connectDB } from "../mongodb";
import { hashAgreement } from "../agreement-record";
import type { AgreementContent } from "../agreement";
import { SignedAgreement } from "@/models/SignedAgreement";

export type SignedAgreementRow = {
  id: string;
  refNo: string;
  tutorId: string;
  tutorApplicationId: string;
  signedName: string;
  mobileNumber: string;
  acceptedAt: string;
  version: string;
};

export type SignedAgreementDetail = SignedAgreementRow & {
  content: AgreementContent;
  contentText: string;
  contentHash: string;
  ipAddress: string;
  userAgent: string;
  citizenship: { fileName: string; fileType: string; fileSize: number; sha256: string } | null;
  /** True when the stored hash still matches the stored record. */
  intact: boolean;
};

type Lean = {
  _id: unknown;
  refNo: string;
  tutorId: unknown;
  tutorApplicationId?: string;
  signedName: string;
  mobileNumber: string;
  acceptedAt: Date;
  version: string;
};

const ROW = "refNo tutorId tutorApplicationId signedName mobileNumber acceptedAt version";

function toRow(a: Lean): SignedAgreementRow {
  return {
    id: String(a._id),
    refNo: a.refNo,
    tutorId: String(a.tutorId),
    tutorApplicationId: a.tutorApplicationId ?? "",
    signedName: a.signedName,
    mobileNumber: a.mobileNumber,
    acceptedAt: new Date(a.acceptedAt).toISOString(),
    version: a.version,
  };
}

export async function listSignedAgreements(limit = 500) {
  await connectDB();
  const rows = await SignedAgreement.find().select(ROW).sort({ acceptedAt: -1 }).limit(limit).lean<Lean[]>();
  return rows.map(toRow);
}

export async function getTutorAgreements(tutorId: string) {
  await connectDB();
  const rows = await SignedAgreement.find({ tutorId }).select(ROW).sort({ acceptedAt: -1 }).lean<Lean[]>();
  return rows.map(toRow);
}

/** Private file id of the attached citizenship certificate (server use only). */
export async function getCitizenshipPublicId(id: string) {
  await connectDB();
  const a = await SignedAgreement.findById(id).select("citizenshipPublicId").lean<{ citizenshipPublicId?: string } | null>();
  return a?.citizenshipPublicId || null;
}

export async function getSignedAgreement(id: string): Promise<SignedAgreementDetail | null> {
  await connectDB();
  const a = await SignedAgreement.findById(id).lean<
    (Lean & {
        content: AgreementContent;
        contentText: string;
        contentHash: string;
        ipAddress?: string;
        userAgent?: string;
        citizenshipPublicId?: string;
        citizenshipFileName?: string;
        citizenshipFileType?: string;
        citizenshipFileSize?: number;
        citizenshipSha256?: string;
      })
    | null
  >();
  if (!a) return null;
  const row = toRow(a);
  return {
    ...row,
    content: a.content,
    contentText: a.contentText,
    contentHash: a.contentHash,
    ipAddress: a.ipAddress ?? "",
    userAgent: a.userAgent ?? "",
    citizenship: a.citizenshipPublicId
      ? {
          fileName: a.citizenshipFileName ?? "",
          fileType: a.citizenshipFileType ?? "",
          fileSize: a.citizenshipFileSize ?? 0,
          sha256: a.citizenshipSha256 ?? "",
        }
      : null,
    intact:
      hashAgreement({
        refNo: a.refNo,
        signedName: a.signedName,
        mobileNumber: a.mobileNumber,
        acceptedAt: a.acceptedAt,
        version: a.version,
        contentText: a.contentText,
        citizenshipSha256: a.citizenshipSha256,
      }) === a.contentHash,
  };
}
