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

const secondaryLinks = [
  { href: "/sponsors", label: "Sponsors" },
  { href: "/join-us", label: "Join Us" },
  { href: "/contact", label: "Contact" },
];

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff]";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/95 backdrop-blur-xl">
      <div className="relative mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/" aria-label="Team Stellar home" className={`shrink-0 rounded-sm text-sm font-black tracking-[0.16em] text-white sm:text-base sm:tracking-[0.2em] ${focusRing}`}>
          TEAM <span className="text-[#19d3ff]">STELLAR</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-4 xl:flex">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`rounded-sm text-sm text-slate-300 transition hover:text-white ${focusRing}`}>
              {link.label}
            </Link>
          ))}
          <details className="relative">
            <summary aria-label="More navigation links" className={`cursor-pointer rounded-sm text-sm text-slate-300 transition hover:text-white ${focusRing}`}>More</summary>
            <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-white/10 bg-[#0b1727] p-2 shadow-2xl">
              {secondaryLinks.map((link) => (
                <Link key={link.href} className={`block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white ${focusRing}`} href={link.href}>{link.label}</Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link href="/sponsors" className={`hidden rounded-full border border-[#19d3ff]/40 px-3 py-2 text-xs font-semibold text-white transition hover:border-[#19d3ff] hover:bg-[#19d3ff]/10 sm:inline-flex sm:px-4 sm:text-sm ${focusRing}`}>
            Partner With Us
          </Link>
          <details className="xl:hidden">
            <summary aria-label="Open site navigation menu" className={`cursor-pointer rounded-full border border-white/15 px-3 py-2 text-sm text-slate-200 transition hover:border-[#19d3ff]/60 hover:text-white ${focusRing}`}>
              Menu
            </summary>
            <nav aria-label="Mobile navigation" className="absolute left-3 right-3 top-full mt-2 max-h-[min(75vh,36rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1727] p-3 shadow-2xl sm:left-auto sm:right-6 sm:w-80">
              {[...primaryLinks, ...secondaryLinks].map((link) => (
                <Link key={link.href} href={link.href} className={`block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white ${focusRing}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
