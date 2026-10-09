import Link from "next/link";

const footerLinkClass = "rounded-sm transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff]";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050c15]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="font-black tracking-[0.2em]">TEAM <span className="text-[#19d3ff]">STELLAR</span></div>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">BRAC University Robotics Team — professional robotics, documented engineering and global ambition.</p>
        </div>
        <nav aria-label="Explore Team Stellar">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Explore</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-400">
            <Link className={footerLinkClass} href="/about">About Us</Link><Link className={footerLinkClass} href="/robots">Robots</Link><Link className={footerLinkClass} href="/competitions">Competitions</Link><Link className={footerLinkClass} href="/achievements">Achievements</Link><Link className={footerLinkClass} href="/team">Team</Link><Link className={footerLinkClass} href="/research">Research</Link><Link className={footerLinkClass} href="/gallery">Gallery</Link>
          </div>
        </nav>
        <nav aria-label="Connect with Team Stellar">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Connect</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-400">
            <Link className={footerLinkClass} href="/sponsors">Sponsors</Link><Link className={footerLinkClass} href="/join-us">Join Us</Link><Link className={footerLinkClass} href="/contact">Contact</Link>
          </div>
        </nav>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-slate-600">Verified information only. Sensitive engineering and competition data remains private.</div>
    </footer>
  );
}
