import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [types, data, archive, detail] = await Promise.all([
  read("lib/types.ts"),
  read("lib/public-data.ts"),
  read("components/competition-archive.tsx"),
  read("app/competitions/[slug]/page.tsx"),
]);

assert.match(types, /location: string; country\?: string/, "Competition records must carry country as a separate optional field");
assert.match(data, /country:r\.country\?\?undefined/, "Competition archive query must preserve country without inferring it from city text");
assert.match(data, /country:data\.country\?\?undefined/, "Competition detail query must preserve country consistently");
assert.match(archive, /useState\("All countries"\)/, "Competition archive must offer a country filter");
assert.match(archive, /useState\("All robots"\)/, "Competition archive must offer a robot filter");
assert.match(archive, /record\.country === country/, "Country filter must use the structured country field");
assert.match(archive, /record\.robot === robot/, "Robot filter must match the selected robot");
assert.match(archive, /setCountry\("All countries"\)/, "Clear filters must reset country selection");
assert.match(archive, /setRobot\("All robots"\)/, "Clear filters must reset robot selection");
assert.match(archive, /countries\.map\(\(item\) => <option key=\{item\}>\{item\}<\/option>\)/, "Country choices must be derived from available published records");
assert.match(archive, /robots\.map\(\(item\) => <option key=\{item\}>\{item\}<\/option>\)/, "Robot choices must be derived from available published records");

console.log("Competition country and robot filter regression checks passed.");
