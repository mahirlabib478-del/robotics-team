import type { Metadata } from "next";
import Image from "next/image";
import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicGallery } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Gallery",
  description: "View approved public photos and videos documenting Team Stellar’s robotics work and activities.",
};

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

const categories = [
  ["Robot Development", "Build stages, fabrication and assembly."],
  ["Workshop", "Hands-on engineering and team learning."],
  ["Testing", "Bench tests, field tests and controlled trials."],
  ["National Competitions", "Verified competition media from Bangladesh."],
  ["International Competitions", "International event footage and team moments."],
  ["Awards", "Podiums, certificates and official recognition."],
  ["Team Activities", "Training, planning and team culture."],
  ["Media Coverage", "Published coverage from verified media sources."],
];

export default async function GalleryPage() {
  const items = await getPublicGallery();
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading level="h1"
          eyebrow="Media archive"
          title="Gallery & Media"
          description="A curated visual archive organized around engineering work, competition, awards and team activity. YouTube is preferred for video delivery so the site does not become a large video-hosting server."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(([title, description]) => (
            <article key={title} className="group aspect-[4/3] rounded-2xl border border-white/10 bg-[#0b1727] p-6 transition hover:-translate-y-0.5 hover:border-[#19d3ff]/30">
              <div className="flex h-full flex-col justify-end">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#19d3ff]">Media category</p>
                <h2 className="mt-2 font-bold">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-12">
          {items.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                if (!item.source_url) return null;
                const embedUrl = item.source_type === "youtube" ? youtubeEmbedUrl(item.source_url) : null;
                return (
                  <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1727]">
                    {item.source_type === "image" ? (
                      <Image src={item.source_url} alt={item.alt_text} width={1280} height={720} unoptimized loading="lazy" className="aspect-video w-full object-cover" />
                    ) : embedUrl ? (
                      <iframe
                        src={embedUrl}
                        title={item.title}
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="aspect-video w-full border-b border-white/10"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center border-b border-white/10 bg-[#07111f] px-6 text-center text-sm text-slate-500">
                        Video unavailable: the saved YouTube URL is invalid.
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#19d3ff]">{item.category}</p>
                      <h2 className="mt-2 font-bold">{item.title}</h2>
                      {item.caption ? <p className="mt-2 text-sm text-slate-400">{item.caption}</p> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ): <EmptyState
            title="Media archive is ready for approved assets."
            description="Images, YouTube embeds, captions, alt text and publication status are supported. Large videos should remain on YouTube or another approved media host rather than being stored directly on the web server."
          />}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
