export type RobotStatus = "Competition Ready" | "In Development" | "Retired" | "Prototype";
export type CompetitionLevel = "National" | "International";
export type AchievementResult = "Champion" | "Runner-up" | "Podium" | "Finalist" | "Participation";
export interface Robot { slug:string; name:string; category:string; version:string; weightKg?:number; dimensions?:string; status:RobotStatus; developmentYear:number; summary:string; specifications:Record<string,string>; sensitiveFieldsHidden:string[] }
export interface CompetitionRecord { slug:string; competition:string; organizer:string; year:number; location:string; level:CompetitionLevel; segment:string; robot:string; result:AchievementResult; evidence?:{label:string;href:string}[]; report?:string }
export interface TeamMember { slug:string; name:string; role:string; division:string; department?:string; semester?:string; skills:string[]; projects:string[]; tenure:string; alumni:boolean; links?:{label:string;href:string}[] }
