import type { Metadata } from "next";
import Link from "next/link";
import { addEngineeringProjectMember, createEngineeringProject, createEngineeringTask, updateEngineeringTaskStatus } from "@/app/actions/engineering";
import { signOutAdmin } from "@/app/actions/admin-auth";
import { EmptyState } from "@/components/empty-state";
import { requireAdmin, requireAnyRole } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Engineering Projects",
  description: "Private project and task workspace for authorized Team Stellar members.",
  robots: { index: false, follow: false, noarchive: true },
};

const inputClass = "min-w-0 rounded-xl border border-white/10 bg-[#07111f] px-3 py-3 text-sm text-white outline-none focus:border-[#19d3ff]/60";
const taskStatuses = ["backlog", "todo", "in_progress", "blocked", "done"] as const;

function errorMessage(code?: string) {
  if (!code) return "";
  const messages: Record<string, string> = {
    "invalid-project": "Project fields are invalid. Check the name, slug, division and due date.",
    "project-save": "The project could not be saved. Check your project permissions and database migration.",
    "invalid-member": "Enter a valid university email and membership capability.",
    "member-not-found": "No matching profile was found. Confirm the university email and account setup.",
    "member-save": "The member could not be added. You may lack project-lead permission or the member may already exist.",
    "invalid-task": "Task fields or status are invalid.",
    "task-save": "The task could not be saved. Confirm you have editor access to this project.",
    "task-update": "The task status could not be updated. Confirm you have editor access.",
    "assignee-not-found": "No matching account was found for the task assignee.",
    "assignee-not-member": "Task assignees must already be members of this project.",
    "assignee-lookup": "Task assignment is unavailable because the account lookup failed safely.",
  };
  return messages[code] ?? "The requested action could not be completed.";
}

