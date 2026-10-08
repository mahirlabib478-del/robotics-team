import Link from "next/link";

const primaryLinks = [
  { href: "/about", label: "About Us" },
  { href: "/robots", label: "Robots" },
  { href: "/competitions", label: "Competitions" },
  { href: "/achievements", label: "Achievements" },
  { href: "/team", label: "Team" },
  { href: "/research", label: "Research" },
  { href: "/gallery", label: "Gallery" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-6 px-6">
        <Link href="/" className="shrink-0 text-sm font-black tracking-[0.2em] text-white sm:text-base">
          TEAM <span className="text-[#19d3ff]">STELLAR</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-5 lg:flex">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-slate-300 transition hover:text-white">
              {link.label}
            </Link>
          ))}
          <details className="relative">
            <summary className="cursor-pointer list-none text-sm text-slate-300 transition hover:text-white">More</summary>
            <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-white/10 bg-[#0b1727] p-2 shadow-2xl">
              <Link className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/sponsors">Sponsors</Link>
              <Link className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/join-us">Join Us</Link>
              <Link className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/contact">Contact</Link>
            </div>
          </details>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/sponsors" className="hidden rounded-full border border-[#19d3ff]/40 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#19d3ff] hover:bg-[#19d3ff]/10 sm:inline-flex">
            Partner With Us
          </Link>
          <details className="lg:hidden">
            <summary className="cursor-pointer list-none rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300">Menu</summary>
            <div className="absolute left-4 right-4 top-18 rounded-2xl border border-white/10 bg-[#0b1727] p-3 shadow-2xl">
              {[...primaryLinks, { href: "/sponsors", label: "Sponsors" }, { href: "/join-us", label: "Join Us" }, { href: "/contact", label: "Contact" }].map((link) => (
                <Link key={link.href} href={link.href} className="block rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
