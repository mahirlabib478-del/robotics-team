import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

const headingIndex = page.indexOf("Engineering Robots.");
const artworkIndex = page.indexOf('aria-label="Abstract robotics engineering illustration');
const actionsIndex = page.indexOf('href="/robots"', artworkIndex);
assert.ok(headingIndex >= 0, "Homepage hero heading must remain present");
assert.ok(artworkIndex > headingIndex, "Robot artwork must follow the hero heading in document order");
assert.ok(actionsIndex > artworkIndex, "Mobile document order must place robot artwork before the hero CTA buttons");

assert.match(
  page,
  /grid min-h-\[70vh\][^"]*lg:grid-cols-\[1\.1fr_\.9fr\]/,
  "Hero must retain its two-column desktop grid",
);
assert.match(
  page,
  /lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:-translate-y-4/,
  "Desktop artwork must stay in the right column and retain its alignment adjustment",
);
assert.match(
  page,
  /flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center/,
  "Hero actions must stack vertically on mobile and become a row on larger screens",
);

for (const [href, label] of [
  ['href="/robots"', "Explore Our Robots"],
  ['href="/achievements"', "View Achievements"],
  ['href="/sponsors"', "Partner With Us"],
]) {
  const start = page.indexOf(href, actionsIndex);
  assert.ok(start >= actionsIndex && start >= 0, `Missing hero CTA: ${label}`);
  const end = page.indexOf("</Link>", start);
  const link = page.slice(start, end);
  assert.match(link, /w-full/, `${label} must be full width on mobile`);
  assert.match(link, /sm:w-auto/, `${label} must use natural width on larger screens`);
}

console.log("Homepage responsive layout checks passed.");
