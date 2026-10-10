"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  useEffect(() => {
    console.error("Team Stellar application error boundary triggered.");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-[#f5f8fc]">
      <section className="max-w-lg text-center">
        <p className="font-mono text-sm text-[#19d3ff]">SYSTEM ERROR</p>
        <h1 className="mt-4 text-4xl font-black">Something went wrong.</h1>
        <p className="mt-4 text-slate-400">The error has been isolated from the rest of the public site. Try again or return to the homepage.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={reset} className="rounded-full bg-[#1479ff] px-5 py-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff]">Try Again</button>
          <Link href="/" className="rounded-full border border-white/15 px-5 py-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff]">Home</Link>
        </div>
      </section>
    </main>
  );
}
