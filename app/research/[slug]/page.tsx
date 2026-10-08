import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicResearchPost } from "@/lib/public-data";

export default async function ResearchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublicResearchPost(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19d3ff]">{post.category}</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">{post.title}</h1>
        {post.author_name ? <p className="mt-4 text-sm text-slate-500">Published by {post.author_name}</p> : null}
        <p className="mt-8 text-lg leading-8 text-slate-300">{post.excerpt}</p>
        <section className="mt-12 whitespace-pre-wrap rounded-2xl border border-white/10 bg-[#0b1727] p-7 text-[15px] leading-8 text-slate-300">
          {post.body}
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
