import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function PublicDataUnavailable({ resource = "public records" }: { resource?: string }) {
  return (
    <main className="flex min-h-screen flex-col bg-[#07111f] text-[#f5f8fc]">
      <SiteHeader />
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-20 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19d3ff]">Temporarily unavailable</p>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">We couldn’t load the {resource}.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-400">
          This is a data service issue, not an empty archive. Please try again later. Published records will appear when the data service is available.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="" className="rounded-full bg-[#1479ff] px-5 py-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff]">Try again</a>
          <Link href="/" className="rounded-full border border-white/15 px-5 py-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff]">Home</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
