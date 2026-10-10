import type { Metadata } from "next";
import { GalleryArchive } from "@/components/gallery-archive";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicGallery } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Gallery",
  description: "View approved public photos and videos documenting Team Stellar’s robotics work and activities.",
};

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
        <GalleryArchive items={items} />
      </section>
      <SiteFooter />
    </main>
  );
}
