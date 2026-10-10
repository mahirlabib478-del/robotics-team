import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [page, archive, data] = await Promise.all([
  read("app/gallery/page.tsx"),
  read("components/gallery-archive.tsx"),
  read("lib/public-data.ts"),
]);

assert.match(page, /<GalleryArchive items=\{items\} \/>/, "Gallery page must use the interactive archive component");
assert.match(archive, /useState\("All media"\)/, "Gallery must provide an all-media filter");
assert.match(archive, /aria-pressed=\{activeCategory === category\}/, "Category controls must expose their selected state accessibly");
assert.match(archive, /new Set\(items\.map\(\(item\) => item\.category\)/, "Gallery filter options must preserve every published custom category");
assert.match(archive, /item\.category === activeCategory/, "Gallery category controls must filter the actual records");
assert.match(archive, /item\.title, item\.category, item\.caption \?\? "", item\.alt_text/, "Gallery search must cover title, category, caption and accessible description");
assert.ok(archive.includes('setActiveCategory("All media"); setSearch("")'), "Clear filters must reset category and search together");
assert.match(archive, /youtube-nocookie\.com\/embed/, "Gallery embeds must use privacy-enhanced YouTube URLs");
assert.match(archive, /alt=\{item\.alt_text\}/, "Gallery images must use their approved descriptive alt text");
assert.match(data, /\.eq\("publish_status","published"\)\.eq\("visibility","public"\)/, "Gallery must continue to receive only published public records");

console.log("Gallery filter and accessibility regression checks passed.");
