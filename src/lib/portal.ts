export type AppRole = "student" | "office" | "admin";
export type ReviewStatus = "pending" | "approved" | "rejected";

import { supabase } from "@/integrations/supabase/client";

export const ID_DOMAIN = "niter.portal";

/** Display-only certificate ID, derived from the certificate UUID (no stored copy).
 *  `a83c2b1f-9a63-471d-bb04-1f2c3d4e5f60` -> `NCP-A83C2B1F` */
export function formatCertificateId(id: string) {
  const segment = id.split("-")[0] ?? "";
  return `NCP-${segment.toUpperCase()}`;
}
export const MAX_ATTEMPTS = 3;
export const DOCS_BUCKET = "clearance-docs";
export const SIGNATURES_BUCKET = "signatures";
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

/** Generate a portal ID (login email) from a user code. */
export function normalizeCode(code: string): string {
  return code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "");
}

export function idToEmail(userCode: string) {
  return `${userCode
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")}@${ID_DOMAIN}`;
}

export function statusLabel(status: ReviewStatus) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Resolve the certificate signature image URL.
 *  Prefers the snapshot taken at issuance (certificates.signature_id); falls back to
 *  the currently active signature; returns null when neither exists. Callers then
 *  fall back to the bundled /signature.png placeholder. */
export async function resolveSignatureUrl(
  signatureId: string | null | undefined,
): Promise<string | null> {
  const first = signatureId
    ? await supabase.from("signatures").select("storage_path").eq("id", signatureId).maybeSingle()
    : { data: null };

  const snapshotPath = first.data?.storage_path;
  if (snapshotPath) {
    return supabase.storage.from(SIGNATURES_BUCKET).getPublicUrl(snapshotPath).data.publicUrl;
  }

  const { data: active } = await supabase
    .from("signatures")
    .select("storage_path")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (active?.storage_path) {
    return supabase.storage.from(SIGNATURES_BUCKET).getPublicUrl(active.storage_path).data
      .publicUrl;
  }

  return null;
}

export function validateUpload(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only JPG, PNG or PDF files are accepted.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return `File must be smaller than ${MAX_FILE_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
}

/** Strip anything that is not a numeric digit. */
export function stripNonDigits(value: string) {
  return value.replace(/[^0-9]/g, "");
}

/** React onInput handler: keep only digits, cap at 11 (e.g. BD phone numbers). */
export function phoneInputHandler(event: React.FormEvent<HTMLInputElement>) {
  const el = event.currentTarget;
  el.value = stripNonDigits(el.value).slice(0, 11);
}
