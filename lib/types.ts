export type UserRole = "super_admin" | "team_lead" | "technical_lead" | "media" | "hr_operations" | "viewer";
export type RobotStatus = "Competition Ready" | "In Development" | "Retired" | "Prototype";
export type CompetitionLevel = "National" | "International";
export type AchievementResult = "Champion" | "Runner-up" | "Podium" | "Finalist" | "Participation";

export interface Robot {
  slug: string; name: string; category: string; version: string; weightKg?: number; dimensions?: string;
  status: RobotStatus; developmentYear: number; summary: string; specifications: Record<string, string>;
  engineering?: { problem?: string; mechanicalDesign?: string; electronicsArchitecture?: string; controlLogic?: string; componentChoices?: string; limitations?: string; futureImprovements?: string };
  media?: { type: "image" | "video" | "cad"; src: string; alt: string; caption?: string }[];
  competitionSlugs?: string[]; sensitiveFieldsHidden: string[];
}
export interface CompetitionRecord {
  slug: string; competition: string; organizer: string; date?: string; year: number; location: string; country?: string;
  level: CompetitionLevel; segment: string; robot: string; robotCategory?: string; result: AchievementResult; teamMembers: string[];
  evidence?: { label: string; href: string }[]; report?: string;
}
export interface TeamMember {
  slug: string; name: string; role: string; division: string; department?: string; semester?: string;
  skills: string[]; projects: string[]; tenure: string; alumni: boolean; photo?: string;
  links?: { label: string; href: string }[];
}
