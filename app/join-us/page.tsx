import type { Metadata } from "next";
import { submitRecruitmentApplication } from "@/app/actions/public-submissions";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isPastDateTime } from "@/lib/dhaka-time";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Join Team Stellar",
  description: "Learn about recruitment opportunities and apply to join Team Stellar when applications are open.",
};

interface JoinPageProps {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}

const divisions = [
  "Mechanical Design",
  "Electronics and Embedded Systems",
  "Software and AI",
  "Control and Automation",
  "Manufacturing",
  "Media and Documentation",
  "Logistics and Competition Operations",
];

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;
  let settings: { applications_open: boolean; stage: string; deadline: string | null; description: string | null } | null = null;
  let statusAvailable = true;

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("recruitment_settings")
      .select("applications_open,stage,deadline,description")
      .eq("id", true)
      .maybeSingle();
    if (error) {
      console.error("Public recruitment status lookup failed:", error);
      statusAvailable = false;
    } else {
      settings = data;
    }
  } catch (error) {
    console.error("Public recruitment status is not configured:", error);
    statusAvailable = false;
  }

  const deadlinePassed = Boolean(settings?.deadline && isPastDateTime(settings.deadline));
  const acceptingApplications = statusAvailable && settings?.applications_open === true && !deadlinePassed;
  const deadlineLabel = settings?.deadline
    ? new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(settings.deadline))
    : null;

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#19d3ff]">Recruitment</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Join Team Stellar</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">Apply through a structured engineering-team intake covering your division, skills, projects, portfolio and weekly availability.</p>

        {params.submitted ? <div role="status" className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5 text-sm text-emerald-200">Application received. The operations team can now review it through the private recruitment workflow.</div> : null}
        {params.error ? <div role="alert" className="mt-8 rounded-2xl border border-[#ff7a00]/30 bg-[#ff7a00]/5 p-5 text-sm text-[#ffbd85]">{params.error === "closed" ? "Recruitment applications are currently closed or the deadline has passed." : params.error === "rate" ? "Too many submission attempts from this network. Please wait before trying again." : params.error === "invalid" ? "Please use valid HTTPS links and do not fill the hidden verification field." : "We could not submit the application. Please verify the required fields and try again; if the issue persists, contact the team."}</div> : null}

        <section className="mt-10 rounded-2xl border border-white/10 bg-[#0b1727] p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Current intake</p>
              <h2 className="mt-2 text-xl font-bold">{settings?.stage || (acceptingApplications ? "Applications Open" : "Applications Closed")}</h2>
              {settings?.description ? <p className="mt-3 max-w-3xl whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">{settings.description}</p> : null}
              {deadlineLabel ? <p className="mt-3 text-sm text-slate-400">Deadline: {deadlineLabel} (Bangladesh time)</p> : null}
            </div>
            <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${acceptingApplications ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-slate-400"}`}>
              {statusAvailable ? (acceptingApplications ? "Applications Open" : "Applications Closed") : "Status Unavailable"}
            </span>
          </div>

          {acceptingApplications ? (
            <form action={submitRecruitmentApplication} className="mt-8 grid gap-5 md:grid-cols-2">
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <Field label="Full name" name="name" required />
              <Field label="Department" name="department" required />
              <Field label="Semester" name="semester" required />
              <Field label="Student ID" name="student_id" required />
              <label className="grid gap-2 text-sm text-slate-300">
                Preferred division
                <select name="preferred_division" required className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white outline-none focus:border-[#19d3ff]/50">
                  <option value="">Select a division</option>
                  {divisions.map((division) => <option key={division} value={division}>{division}</option>)}
                </select>
              </label>
              <Field label="GitHub / portfolio URL" name="github_or_portfolio" type="url" />
              <Field label="Weekly availability" name="weekly_availability" placeholder="e.g. 6–8 hours/week" />
              <Field label="Existing skills" name="skills" placeholder="Mechanical CAD, Arduino, Python..." />
              <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                Previous projects
                <textarea name="previous_projects" rows={4} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white outline-none focus:border-[#19d3ff]/50" />
              </label>
              <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                Why do you want to join?
                <textarea name="why_join" rows={5} required className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white outline-none focus:border-[#19d3ff]/50" />
              </label>
              <div className="md:col-span-2">
                <button type="submit" className="rounded-full bg-[#1479ff] px-6 py-3 font-semibold transition hover:bg-[#1479ff]/85">Submit Application</button>
              </div>
            </form>
          ) : (
            <div role="status" className="mt-6 rounded-xl border border-white/10 bg-[#07111f] p-5 text-sm leading-6 text-slate-400">
              {statusAvailable ? "Applications are not being accepted at this time. Please check again when the team opens the next intake." : "Recruitment status is temporarily unavailable. Applications are disabled until the team status can be verified."}
            </div>
          )}
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}

function Field({ label, name, type = "text", placeholder, required = false }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      {label}
      <input name={name} type={type} placeholder={placeholder} required={required} className="min-w-0 rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#19d3ff]/50" />
    </label>
  );
}
