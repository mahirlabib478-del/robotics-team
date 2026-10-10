"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  source_type: "image" | "youtube";
  source_url: string | null;
  thumbnail_url: string | null;
  alt_text: string;
  caption: string | null;
}

interface GalleryArchiveProps {
  items: GalleryItem[];
}

const categories = [
  ["Robot Development", "Build stages, fabrication and assembly."],
  ["Workshop", "Hands-on engineering and team learning."],
  ["Testing", "Bench tests, field tests and controlled trials."],
  ["National Competitions", "Verified competition media from Bangladesh."],
  ["International Competitions", "International event footage and team moments."],
  ["Awards", "Podiums, certificates and official recognition."],
  ["Team Activities", "Training, planning and team culture."],
  ["Media Coverage", "Published coverage from verified media sources."],
] as const;

function youtubeEmbedUrl(source: string) {
  try {
    const url = new URL(source);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    let videoId = "";
    if (host === "youtu.be" || host === "www.youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (host === "youtube.com" || host === "www.youtube.com") {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v") ?? "";
      else if (/^\/(embed|shorts|live)\//.test(url.pathname)) videoId = url.pathname.split("/").filter(Boolean)[1] ?? "";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

const categoryDescriptions = new Map<string, string>(categories);
const buttonClass = "rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19d3ff]";

export function GalleryArchive({ items }: GalleryArchiveProps) {
  const [activeCategory, setActiveCategory] = useState("All media");
  const [search, setSearch] = useState("");
  const availableCategories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [items],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return items.filter((item) =>
      (activeCategory === "All media" || item.category === activeCategory)
      && (!query || [item.title, item.category, item.caption ?? "", item.alt_text].join(" ").toLocaleLowerCase().includes(query)),
    );
  }, [items, activeCategory, search]);

  return (
    <section className="mt-8" aria-labelledby="gallery-items-heading">
      <div className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="grid gap-2 text-xs font-medium text-slate-400 sm:max-w-md sm:flex-1">
            Search media
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, caption or description" className="min-w-0 rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-slate-100 outline-none focus:border-[#19d3ff]/60" />
          </label>
          <p className="text-sm text-slate-400" role="status" aria-live="polite" aria-atomic="true">{filtered.length} of {items.length} media items</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter gallery by category">
          <button type="button" aria-pressed={activeCategory === "All media"} onClick={() => setActiveCategory("All media")} className={`${buttonClass} ${activeCategory === "All media" ? "border-[#19d3ff]/50 bg-[#19d3ff]/10 text-[#b6f4ff]" : "border-white/10 text-slate-300 hover:border-white/25"}`}>All media</button>
          {availableCategories.map((category) => (
            <button key={category} type="button" title={categoryDescriptions.get(category) ?? "Published media category"} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)} className={`${buttonClass} ${activeCategory === category ? "border-[#19d3ff]/50 bg-[#19d3ff]/10 text-[#b6f4ff]" : "border-white/10 text-slate-300 hover:border-white/25"}`}>{category}</button>
          ))}
        </div>
      </div>

      <h2 id="gallery-items-heading" className="sr-only">Published gallery items</h2>
      {filtered.length ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            if (!item.source_url) return null;
            const embedUrl = item.source_type === "youtube" ? youtubeEmbedUrl(item.source_url) : null;
            return (
              <article key={item.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1727] transition hover:-translate-y-0.5 hover:border-[#19d3ff]/30">
                {item.source_type === "image" ? (
                  <Image src={item.source_url} alt={item.alt_text} width={1280} height={720} unoptimized loading="lazy" className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.01]" />
                ) : embedUrl ? (
                  <iframe src={embedUrl} title={item.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="aspect-video w-full border-b border-white/10" />
                ) : (
                  <div className="flex aspect-video items-center justify-center border-b border-white/10 bg-[#07111f] px-6 text-center text-sm text-slate-500">Video unavailable: the saved YouTube URL is invalid.</div>
                )}
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#19d3ff]">{item.category}</p>
                  <h3 className="mt-2 font-bold">{item.title}</h3>
                  {item.caption ? <p className="mt-2 text-sm leading-6 text-slate-400">{item.caption}</p> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : items.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-[#0b1727] p-8">
          <h3 className="font-bold">No media matches this filter.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">Try another category or search term.</p>
          <button type="button" onClick={() => { setActiveCategory("All media"); setSearch(""); }} className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:border-[#19d3ff]/50">Clear filters</button>
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState title="Media archive is ready for approved assets." description="Images, YouTube embeds, captions, alt text and publication status are supported. Large videos should remain on YouTube or another approved media host rather than being stored directly on the web server." />
        </div>
      )}
    </section>
  );
}
