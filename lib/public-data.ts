import type { CompetitionRecord, Robot, TeamMember } from "@/lib/types";
import { robots as fallbackRobots, competitions as fallbackCompetitions, teamMembers as fallbackTeamMembers } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safePublicLink(value: unknown): { label: string; href: string } | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.label !== "string" || typeof item.href !== "string") return null;
  try { const url = new URL(item.href); if (url.protocol !== "https:") return null; return { label: item.label.slice(0, 80), href: url.toString() }; } catch { return null; }
}

export async function getPublicRobots(): Promise<Robot[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("robots").select("slug,name,category,version,weight_kg,dimensions,status,development_year,summary,specifications,engineering,sensitive_fields_hidden").eq("publish_status","published").eq("visibility","public").order("development_year",{ascending:false});
    if (error || !data) return fallbackRobots;
    return data.map((r)=>({slug:r.slug,name:r.name,category:r.category,version:r.version,weightKg:r.weight_kg==null?undefined:Number(r.weight_kg),dimensions:r.dimensions??undefined,status:r.status as Robot["status"],developmentYear:r.development_year,summary:r.summary,specifications:(r.specifications??{}) as Record<string,string>,engineering:(r.engineering??{}) as Robot["engineering"],sensitiveFieldsHidden:r.sensitive_fields_hidden??[]}));
  } catch { return fallbackRobots; }
}
export async function getPublicRobot(slug:string){return (await getPublicRobots()).find((item)=>item.slug===slug)??null;}
export async function getPublicCompetitions(): Promise<CompetitionRecord[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("competitions").select("slug,official_name,organizer,event_date,year,city,country,level,segment,robot_name,result,team_members,report").eq("publish_status","published").eq("visibility","public").order("year",{ascending:false});
    if (error || !data) return fallbackCompetitions;
    return data.map((r)=>({slug:r.slug,competition:r.official_name,organizer:r.organizer,date:r.event_date??undefined,year:r.year,location:[r.city,r.country].filter(Boolean).join(", ")||"Location not published",level:r.level as CompetitionRecord["level"],segment:r.segment,robot:r.robot_name,result:r.result as CompetitionRecord["result"],teamMembers:r.team_members??[],report:r.report??undefined}));
  } catch { return fallbackCompetitions; }
}
export async function getPublicCompetition(slug:string): Promise<CompetitionRecord|null>{
  try {
    const supabase=await createSupabaseServerClient();
    const {data,error}=await supabase.from("competitions").select("id,slug,official_name,organizer,event_date,year,city,country,level,segment,robot_name,result,team_members,report").eq("slug",slug).eq("publish_status","published").eq("visibility","public").maybeSingle();
    if(error||!data)return (await getPublicCompetitions()).find((item)=>item.slug===slug)??null;
    const {data:evidence}=await supabase.from("competition_evidence").select("label,href").eq("competition_id",data.id).order("created_at",{ascending:true});
    return {slug:data.slug,competition:data.official_name,organizer:data.organizer,date:data.event_date??undefined,year:data.year,location:[data.city,data.country].filter(Boolean).join(", ")||"Location not published",level:data.level as CompetitionRecord["level"],segment:data.segment,robot:data.robot_name,result:data.result as CompetitionRecord["result"],teamMembers:data.team_members??[],report:data.report??undefined,evidence:(evidence??[]).map((item)=>({label:item.label,href:item.href}))};
  } catch{return (await getPublicCompetitions()).find((item)=>item.slug===slug)??null;}
}
export async function getPublicTeamMembers(): Promise<TeamMember[]>{
  try{
    const supabase=await createSupabaseServerClient();
    const {data,error}=await supabase.from("team_members").select("slug,name,role,division,department,semester,skills,projects,tenure,alumni,photo_url,public_links").eq("publish_status","published").eq("visibility","public").order("alumni",{ascending:true}).order("name",{ascending:true});
    if(error||!data)return fallbackTeamMembers;
    return data.map((m)=>({slug:m.slug,name:m.name,role:m.role,division:m.division,department:m.department??undefined,semester:m.semester??undefined,skills:m.skills??[],projects:m.projects??[],tenure:m.tenure,alumni:m.alumni,photo:m.photo_url??undefined,links:Array.isArray(m.public_links)?m.public_links.map(safePublicLink).filter((x): x is {label:string;href:string} => Boolean(x)):[]}));
  }catch{return fallbackTeamMembers;}
}
export async function getPublicResearchPost(slug:string){try{const supabase=await createSupabaseServerClient();const {data}=await supabase.from("research_posts").select("slug,title,excerpt,body,category,author_name").eq("slug",slug).eq("publish_status","published").eq("visibility","public").maybeSingle();return data??null}catch{return null}}
export async function getPublicResearch(){try{const supabase=await createSupabaseServerClient();const {data}=await supabase.from("research_posts").select("slug,title,excerpt,body,category,author_name").eq("publish_status","published").eq("visibility","public").order("created_at",{ascending:false});return data??[]}catch{return[]}}
export async function getPublicGallery(){try{const supabase=await createSupabaseServerClient();const {data}=await supabase.from("gallery_items").select("id,title,category,source_type,source_url,thumbnail_url,alt_text,caption").eq("publish_status","published").eq("visibility","public").order("created_at",{ascending:false});return data??[]}catch{return[]}}
export async function getPublicSponsors(){try{const supabase=await createSupabaseServerClient();const {data}=await supabase.from("sponsors").select("id,name,logo_url,website_url,partnership_type,description").eq("publish_status","published").eq("visibility","public").order("name",{ascending:true});return data??[]}catch{return[]}}
export async function getPublicStats(){const [robots,competitions,members]=await Promise.all([getPublicRobots(),getPublicCompetitions(),getPublicTeamMembers()]);return{robots:robots.length,nationalAwards:competitions.filter((x)=>x.level==="National"&&x.result!=="Participation").length,internationalParticipations:competitions.filter((x)=>x.level==="International").length,activeMembers:members.filter((x)=>!x.alumni).length};}
