import type { CompetitionRecord, Robot, TeamMember } from "./types";
export const robots:Robot[]=[];
export const competitions:CompetitionRecord[]=[];
export const teamMembers:TeamMember[]=[];
export const robotCategories=["Combat Robots","Sports Robots","Aerial and Marine Systems","Research Prototypes"] as const;
export const divisions=["Mechanical Design","Electronics and Embedded Systems","Software and AI","Control and Automation","Manufacturing","Media and Documentation","Logistics and Competition Operations"] as const;
