import { verifyAdminMfa } from "@/app/actions/admin-auth";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminMfaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  await requireAdminSession();

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-20 text-[#f5f8fc]">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#19d3ff]">Admin security</p>
        <h1 className="mt-4 text-4xl font-black">Verify your identity</h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">Enter the 6-digit code from your registered authenticator app to continue.</p>
        {params.error ? <div className="mt-6 rounded-2xl border border-[#ff7a00]/30 bg-[#ff7a00]/5 p-4 text-sm text-[#ffbd85]">The verification code could not be accepted. Please try again.</div> : null}
        <form action={verifyAdminMfa} className="mt-8 grid gap-5 rounded-3xl border border-white/10 bg-[#0b1727] p-7">
          <label className="grid gap-2 text-sm text-slate-300">
            Authenticator code
            <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-center text-xl tracking-[0.35em] text-white outline-none focus:border-[#19d3ff]/50" />
          </label>
          <button className="rounded-full bg-[#1479ff] px-5 py-3 font-semibold">Verify & continue</button>
        </form>
      </div>
    </main>
  );
}
