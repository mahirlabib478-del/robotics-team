import type { CompetitionRecord, Robot, TeamMember } from "@/lib/types";
import { robots as fallbackRobots, competitions as fallbackCompetitions, teamMembers as fallbackTeamMembers } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

class PublicDataUnavailableError extends Error {
  constructor(resource: string) {
    super(`Published ${resource} records are temporarily unavailable.`);
    this.name = "PublicDataUnavailableError";
  }
}

const publicEngineeringFields = ["problem", "mechanicalDesign", "electronicsArchitecture", "controlLogic", "componentChoices", "limitations", "futureImprovements"] as const;

function safePublicEngineering(value: unknown): NonNullable<Robot["engineering"]> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const result: Partial<NonNullable<Robot["engineering"]>> = {};
  for (const field of publicEngineeringFields) {
    const entry = source[field];
    if (typeof entry === "string" && entry.trim()) result[field] = entry.trim().slice(0, 4000);
  }
  return Object.keys(result).length ? result : undefined;
}

function safePublicLink(value: unknown): { label: string; href: string } | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.label !== "string" || typeof item.href !== "string") return null;
  try {
    const url = new URL(item.href);
    if (url.protocol !== "https:") return null;
    return { label: item.label.slice(0, 80), href: url.toString() };
  } catch {
    return null;
  }
}

function safePublicUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function safeYouTubeUrl(value: unknown): string | undefined {
  const href = safePublicUrl(value);
  if (!href) return undefined;
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    let videoId = "";
    if (hostname === "youtu.be" || hostname === "www.youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (hostname === "youtube.com" || hostname === "www.youtube.com") {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v") ?? "";
      else if (/^\/(embed|shorts|live)\//.test(url.pathname)) {
        videoId = url.pathname.split("/").filter(Boolean)[1] ?? "";
      }
    } else {
      return undefined;
    }
    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? href : undefined;
  } catch {
    return undefined;
  }
}

