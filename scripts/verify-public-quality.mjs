import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [layout, header, footer, about, contact, join, sitemap, robots, home, notFound, errorPage, adminAuth, styles, researchPage, researchDetail, researchAdmin, researchActions, publicData, schema, researchMigration] = await Promise.all([
  read("app/layout.tsx"),
  read("components/site-header.tsx"),
  read("components/site-footer.tsx"),
  read("app/about/page.tsx"),
  read("app/contact/page.tsx"),
  read("app/join-us/page.tsx"),
  read("app/sitemap.ts"),
  read("app/robots.ts"),
  read("app/page.tsx"),
  read("app/not-found.tsx"),
  read("app/error.tsx"),
  read("app/actions/admin-auth.ts"),
  read("app/globals.css"),
  read("app/research/page.tsx"),
  read("app/research/[slug]/page.tsx"),
  read("app/admin/research/page.tsx"),
  read("app/actions/admin-extended.ts"),
  read("lib/public-data.ts"),
  read("supabase/schema.sql"),
  read("supabase/migrations/20261010_research_cover_images.sql"),
]);

assert.match(layout, /<html lang="en">/, "Document must declare its language");
assert.match(layout, /title: \{ default: "Team Stellar \| BRAC University Robotics Team", template: "%s \| Team Stellar" \}/, "Site must provide default and templated page titles");
assert.match(layout, /description:/, "Site must provide a default meta description");
assert.match(styles, /prefers-reduced-motion:\s*reduce/, "Global styles must respect reduced-motion preferences");
assert.match(layout, /openGraph:\s*\{[\s\S]*?siteName: "Team Stellar"/, "Site must define social sharing metadata");
assert.match(layout, /Space_Grotesk/, "Brand heading font must be loaded through Next font optimization");
assert.match(layout, /JetBrains_Mono/, "Technical values must have the planned monospace font available");
assert.match(styles, /font-family: var\(--font-space-grotesk\)/, "Headings must use the brand display typeface");
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
assert.match(about, /getPublicRobots\(\)/, "About page should reuse approved public robot records for visual storytelling");
assert.match(about, /robot\.media\?\.find\(\(media\) => media\.type === "image"\)/, "About page must use only published robot images");
assert.match(about, /Only robots with approved public images are featured here/, "About page must not fabricate robot imagery when no approved media exists");
assert.match(about, /View robot record/, "Featured robot imagery must link to its public detail page");
assert.match(researchAdmin, /name="cover_image_url"/, "Research CMS must support approved cover image URLs");
assert.match(researchAdmin, /name="cover_image_alt"/, "Research CMS must require descriptive cover image alt text");
assert.match(researchActions, /safeHttps\(coverImageUrl\)/, "Research cover images must use HTTPS URLs");
assert.match(researchActions, /cover_image_alt: coverImageUrl \? coverImageAlt : null/, "Research cover image alt text must be saved with the image");
assert.match(publicData, /safePublicUrl\(result\.data\.cover_image_url\)/, "Research cover URLs must be sanitized before public rendering");
assert.match(researchPage, /post\.cover_image_url \? <Image/, "Research listing cards must render approved cover images");
assert.match(researchDetail, /post\.cover_image_url \? <Image/, "Research article detail must render approved cover images");
assert.match(schema, /cover_image_alt text, check \(cover_image_url is null or \(cover_image_alt is not null and length\(trim\(cover_image_alt\)\) > 0\)\)/, "Fresh schema must require alt text for research covers");
assert.match(researchMigration, /research_posts_cover_image_alt_required/, "Upgrade migration must enforce research cover accessibility metadata");
assert.match(notFound, /Return Home/, "Not-found page must provide a recovery path");
assert.ok((errorPage.match(/focus-visible:outline/g) ?? []).length >= 2, "Error recovery actions must show visible keyboard focus");
assert.match(adminAuth, /if \(!\/\^\\d\{6\}\$\/\.test\(code\)\)/, "Admin MFA must validate exactly six numeric digits");

console.log("Public accessibility and metadata contract checks passed.");
