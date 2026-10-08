import { submitContactMessage } from "@/app/actions/public-submissions";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

interface ContactPageProps {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#19d3ff]">Official channel</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">Contact Team Stellar</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">For sponsorship, technology partnerships, competition coordination, media and general team inquiries, use the structured form below.</p>

        {params.submitted ? <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5 text-sm text-emerald-200">Message received. The appropriate team member can review it from the private operations portal.</div> : null}
        {params.error ? <div className="mt-8 rounded-2xl border border-[#ff7a00]/30 bg-[#ff7a00]/5 p-5 text-sm text-[#ffbd85]">{params.error === "rate" ? "Too many messages were submitted from this network. Please wait before trying again." : params.error === "invalid" ? "Your submission could not be verified. Please try again." : "We could not submit your message. Please check the required fields and try again."}</div> : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-2xl border border-white/10 bg-[#0b1727] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Team identity</p>
            <h2 className="mt-3 text-2xl font-bold">Team Stellar</h2>
            <p className="mt-2 text-sm text-slate-400">BRAC University Robotics Team</p>
            <p className="mt-6 text-sm leading-7 text-slate-500">Public contact details can be added once the team confirms its official email, social channels and partnership contact person.</p>
          </div>

          <form action={submitContactMessage} className="rounded-2xl border border-white/10 bg-[#0b1727] p-7"><input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" name="name" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Organization" name="organization" />
              <Field label="Subject" name="subject" required />
              <label className="grid gap-2 text-sm text-slate-300 sm:col-span-2">
                Message
                <textarea name="message" rows={7} required className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white outline-none focus:border-[#19d3ff]/50" />
              </label>
            </div>
            <button type="submit" className="mt-5 rounded-full bg-[#1479ff] px-6 py-3 font-semibold transition hover:bg-[#1479ff]/85">Send Message</button>
          </form>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function Field({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return <label className="grid gap-2 text-sm text-slate-300">{label}<input name={name} type={type} required={required} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white outline-none focus:border-[#19d3ff]/50" /></label>;
}
