"use client";
import { useRouter, usePathname } from "next/navigation";
export function WorkspaceSwitcher({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const path = usePathname();
  const current = clients.find((c) =>
    path.startsWith("/owner/clients/" + c.id),
  );
  return (
    <label className="owner-workspace dash-switcher">
      <span className="owner-workspace-icon" aria-hidden="true">
        {current ? current.name.slice(0, 1) : "P"}
      </span>
      <span>
        <small>Switch account</small>
        <select
          aria-label="Switch account"
          value={current?.id ?? "agency"}
          onChange={(e) =>
            router.push(
              e.target.value === "agency"
                ? "/owner"
                : e.target.value === "all"
                  ? "/owner/clients"
                  : "/owner/clients/" + e.target.value,
            )
          }
        >
          <option value="agency">Peregrine · Agency</option>
          {clients.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
          <option value="all">All client accounts…</option>
        </select>
      </span>
    </label>
  );
}
