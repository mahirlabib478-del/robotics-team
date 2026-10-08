import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050c15]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="font-black tracking-[0.2em]">TEAM <span className="text-[#19d3ff]">STELLAR</span></div>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">BRAC University Robotics Team — professional robotics, documented engineering and global ambition.</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Explore</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-400">
            <Link href="/robots">Robots</Link><Link href="/competitions">Competitions</Link><Link href="/team">Team</Link><Link href="/research">Research</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Connect</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-400">
            <Link href="/sponsors">Sponsors</Link><Link href="/join-us">Join Us</Link><Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-slate-600">Verified information only. Sensitive engineering and competition data remains private.</div>
    </footer>
  );
}
