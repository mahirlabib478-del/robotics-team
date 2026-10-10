import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [layout, header, footer, contact, join, sitemap, robots, home, notFound, errorPage] = await Promise.all([
  read("app/layout.tsx"),
  read("components/site-header.tsx"),
  read("components/site-footer.tsx"),
  read("app/contact/page.tsx"),
  read("app/join-us/page.tsx"),
  read("app/sitemap.ts"),
  read("app/robots.ts"),
  read("app/page.tsx"),
  read("app/not-found.tsx"),
  read("app/error.tsx"),
  read("app/actions/admin-auth.ts"),
]);

assert.match(layout, /<html lang="en">/, "Document must declare its language");
assert.match(layout, /title: \{ default: "Team Stellar \| BRAC University Robotics Team", template: "%s \| Team Stellar" \}/, "Site must provide default and templated page titles");
assert.match(layout, /description:/, "Site must provide a default meta description");
assert.match(layout, /href="#main-content"/, "Every route must offer a keyboard skip link");
assert.match(layout, /id="main-content" tabIndex=\{-1\}/, "Skip link target must be programmatically focusable");

assert.match(header, /aria-label="Primary navigation"/, "Desktop navigation needs an accessible name");
assert.match(header, /aria-label="Mobile navigation"/, "Mobile navigation needs an accessible name");
assert.match(header, /aria-label="Open site navigation menu"/, "Mobile menu summary needs a descriptive accessible name");
assert.match(header, /focus-visible:outline/, "Header links must retain visible keyboard focus");
assert.match(footer, /aria-label="Explore Team Stellar"/, "Explore footer navigation needs an accessible name");
assert.match(footer, /aria-label="Connect with Team Stellar"/, "Connect footer navigation needs an accessible name");
assert.match(footer, /focus-visible:outline/, "Footer links must retain visible keyboard focus");

for (const [source, label] of [[contact, "Contact"], [join, "Recruitment"]]) {
  assert.match(source, /role="status"/, `${label} form must announce successful submissions`);
  assert.match(source, /role="alert"/, `${label} form must announce submission errors`);
  assert.match(source, /name="website" tabIndex=\{-1\} autoComplete="off"/, `${label} form must include its spam honeypot`);
}
assert.match(contact, /<label[\s\S]*Message[\s\S]*<textarea name="message"/, "Contact message field must have a visible label");
assert.match(join, /function Field.*label.*input name=/s, "Recruitment inputs must be nested in their visible labels");

assert.match(sitemap, /if \(!base\) return \[\]/, "Sitemap must fail closed without a valid canonical site URL");
assert.match(sitemap, /getPublicRobots\(\)/, "Sitemap robot routes must use public-safe data");
assert.match(sitemap, /getPublicCompetitions\(\)/, "Sitemap competition routes must use public-safe data");
assert.doesNotMatch(sitemap, /\/admin|\/api\/|recruitment_applications|contact_messages|audit_logs|engineering_portal/i, "Sitemap must not enumerate private routes or records");
assert.match(robots, /disallow: \["\/admin", "\/api"\]/, "Crawler guidance must exclude admin and API routes");
assert.match(robots, /server-side admin authentication remains the actual access control/, "Crawler rules must not be confused with authorization");
assert.match(home, /focus-visible:outline/, "Homepage calls to action must retain visible keyboard focus");
assert.match(notFound, /Return Home/, "Not-found page must provide a recovery path");
assert.ok((errorPage.match(/focus-visible:outline/g) ?? []).length >= 2, "Error recovery actions must show visible keyboard focus");
assert.match(adminAuth, /if \(!\/\^\\d\{6\}\$\/\.test\(code\)\)/, "Admin MFA must validate exactly six numeric digits");

console.log("Public accessibility and metadata contract checks passed.");