export async function getPublicRobots(): Promise<Robot[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("robots").select("slug,name,category,version,weight_kg,dimensions,status,development_year,summary,specifications,sensitive_fields_hidden,robot_media(media_type,source_url,alt_text,caption,sort_order,visibility)").eq("publish_status","published").eq("visibility","public").order("development_year",{ascending:false});
    if (error) {
      console.error("[public-data] Failed to load published robots", error);
      throw new PublicDataUnavailableError("robot");
    }
    if (!data) return fallbackRobots;
    const { data: publicEngineeringRows, error: publicEngineeringError } = data.length ? await supabase.from("robots").select("slug,public_engineering").in("slug", data.map((robot) => robot.slug)).eq("publish_status", "published").eq("visibility", "public") : { data: [], error: null };
    if (publicEngineeringError) console.error("[public-data] Public engineering summaries are unavailable; apply the public engineering migration to enable this section.", publicEngineeringError);
    const publicEngineeringBySlug = new Map((publicEngineeringRows ?? []).map((robot) => [robot.slug, safePublicEngineering(robot.public_engineering)] as const));
    return data.map((r)=>({slug:r.slug,name:r.name,category:r.category,version:r.version,weightKg:r.weight_kg==null?undefined:Number(r.weight_kg),dimensions:r.dimensions??undefined,status:r.status as Robot["status"],developmentYear:r.development_year,summary:r.summary,specifications:(r.specifications??{}) as Record<string,string>,engineering:publicEngineeringBySlug.get(r.slug),media:(Array.isArray(r.robot_media)?r.robot_media:[]).filter((item)=>item.visibility==="public"&&["image","video","cad"].includes(item.media_type)&&Boolean(safePublicUrl(item.source_url))&&typeof item.alt_text==="string"&&Boolean(item.alt_text.trim())&&Number.isInteger(item.sort_order)&&item.sort_order>=0).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)).map((item)=>({type:item.media_type as "image"|"video"|"cad",src:safePublicUrl(item.source_url)!,alt:item.alt_text,caption:typeof item.caption==="string"?item.caption:undefined})),sensitiveFieldsHidden:r.sensitive_fields_hidden??[]}));
  } catch (error) {
    if (error instanceof PublicDataUnavailableError) throw error;
    console.error("[public-data] Unable to query published robots", error);
    return fallbackRobots;
  }
}
export async function getPublicRobot(slug:string){return (await getPublicRobots()).find((item)=>item.slug===slug)??null;}
export async function getPublicCompetitions(): Promise<CompetitionRecord[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("competitions").select("slug,official_name,organizer,event_date,year,city,country,level,segment,robot_name,result,team_members,report").eq("publish_status","published").eq("visibility","public").order("year",{ascending:false});
    if (error) { console.error("[public-data] Failed to load published competitions", error); throw new PublicDataUnavailableError("competition"); }
    if (!data) return fallbackCompetitions;
    return data.map((r)=>({slug:r.slug,competition:r.official_name,organizer:r.organizer,date:r.event_date??undefined,year:r.year,location:[r.city,r.country].filter(Boolean).join(", ")||"Location not published",level:r.level as CompetitionRecord["level"],segment:r.segment,robot:r.robot_name,result:r.result as CompetitionRecord["result"],teamMembers:r.team_members??[],report:r.report??undefined}));
  } catch (error) { if(error instanceof PublicDataUnavailableError) throw error; console.error("[public-data] Unable to query published competitions",error); return fallbackCompetitions; }
}
export async function getPublicCompetition(slug:string): Promise<CompetitionRecord|null>{
  try {
    const supabase=await createSupabaseServerClient();
    const {data,error}=await supabase.from("competitions").select("id,slug,official_name,organizer,event_date,year,city,country,level,segment,robot_name,result,team_members,report").eq("slug",slug).eq("publish_status","published").eq("visibility","public").maybeSingle();
    if(error){console.error("[public-data] Failed to load published competition detail",error);throw new PublicDataUnavailableError("competition");} if(!data)return (await getPublicCompetitions()).find((item)=>item.slug===slug)??null;
    const {data:evidence,error:evidenceError}=await supabase.from("competition_evidence").select("label,href").eq("competition_id",data.id).order("created_at",{ascending:true});
    if(evidenceError){console.error("[public-data] Failed to load competition evidence",evidenceError);throw new PublicDataUnavailableError("competition evidence");}
    return {slug:data.slug,competition:data.official_name,organizer:data.organizer,date:data.event_date??undefined,year:data.year,location:[data.city,data.country].filter(Boolean).join(", ")||"Location not published",level:data.level as CompetitionRecord["level"],segment:data.segment,robot:data.robot_name,result:data.result as CompetitionRecord["result"],teamMembers:data.team_members??[],report:data.report??undefined,evidence:(evidence??[]).map((item)=>safePublicLink({label:item.label,href:item.href})).filter((item): item is {label:string;href:string} => Boolean(item))};
  } catch(error){if(error instanceof PublicDataUnavailableError) throw error; console.error("[public-data] Unable to query published competition detail",error); return (await getPublicCompetitions()).find((item)=>item.slug===slug)??null;}
}
export async function getPublicTeamMembers(): Promise<TeamMember[]>{
  try{
    const supabase=await createSupabaseServerClient();
    const {data,error}=await supabase.from("team_members").select("slug,name,role,division,department,semester,skills,projects,tenure,alumni,photo_url,public_links").eq("publish_status","published").eq("visibility","public").order("alumni",{ascending:true}).order("name",{ascending:true});
    if(error){console.error("[public-data] Failed to load published team members",error);throw new PublicDataUnavailableError("team member");} if(!data)return fallbackTeamMembers;
    return data.map((m)=>({slug:m.slug,name:m.name,role:m.role,division:m.division,department:m.department??undefined,semester:m.semester??undefined,skills:m.skills??[],projects:m.projects??[],tenure:m.tenure,alumni:m.alumni,photo:safePublicUrl(m.photo_url),links:Array.isArray(m.public_links)?m.public_links.map(safePublicLink).filter((x): x is {label:string;href:string} => Boolean(x)):[]}));
  }catch(error){if(error instanceof PublicDataUnavailableError) throw error; console.error("[public-data] Unable to query published team members",error); return fallbackTeamMembers;}
}
export async function getPublicResearchPost(slug: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.from("research_posts").select("slug,title,excerpt,body,category,author_name,cover_image_url,cover_image_alt").eq("slug", slug).eq("publish_status", "published").eq("visibility", "public").maybeSingle();
    if (result.error?.message?.includes("cover_image_")) {
      console.warn("[public-data] Research cover image migration is not applied yet; continuing without thumbnails.", result.error);
      const fallback = await supabase.from("research_posts").select("slug,title,excerpt,body,category,author_name").eq("slug", slug).eq("publish_status", "published").eq("visibility", "public").maybeSingle();
      if (fallback.error) throw new PublicDataUnavailableError("research");
      return fallback.data ? { ...fallback.data, cover_image_url: null, cover_image_alt: null } : null;
    }
    if (result.error) {
      console.error("[public-data] Failed to load published research post", result.error);
      throw new PublicDataUnavailableError("research");
    }
    return result.data ? {
      ...result.data,
      cover_image_alt: typeof result.data.cover_image_alt === "string" ? result.data.cover_image_alt.trim().slice(0, 300) : null,
      cover_image_url: typeof result.data.cover_image_alt === "string" && result.data.cover_image_alt.trim() ? safePublicUrl(result.data.cover_image_url) : null,
    } : null;
  } catch (error) {
    if (error instanceof PublicDataUnavailableError) throw error;
    console.error("[public-data] Unable to query published research post", error);
    return null;
  }
}
export async function getPublicResearch() {
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.from("research_posts").select("slug,title,excerpt,category,author_name,cover_image_url,cover_image_alt").eq("publish_status", "published").eq("visibility", "public").order("created_at", { ascending: false });
    if (result.error?.message?.includes("cover_image_")) {
      console.warn("[public-data] Research cover image migration is not applied yet; continuing without thumbnails.", result.error);
      const fallback = await supabase.from("research_posts").select("slug,title,excerpt,category,author_name").eq("publish_status", "published").eq("visibility", "public").order("created_at", { ascending: false });
      if (fallback.error) throw new PublicDataUnavailableError("research");
      return (fallback.data ?? []).map((post) => ({ ...post, cover_image_url: null, cover_image_alt: null }));
    }
    if (result.error) {
      console.error("[public-data] Failed to load published research", result.error);
      throw new PublicDataUnavailableError("research");
    }
    return (result.data ?? []).map((post) => ({
      ...post,
      cover_image_alt: typeof post.cover_image_alt === "string" ? post.cover_image_alt.trim().slice(0, 300) : null,
      cover_image_url: typeof post.cover_image_alt === "string" && post.cover_image_alt.trim() ? safePublicUrl(post.cover_image_url) : null,
    }));
  } catch (error) {
    if (error instanceof PublicDataUnavailableError) throw error;
    console.error("[public-data] Unable to query published research", error);
    return [];
  }
}
export async function getPublicGallery(){try{const supabase=await createSupabaseServerClient();const {data,error}=await supabase.from("gallery_items").select("id,title,category,source_type,source_url,thumbnail_url,alt_text,caption").eq("publish_status","published").eq("visibility","public").order("created_at",{ascending:false});if(error){console.error("[public-data] Failed to load published gallery",error);throw new PublicDataUnavailableError("gallery");}return (data??[]).map((item)=>({...item,source_url:item.source_type==="youtube"?safeYouTubeUrl(item.source_url):safePublicUrl(item.source_url),thumbnail_url:safePublicUrl(item.thumbnail_url)})).filter((item)=>Boolean(item.source_url));}catch(error){if(error instanceof PublicDataUnavailableError) throw error; console.error("[public-data] Unable to query published gallery",error);return[]}}
export async function getPublicSponsors(){try{const supabase=await createSupabaseServerClient();const {data,error}=await supabase.from("sponsors").select("id,name,logo_url,website_url,partnership_type,description").eq("publish_status","published").eq("visibility","public").order("name",{ascending:true});if(error){console.error("[public-data] Failed to load published sponsors",error);throw new PublicDataUnavailableError("sponsor");}return (data??[]).map((item)=>({...item,logo_url:safePublicUrl(item.logo_url),website_url:safePublicUrl(item.website_url)}));}catch(error){if(error instanceof PublicDataUnavailableError) throw error; console.error("[public-data] Unable to query published sponsors",error);return[]}}
export async function getPublicStats(robotsInput?: Robot[], competitionsInput?: CompetitionRecord[], membersInput?: TeamMember[]){const [robots,competitions,members]=await Promise.all([robotsInput?Promise.resolve(robotsInput):getPublicRobots(),competitionsInput?Promise.resolve(competitionsInput):getPublicCompetitions(),membersInput?Promise.resolve(membersInput):getPublicTeamMembers()]);return{robots:robots.length,nationalAwards:competitions.filter((x)=>x.level==="National"&&["Champion","Runner-up","Podium"].includes(x.result)).length,internationalParticipations:competitions.filter((x)=>x.level==="International").length,activeMembers:members.filter((x)=>!x.alumni).length};}
