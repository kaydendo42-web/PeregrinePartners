import type { NormalizedImportRow, DuplicateCandidate } from "./types.ts";
export function canonicalRowFingerprint(row: NormalizedImportRow): string {
  return JSON.stringify([
    row.business.name.toLowerCase(),
    row.business.location.toLowerCase(),
    row.business.industry.toLowerCase(),
    row.business.website,
    row.contact,
    row.notes,
    row.source,
  ]);
}
function domain(url: string | null) {
  try {
    return new URL(url ?? "").hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}
function phone(value: string | null) {
  return (value ?? "").replace(/[^+\d]/g, "");
}
export function findCandidates(
  row: NormalizedImportRow,
  existing: (NormalizedImportRow & { id?: string })[],
): DuplicateCandidate[] {
  return existing.flatMap((candidate) => {
    const reasons: string[] = [];
    if (
      row.business.name &&
      row.business.name.toLowerCase() === candidate.business.name.toLowerCase()
    )
      reasons.push("Business name");
    if (
      row.contact.email &&
      row.contact.email.toLowerCase() === candidate.contact.email?.toLowerCase()
    )
      reasons.push("Email");
    if (
      phone(row.contact.phone) &&
      phone(row.contact.phone) === phone(candidate.contact.phone)
    )
      reasons.push("Phone");
    if (
      domain(row.business.website) &&
      domain(row.business.website) === domain(candidate.business.website)
    )
      reasons.push("Website domain");
    return reasons.length
      ? [
          {
            id: candidate.id ?? null,
            rowNumber: candidate.rowNumber,
            name: candidate.business.name,
            location: candidate.business.location,
            reasons,
            exact:
              canonicalRowFingerprint(row) ===
              canonicalRowFingerprint(candidate),
          },
        ]
      : [];
  });
}
