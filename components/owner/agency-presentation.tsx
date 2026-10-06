import type { ReactNode } from "react";

type AgencySection = "clients" | "outreach" | "follow-ups" | "tools";
const icons: Record<AgencySection, string> = {
  clients:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87",
  outreach: "M4 5h16v14H4z M4 10h16 M10 10v9 M15 10v9",
  "follow-ups":
    "M9 11l3 3 8-8 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  tools: "M12 3l9 5-9 5-9-5 9-5Z M3 12l9 5 9-5 M3 16l9 5 9-5",
};

export function AgencyHeading({
  section,
  title,
  description,
  children,
}: {
  section: AgencySection;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="owner-page-head agency-page-heading" data-section={section}>
      <div className="agency-heading-copy">
        <span className="agency-page-icon" aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={icons[section]} />
          </svg>
        </span>
        <div>
          <p className="owner-eyebrow">Peregrine agency</p>
          <h1>{title}</h1>
          <p className="owner-muted">{description}</p>
        </div>
      </div>
      {children ? <div className="owner-actions">{children}</div> : null}
    </div>
  );
}

export function PersonBadge({ name }: { name?: string | null }) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials = parts.length
    ? (parts[0][0] + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase()
    : "–";
  const tone = name
    ? ["purple", "blue", "pink", "green"][
        [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4
      ]
    : "unassigned";
  return (
    <span className="agency-person">
      <span
        className="agency-person-avatar"
        data-tone={tone}
        aria-hidden="true"
      >
        {initials}
      </span>
      <span>{name || "Unassigned"}</span>
    </span>
  );
}

const tagLabels: Record<string, string> = {
  "top-100": "Top 100",
  "top-500": "Top 500",
  "direct-contact": "Contact available",
  "needs-contact-research": "Find contact",
  "ranked-leads": "Ranked lead",
  "instagram-available": "Instagram",
  "multiple-contacts": "Multiple contacts",
  "partial-fit": "Partial fit",
};
const tagOrder = [
  "top-100",
  "top-500",
  "direct-contact",
  "needs-contact-research",
];
export function ResearchTags({ tags }: { tags: string[] }) {
  const ordered = [...tags].sort((a, b) => {
    const rank = (tag: string) => {
      const index = tagOrder.indexOf(tag);
      return index < 0 ? tagOrder.length : index;
    };
    return rank(a) - rank(b);
  });
  const remaining = ordered.slice(2);
  return (
    <span className="agency-tags">
      {ordered.slice(0, 2).map((tag) => (
        <span className="agency-tag" data-tag={tag} key={tag} title={tag}>
          {tagLabels[tag] ?? tag.replaceAll("-", " ")}
        </span>
      ))}
      {remaining.length ? (
        <span
          className="agency-tag agency-tag-more"
          title={remaining.join(", ")}
        >
          +{remaining.length}
          <span className="agency-sr-only">
            {" "}
            more tags: {remaining.join(", ")}
          </span>
        </span>
      ) : null}
    </span>
  );
}
