import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicResearch } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Research",
  description: "Read public-safe robotics research, engineering reports, design summaries, and lessons from Team Stellar.",
};

const categories = [
  ["Technical Articles", "Engineering explainers and reusable lessons from the team."],
  ["Development Reports", "Robot build logs, iteration history and engineering decisions."],
  ["Competition Post-mortems", "What worked, what failed and what changed after competition."],
  ["CAD & Design Summaries", "Public-safe design rationale without exposing sensitive geometry."],
  ["Embedded Systems", "Microcontrollers, motor control, sensing and electronics lessons."],
  ["AI Vision Experiments", "Computer vision, perception and autonomy experiments."],
  ["Research Papers & Posters", "Research outputs, posters and academic work."],
  ["Workshop Materials", "Educational resources for members and the wider robotics community."],
];

export default async function ResearchPage() {
  const posts = await getPublicResearch();
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading level="h1"
          eyebrow="Knowledge base"
          title="Research & Projects"
          description="A public-safe technical knowledge base for engineering lessons, development reports, research outputs and competition retrospectives."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.map(([title, description]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6">
              <h2 className="font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
            </article>
          ))}
        </div>
        <div className="mt-12">
          {posts.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {posts.map((post) => (
                <article key={post.slug} className="rounded-2xl border border-white/10 bg-[#0b1727] p-6 transition hover:-translate-y-0.5 hover:border-[#19d3ff]/30">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#19d3ff]">{post.category}</p>
                  <h2 className="mt-2 text-2xl font-bold">{post.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{post.excerpt}</p>
                  <Link href={`/research/${post.slug}`} className="mt-5 inline-block text-sm font-semibold text-[#19d3ff]">Read article →</Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Research records are ready for verified publication."
              description="The content model supports draft, review, published and archived states. Add approved articles and project reports through the future management portal; confidential source code and competition-sensitive engineering details stay private."
            />
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