export default async function EngineeringProjectsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "technical_lead", "viewer"], profile.role);
  const params = await searchParams;

  const projectResult = await supabase.from("engineering_projects")
    .select("id,slug,name,summary,division,status,due_date,created_at")
    .order("updated_at", { ascending: false });

  if (projectResult.error) {
    console.error("[engineering] Project board query failed:", projectResult.error);
    return (
      <main className="min-h-screen bg-[#07111f] px-4 py-10 text-[#f5f8fc] sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/engineering" className="text-sm text-[#19d3ff]">← Engineering workspace</Link>
          <section className="mt-8 rounded-3xl border border-[#ff7a00]/25 bg-[#0b1727] p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ffbd85]">Migration required</p>
            <h1 className="mt-3 text-3xl font-bold">Project board is not available yet.</h1>
            <p className="mt-4 leading-7 text-slate-300">The project/task tables and their row-level security policies must be applied to the Supabase staging database before this module can load. No private records were returned.</p>
            <p className="mt-4 text-sm text-slate-500">Apply <code>supabase/migrations/20261010_engineering_project_task_board.sql</code>, then verify membership and unauthorized-access cases using the staging security checklist.</p>
          </section>
        </div>
      </main>
    );
  }

  const projects = projectResult.data ?? [];
  const projectIds = projects.map((project) => project.id);
  const [membershipResult, taskResult] = await Promise.all([
    supabase.from("engineering_project_members").select("project_id,capability").eq("user_id", profile.id),
    projectIds.length
      ? supabase.from("engineering_tasks").select("id,project_id,title,description,status,priority,due_date,assignee_id").in("project_id", projectIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (membershipResult.error || taskResult.error) {
    console.error("[engineering] Project membership/task query failed:", membershipResult.error ?? taskResult.error);
    return (
      <main className="min-h-screen bg-[#07111f] px-4 py-10 text-[#f5f8fc] sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/engineering" className="text-sm text-[#19d3ff]">← Engineering workspace</Link>
          <section role="alert" className="mt-8 rounded-3xl border border-[#ff7a00]/25 bg-[#0b1727] p-6 sm:p-8">
            <h1 className="text-2xl font-bold">Project permissions could not be verified.</h1>
            <p className="mt-4 leading-7 text-slate-300">The project membership or task query failed. For safety, this page is not showing task data or write controls until access can be verified.</p>
          </section>
        </div>
      </main>
    );
  }
  const tasks = taskResult.data ?? [];
  const eventResult = tasks.length
    ? await supabase.from("engineering_task_events").select("id,task_id,event_type,from_status,to_status,created_at").in("task_id", tasks.map((task) => task.id)).order("created_at", { ascending: false })
    : { data: [], error: null };
  if (eventResult.error) {
    console.error("[engineering] Task history query failed:", eventResult.error);
    return (
      <main className="min-h-screen bg-[#07111f] px-4 py-10 text-[#f5f8fc] sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/engineering" className="text-sm text-[#19d3ff]">← Engineering workspace</Link>
          <section role="alert" className="mt-8 rounded-3xl border border-[#ff7a00]/25 bg-[#0b1727] p-6 sm:p-8">
            <h1 className="text-2xl font-bold">Task history could not be verified.</h1>
            <p className="mt-4 leading-7 text-slate-300">The task audit trail is unavailable, so this page is not displaying task records or write controls.</p>
          </section>
        </div>
      </main>
    );
  }
  const eventsByTask = new Map<string, typeof eventResult.data>();
  for (const event of eventResult.data ?? []) eventsByTask.set(event.task_id, [...(eventsByTask.get(event.task_id) ?? []), event]);
  const membershipByProject = new Map((membershipResult.data ?? []).map((membership) => [membership.project_id, membership.capability] as const));
  const tasksByProject = new Map<string, typeof tasks>();
  for (const task of tasks) tasksByProject.set(task.project_id, [...(tasksByProject.get(task.project_id) ?? []), task]);
  const canCreateProjects = ["super_admin", "team_lead"].includes(profile.role);
  const canManageTasksByRole = ["super_admin", "team_lead", "technical_lead"].includes(profile.role);

  return (
    <main className="min-h-screen bg-[#07111f] text-[#f5f8fc]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19d3ff]">Restricted workspace</p><h1 className="mt-1 text-xl font-bold">Projects & Tasks</h1></div>
          <div className="flex flex-wrap items-center gap-2"><Link className="rounded-full border border-white/15 px-4 py-2 text-sm" href="/engineering">Engineering home</Link><form action={signOutAdmin}><button className="rounded-full border border-white/15 px-4 py-2 text-sm">Sign out</button></form></div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {params.error ? <p role="alert" className="mb-5 rounded-xl border border-[#ff7a00]/30 bg-[#ff7a00]/5 p-4 text-sm text-[#ffbd85]">{errorMessage(params.error)}</p> : null}
        {params.saved ? <p role="status" className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-200">{params.saved === "project" ? "Project created. You have been added as its lead." : params.saved === "member" ? "Project membership updated." : params.saved === "status" ? "Task status updated and recorded in history." : "Task created and recorded in history."}</p> : null}

        {canCreateProjects ? <form action={createEngineeringProject} className="grid gap-3 rounded-3xl border border-[#19d3ff]/20 bg-[#0b1727] p-5 sm:grid-cols-2 sm:p-7">
          <div className="sm:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#19d3ff]">Project control</p><h2 className="mt-2 text-xl font-bold">Create a private project</h2><p className="mt-2 text-sm leading-6 text-slate-400">Only authorized leads can create projects. The creator is automatically assigned project-lead capability.</p></div>
          <label className="grid gap-2 text-xs text-slate-400">Project name<input name="name" required maxLength={160} className={inputClass} /></label>
          <label className="grid gap-2 text-xs text-slate-400">URL slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} className={inputClass} /></label>
          <label className="grid gap-2 text-xs text-slate-400">Division<input name="division" required maxLength={120} className={inputClass} placeholder="e.g. Mechanical, Embedded, AI" /></label>
          <label className="grid gap-2 text-xs text-slate-400">Target date<input name="due_date" type="date" className={inputClass} /></label>
          <label className="grid gap-2 text-xs text-slate-400 sm:col-span-2">Summary<textarea name="summary" maxLength={2000} rows={3} className={inputClass} /></label>
          <div className="sm:col-span-2"><button className="rounded-full bg-[#1479ff] px-5 py-3 text-sm font-semibold">Create project</button></div>
        </form> : null}

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Membership-scoped records</p><h2 className="mt-2 text-2xl font-bold">Your projects</h2></div><p className="text-sm text-slate-500">{projects.length} accessible project{projects.length === 1 ? "" : "s"}</p></div>

        {projects.length ? <div className="mt-5 grid gap-5">
          {projects.map((project) => {
            const capability = membershipByProject.get(project.id);
            const canLead = profile.role === "super_admin" || capability === "lead";
            const canEditTasks = canManageTasksByRole && (profile.role === "super_admin" || capability === "lead" || capability === "editor");
            const projectTasks = tasksByProject.get(project.id) ?? [];
            return <article key={project.id} className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1727]">
              <div className="border-b border-white/10 p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-xs uppercase tracking-[0.16em] text-[#19d3ff]">{project.division} / {project.slug}</p><h3 className="mt-2 break-words text-2xl font-bold">{project.name}</h3><p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-400">{project.summary || "No public summary; this project is visible only to authorized members."}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">{project.status}</span></div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><span>Target: {project.due_date ?? "Not set"}</span><span>Access: {profile.role === "super_admin" ? "Super admin" : capability ?? "Project member"}</span><span>{projectTasks.length} task{projectTasks.length === 1 ? "" : "s"}</span></div>
                {canLead ? <form action={addEngineeringProjectMember} className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-[#07111f]/60 p-4 sm:grid-cols-[1fr_160px_auto] sm:items-end">
                  <input type="hidden" name="project_id" value={project.id} />
                  <label className="grid gap-2 text-xs text-slate-400">Add existing university account<input name="university_email" type="email" required maxLength={254} className={inputClass} placeholder="name@university.edu" /></label>
                  <label className="grid gap-2 text-xs text-slate-400">Capability<select name="capability" defaultValue="editor" className={inputClass}><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="lead">Project lead</option></select></label>
                  <button className="rounded-full border border-[#19d3ff]/30 px-4 py-3 text-sm font-semibold text-[#b6f4ff]">Add member</button>
                </form> : null}
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px] sm:p-7">
                <div>
                  <div className="flex items-center justify-between gap-3"><h4 className="text-lg font-bold">Task board</h4><span className="font-mono text-xs text-slate-500">HISTORY ENABLED</span></div>
                  {projectTasks.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {projectTasks.map((task) => <article key={task.id} className="rounded-2xl border border-white/10 bg-[#07111f]/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2"><h5 className="break-words font-semibold">{task.title}</h5><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">{task.status.replaceAll("_", " ")}</span></div>
                      {task.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">{task.description}</p> : null}
                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500"><span>Priority: {task.priority}</span><span>Due: {task.due_date ?? "Not set"}</span></div>
                      {canEditTasks ? <form action={updateEngineeringTaskStatus} className="mt-4 flex gap-2"><input type="hidden" name="task_id" value={task.id} /><select name="status" defaultValue={task.status} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0b1727] px-3 py-2 text-xs"><option value="backlog">Backlog</option><option value="todo">To do</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done">Done</option></select><button className="rounded-lg bg-[#1479ff] px-3 py-2 text-xs font-semibold">Update</button></form> : null}
                    </article>)}
                  </div> : <div className="mt-4"><EmptyState title="No tasks in this project yet." description="Project editors can add scoped tasks with priority, owner, due date and tracked status changes." /></div>}
                </div>
                {canEditTasks ? <form action={createEngineeringTask} className="h-fit grid gap-3 rounded-2xl border border-[#19d3ff]/15 bg-[#19d3ff]/5 p-4">
                  <input type="hidden" name="project_id" value={project.id} />
                  <h4 className="font-bold">Add task</h4>
                  <label className="grid gap-2 text-xs text-slate-400">Task title<input name="title" required maxLength={200} className={inputClass} /></label>
                  <label className="grid gap-2 text-xs text-slate-400">Assignee university email (optional)<input name="assignee_email" type="email" maxLength={254} className={inputClass} placeholder="Existing project member" /></label>
                  <label className="grid gap-2 text-xs text-slate-400">Priority<select name="priority" defaultValue="normal" className={inputClass}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
                  <label className="grid gap-2 text-xs text-slate-400">Due date<input name="due_date" type="date" className={inputClass} /></label>
                  <label className="grid gap-2 text-xs text-slate-400">Description<textarea name="description" maxLength={3000} rows={4} className={inputClass} /></label>
                  <button className="rounded-full bg-[#1479ff] px-4 py-3 text-sm font-semibold">Create task</button>
                </form> : null}
              </div>
            </article>;
          })}
        </div> : <div className="mt-5"><EmptyState title="No projects assigned yet." description={canCreateProjects ? "Create a project above, then add verified university accounts as members. Access is scoped to project membership." : "You will see projects only after a project lead grants your university account explicit membership."} /></div>}

        <p className="mt-8 rounded-2xl border border-white/10 p-4 text-xs leading-6 text-slate-500">Private engineering data is protected by server authentication and database row-level security. Task history is append-only and generated by database triggers. Do not place credentials, private keys or other secrets in project descriptions or tasks.</p>
      </section>
    </main>
  );
}
