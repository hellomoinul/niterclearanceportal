export const DEPARTMENTS = [
  { value: "TE", label: "TE – Textile Engineering" },
  { value: "IPE", label: "IPE – Industrial & Production Engineering" },
  { value: "FDAE", label: "FDAE – Fashion Design & Apparel Engineering" },
  { value: "CSE", label: "CSE – Computer Science & Engineering" },
  { value: "EEE", label: "EEE – Electrical & Electronic Engineering" },
] as const;

export const ACADEMIC_YEAR_START = 2021;
export const ACADEMIC_YEAR_COUNT = 10;

export function academicYears() {
  return Array.from({ length: ACADEMIC_YEAR_COUNT }, (_, i) => {
    const year = ACADEMIC_YEAR_START + i;
    return `${year}-${(year + 1) % 100}`;
  });
}
