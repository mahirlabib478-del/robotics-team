import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [archive, page, data, homepage, competitionArchive, competitionsPage, achievementsPage, sitemap, robots, robotDetail, heading, teamMembers] = await Promise.all([
  read("components/robot-archive.tsx"),
  read("app/robots/page.tsx"),
  read("lib/public-data.ts"),
  read("app/page.tsx"),
  read("components/competition-archive.tsx"),
  read("app/competitions/page.tsx"),
  read("app/achievements/page.tsx"),
  read("app/sitemap.ts"),
  read("app/robots.ts"),
  read("app/robots/[slug]/page.tsx"),
  read("components/section-heading.tsx"),
  read("app/team/page.tsx"),
]);

assert.match(page, /<RobotArchive robots=\{robots\} \/>/, "Robots page must render the interactive archive");
assert.match(archive, /useState\("All categories"\)/, "Robot archive must provide a category filter");
assert.match(archive, /useState\("All statuses"\)/, "Robot archive must provide a status filter");
assert.match(archive, /searchable\.includes\(query\)/, "Robot search must match indexed technical fields");
assert.match(archive, /robot\.specifications\["Control type"\]/, "Robot cards should show control type only when recorded");
assert.match(archive, /aria-live="polite"/, "Filtered record count must be announced accessibly");
assert.match(archive, /function clearFilters\(\)/, "Robot archive must provide a complete filter reset");
assert.match(data, /\.eq\("publish_status","published"\)\.eq\("visibility","public"\)/, "Robot archive data must remain limited to published public records");
assert.match(data, /engineering:undefined/, "Private engineering content must not be projected into public robot records");
assert.match(data, /robot_media\(media_type,source_url,alt_text,caption,sort_order,visibility\)/, "Published robot records must fetch their associated media metadata");
assert.match(data, /safePublicUrl\(item\.source_url\)/, "Robot media sources must be restricted to safe HTTPS URLs");
assert.match(data, /sort\(\(a,b\)=>\(a\.sort_order\?\?0\)-\(b\.sort_order\?\?0\)\)/, "Robot media must respect the CMS display order");
assert.match(archive, /robot\.media\?\.find\(\(media\) => media\.type === "image"\)/, "Robot archive cards must display approved robot images when available");
assert.match(robotDetail, /aria-labelledby="robot-media-heading"/, "Robot detail pages must include an accessible media section");
assert.match(robotDetail, /media\.type === "image" \? <Image/, "Robot detail pages must render published images and link other public media");
assert.match(heading, /level = "h2"/, "Section headings must preserve h2 as the default for in-page sections");
assert.match(heading, /level === "h1" \? <h1/, "Section headings must support semantic page-level h1 headings");
assert.match(teamMembers, /<SectionHeading level="h1"/, "Team listing must use a page-level heading");
assert.match(homepage, /getPublicStats\(robots, competitions, members\)/, "Homepage statistics must reuse already-loaded public data rather than duplicate database queries");
assert.match(homepage, /featuredRobotImage \? `Published image of \$\{featuredRobot\?\.name\}` : "Abstract robotics engineering illustration; not a photograph of a Team Stellar robot"/, "Homepage must label approved robot imagery accurately and identify fallback concept art as illustrative");
assert.match(homepage, /Approved media from the public engineering archive/, "Homepage featured photography must be sourced from published robot media");
assert.match(homepage, /Design\. Build\. Test\. Compete\./, "Homepage hero must show the Team Stellar engineering message");
assert.doesNotMatch(homepage, /Hero Media Placeholder/, "Homepage must not display the old plain-text media placeholder");
assert.match(competitionArchive, /record\.competition, record\.organizer, record\.location, record\.robot, record\.segment, record\.result, String\(record\.year\), record\.date, record\.report, \.\.\.record\.teamMembers/, "Competition search must index event details, outcomes, year, dates, reports and team members");
assert.match(competitionArchive, /aria-label="Search competitions by event, organizer, location, robot, result, year, report or team member"/, "Competition search must have a descriptive accessible name");
assert.match(competitionArchive, /role="status" aria-live="polite" aria-atomic="true"/, "Competition result count must be announced to assistive technology");
assert.match(competitionsPage, /<CompetitionArchive records=\{competitions\} \/>/, "Competitions page must render the interactive archive");
assert.match(achievementsPage, /result !== "Participation"/, "Achievements page must exclude participation-only records");
assert.match(achievementsPage, /<CompetitionArchive records=\{achievements\} achievementsOnly \/>/, "Achievements must use the archive's achievements-only mode");

assert.match(sitemap, /getPublicRobots\(\)/, "Sitemap robot detail URLs must come from the public-safe data accessor");
assert.match(sitemap, /getPublicCompetitions\(\)/, "Sitemap competition detail URLs must come from the public-safe data accessor");
assert.match(sitemap, /getPublicResearch\(\)/, "Sitemap research detail URLs must come from the public-safe data accessor");
assert.doesNotMatch(sitemap, /\/admin|\/api\/|recruitment_applications|contact_messages|audit_logs|engineering_portal/i, "Sitemap must not expose private/admin routes or operational records");
assert.match(sitemap, /if \(!base\) return \[\]/, "Sitemap must remain empty when the canonical public site URL is not configured");
assert.match(robots, /disallow: \["\/admin", "\/api"\]/, "Crawler guidance must disallow admin and API routes");
assert.match(robots, /url\.protocol === "https:" \|\| url\.hostname === "localhost"/, "Robots sitemap URL must reject non-HTTPS production origins");
assert.match(robots, /if \(raw\)/, "Robots sitemap URL must be omitted when canonical site configuration is missing");
assert.match(robots, /server-side admin authentication remains the actual access control/, "Robots policy must explicitly distinguish crawler guidance from authorization");

console.log("Robot archive, homepage and public sitemap contract checks passed.");
