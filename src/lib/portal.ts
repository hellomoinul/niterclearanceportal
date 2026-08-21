export type AppRole = "student" | "staff" | "admin";
export type ReviewStatus = "pending" | "approved" | "rejected";

export const ID_DOMAIN = "niter.portal";
export const MAX_ATTEMPTS = 3;
export const MAX_FILE_MB = 5;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

/** UCAM-style sign in: students and staff type an ID, never an email. */
export function idToEmail(userCode: string) {
  return `${userCode.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "")}@${ID_DOMAIN}`;
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

export function validateFile(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only JPG, PNG or PDF files are accepted.";
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `File must be smaller than ${MAX_FILE_MB} MB.`;
  }
  return null;
}
