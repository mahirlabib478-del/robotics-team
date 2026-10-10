import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [archive, page, data, homepage, competitionArchive, competitionsPage, achievementsPage, sitemap] = await Promise.all([
  read("components/robot-archive.tsx"),
  read("app/robots/page.tsx"),
  read("lib/public-data.ts"),
  read("app/page.tsx"),
  read("components/competition-archive.tsx"),
  read("app/competitions/page.tsx"),
  read("app/achievements/page.tsx"),
  read("app/sitemap.ts"),
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
assert.match(homepage, /aria-label="Abstract robotics engineering illustration; not a photograph of a Team Stellar robot"/, "Homepage hero concept art must be clearly identified as illustrative, not documentary media");
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

console.log("Robot archive, homepage and public sitemap contract checks passed.");
