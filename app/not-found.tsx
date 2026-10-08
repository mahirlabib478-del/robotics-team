import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-mono text-sm text-[#19d3ff]">404 / RECORD NOT FOUND</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">This engineering record is not published.</h1>
        <p className="mt-5 max-w-xl leading-7 text-slate-400">The requested page may be unpublished, archived or not yet entered into the verified Team Stellar archive.</p>
        <Link href="/" className="mt-8 rounded-full bg-[#1479ff] px-6 py-3 font-semibold">Return Home</Link>
      </section>
      <SiteFooter />
    </main>
  );
}
