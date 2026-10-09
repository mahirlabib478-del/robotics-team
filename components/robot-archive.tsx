"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Robot } from "@/lib/types";

const fieldClass = "min-w-0 rounded-xl border border-white/10 bg-[#07111f] px-3 py-3 text-sm text-slate-200 outline-none focus:border-[#19d3ff]/60";

export function RobotArchive({ robots }: { robots: Robot[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [status, setStatus] = useState("All statuses");

  const categories = useMemo(
    () => [...new Set(robots.map((robot) => robot.category.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [robots],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return robots.filter((robot) => {
      const searchable = [
        robot.name, robot.category, robot.summary, robot.version, robot.status,
        String(robot.developmentYear), robot.dimensions ?? "", String(robot.weightKg ?? ""),
        ...Object.entries(robot.specifications).flat(),
      ].join(" ").toLocaleLowerCase();

      return (!query || searchable.includes(query))
        && (category === "All categories" || robot.category === category)
        && (status === "All statuses" || robot.status === status);
    });
  }, [robots, search, category, status]);

  function clearFilters() {
    setSearch("");
    setCategory("All categories");
    setStatus("All statuses");
  }

  return (
    <div className="mt-10">
      <div className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="grid min-w-0 gap-2 text-xs text-slate-400">
            Search robot archive
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, category, component, specification…" className={fieldClass} />
          </label>
          <label className="grid min-w-0 gap-2 text-xs text-slate-400">
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}>
              <option>All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 gap-2 text-xs text-slate-400">
            Development status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={fieldClass}>
              <option>All statuses</option>
              <option>Competition Ready</option>
              <option>In Development</option>
              <option>Prototype</option>
              <option>Retired</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={clearFilters} className="w-full rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-[#19d3ff]/50">Clear</button>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-400" aria-live="polite">Showing {filtered.length} of {robots.length} published robot records</p>
      </div>

      {filtered.length ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((robot) => (
            <article key={robot.slug} className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[#19d3ff]">{robot.category}</p>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">{robot.status}</span>
              </div>
              <h2 className="mt-3 break-words text-2xl font-bold">{robot.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{robot.summary}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
                <div><dt className="text-xs text-slate-500">Version</dt><dd className="mt-1 text-slate-200">{robot.version || "Not published"}</dd></div>
                <div><dt className="text-xs text-slate-500">Development year</dt><dd className="mt-1 text-slate-200">{robot.developmentYear || "Not published"}</dd></div>
                <div><dt className="text-xs text-slate-500">Weight</dt><dd className="mt-1 text-slate-200">{robot.weightKg != null ? `${robot.weightKg} kg` : "Not published"}</dd></div>
                <div><dt className="text-xs text-slate-500">Control type</dt><dd className="mt-1 text-slate-200">{robot.specifications["Control type"] || "Not published"}</dd></div>
              </dl>
              <Link href={`/robots/${robot.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[#19d3ff] hover:text-white">View technical record →</Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-[#0b1727] p-8">
          <h2 className="font-bold">{robots.length ? "No robots match these filters." : "Robot archive is ready for verified records."}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{robots.length ? "Try another search term or clear the filters. Only published, public robot records appear here." : "Add official robot names, specifications, development history, media and competition links to publish the records. No placeholder robot is presented as a real Team Stellar system."}</p>
          {robots.length ? <button type="button" onClick={clearFilters} className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:border-[#19d3ff]/50">Clear filters</button> : null}
        </div>
      )}
    </div>
  );
}
