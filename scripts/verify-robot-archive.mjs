import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [archive, page, data] = await Promise.all([
  read("components/robot-archive.tsx"),
  read("app/robots/page.tsx"),
  read("lib/public-data.ts"),
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

console.log("Robot archive contract checks passed.");
