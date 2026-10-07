export function DashboardIcon({ kind }: { kind: string }) {
  const path =
    kind === "tasks"
      ? "M5 12l4 4L19 6"
      : kind === "replies"
        ? "M9 5L3 11l6 6M3 11h10a7 7 0 0 1 7 7"
        : kind === "pipeline"
          ? "M5 19L19 5M7 5h12v12"
          : "M3 4h18v16H3zM9 4v16M9 10h12";
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
