"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CompetitionRecord } from "@/lib/types";

interface CompetitionArchiveProps {
  records: CompetitionRecord[];
  achievementsOnly?: boolean;
}

const selectClass = "min-w-0 rounded-xl border border-white/10 bg-[#07111f] px-3 py-3 text-sm text-slate-200 outline-none focus:border-[#19d3ff]/60";
const results = ["Champion", "Runner-up", "Podium", "Finalist", "Participation"] as const;

export function CompetitionArchive({ records, achievementsOnly = false }: CompetitionArchiveProps) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All levels");
  const [year, setYear] = useState("All years");
  const [result, setResult] = useState("All results");
  const [segment, setSegment] = useState("All segments");
  const [country, setCountry] = useState("All countries");
  const [robot, setRobot] = useState("All robots");

  const years = useMemo(() => [...new Set(records.map((record) => String(record.year)))].sort((a, b) => Number(b) - Number(a)), [records]);
  const segments = useMemo(() => [...new Set(records.map((record) => record.segment).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [records]);
  const countries = useMemo(() => [...new Set(records.map((record) => record.country).filter((item): item is string => Boolean(item?.trim())))].sort((a, b) => a.localeCompare(b)), [records]);
  const robots = useMemo(() => [...new Set(records.map((record) => record.robot).filter((item) => item && item !== "Not published"))].sort((a, b) => a.localeCompare(b)), [records]);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((record) => {
      const searchable = [record.competition, record.organizer, record.location, record.robot, record.segment, record.result, String(record.year), record.date, record.report, ...record.teamMembers].filter(Boolean).join(" ").toLocaleLowerCase();
      return (!query || searchable.includes(query))
        && (level === "All levels" || record.level === level)
        && (year === "All years" || String(record.year) === year)
        && (result === "All results" || record.result === result)
        && (segment === "All segments" || record.segment === segment)
        && (country === "All countries" || record.country === country)
        && (robot === "All robots" || record.robot === robot);
    });
  }, [records, search, level, year, result, segment, country, robot]);

  function resetFilters() {
    setSearch("");
    setLevel("All levels");
    setYear("All years");
    setResult("All results");
    setSegment("All segments");
    setCountry("All countries");
    setRobot("All robots");
  }

  return (
    <div className="mt-10">
      <div className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="grid min-w-0 gap-2 text-xs text-slate-400 lg:col-span-2">
            Search archive
            <input aria-label="Search competitions by event, organizer, location, robot, result, year, report or team member" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Competition, robot, organizer, result, member…" className={selectClass} />
          </label>
          <label className="grid gap-2 text-xs text-slate-400">Level
            <select value={level} onChange={(event) => setLevel(event.target.value)} className={selectClass}>
              <option>All levels</option><option>National</option><option>International</option>
            </select>
          </label>
          <label className="grid gap-2 text-xs text-slate-400">Year
            <select value={year} onChange={(event) => setYear(event.target.value)} className={selectClass}>
              <option>All years</option>{years.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-xs text-slate-400">Result
            <select value={result} onChange={(event) => setResult(event.target.value)} className={selectClass}>
              <option>All results</option>{results.filter((item) => !achievementsOnly || item !== "Participation").map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-xs text-slate-400 sm:col-span-2 lg:col-span-3">Competition segment
            <select value={segment} onChange={(event) => setSegment(event.target.value)} className={selectClass}>
              <option>All segments</option>{segments.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="flex items-end justify-between gap-3 sm:col-span-2 lg:col-span-2">
            <p className="pb-3 text-sm text-slate-400" role="status" aria-live="polite" aria-atomic="true">{filtered.length} of {records.length} records</p>
            <button type="button" onClick={resetFilters} className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-[#19d3ff]/50">Clear filters</button>
          </div>
        </div>
      </div>

      {filtered.length ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {filtered.map((record) => (
            <article key={record.slug} className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-[#19d3ff]">{record.level} · {record.year} · {record.result}</p>
              <h2 className="mt-3 break-words text-2xl font-bold">{record.competition}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{record.organizer} · {record.location}</p>
              <p className="mt-2 text-sm text-slate-500">{record.segment} · {record.robot}</p>
              <Link href={`/competitions/${record.slug}`} className="mt-5 inline-block text-sm font-semibold text-[#19d3ff]">Read competition record →</Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-[#0b1727] p-8">
          <h2 className="font-bold">No records match these filters.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Try a different keyword or clear the filters. Only published, public competition records are searchable here.</p>
          <button type="button" onClick={resetFilters} className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:border-[#19d3ff]/50">Clear filters</button>
        </div>
      )}
    </div>
  );
}
