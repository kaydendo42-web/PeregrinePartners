/** Source scores remain separate from the team's editable outreach priority. */
export function leadResearch(fields: Record<string, string>) {
  const read = (label: string) => {
    const found = Object.entries(fields).find(
      ([key]) => key.toLowerCase().replace(/ \[\d+\]$/, "") === label,
    );
    return found?.[1]?.trim() ?? "";
  };
  const rank = read("rank");
  const score = read("priority");
  return {
    rank: /^\d+$/.test(rank) && Number(rank) > 0 ? rank : null,
    score: /^\d+(\.\d+)?$/.test(score) ? score : null,
  };
}
