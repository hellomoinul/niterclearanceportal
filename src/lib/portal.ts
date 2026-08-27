export type AppRole = "student" | "registrar" | "admin";
export type ReviewStatus = "pending" | "approved" | "rejected";

export const ID_DOMAIN = "niter.portal";
export const MAX_ATTEMPTS = 3;
export const DOCS_BUCKET = "clearance-docs";
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

<<<<<<< HEAD
/** UCAM-style sign in: students and registrars type an ID, never an email. */
=======
/** Generate a portal ID (login email) from a user code. */
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
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

export function validateUpload(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only JPG, PNG or PDF files are accepted.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return `File must be smaller than ${MAX_FILE_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
}
<<<<<<< HEAD
=======

/** Strip anything that is not a numeric digit. */
export function stripNonDigits(value: string) {
  return value.replace(/[^0-9]/g, "");
}

/** React onInput handler: keep only digits, cap at 11 (e.g. BD phone numbers). */
export function phoneInputHandler(
  event: React.FormEvent<HTMLInputElement>
) {
  const el = event.currentTarget;
  el.value = stripNonDigits(el.value).slice(0, 11);
}
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
