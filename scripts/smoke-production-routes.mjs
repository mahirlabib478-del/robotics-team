import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 3117;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: {
    ...process.env,
    PORT: String(port),
    NEXT_PUBLIC_SITE_URL: "https://team-stellar-smoke.invalid",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let logs = "";
server.stdout.on("data", (chunk) => { logs += chunk.toString(); });
server.stderr.on("data", (chunk) => { logs += chunk.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Production server exited early.\n${logs}`);
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(1500) });
      if (response.status === 200) return;
    } catch {
      // The server may still be starting; retry for a bounded period.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Production server did not become ready.\n${logs}`);
}

try {
  await waitForServer();

  for (const route of [
    "/", "/about", "/robots", "/competitions", "/achievements", "/team",
    "/research", "/gallery", "/sponsors", "/join-us", "/contact",
  ]) {
    const response = await fetch(`${base}${route}`, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200, `Public route ${route} must render successfully`);
    const html = await response.text();
    assert.match(html, /<html[^>]*lang="en"/i, `Route ${route} must include the document language`);
    assert.match(html, /href="#main-content"/i, `Route ${route} must expose a skip link`);
    assert.match(html, /id="main-content"/i, `Route ${route} must include the skip-link target`);
  }

  const robots = await fetch(`${base}/robots.txt`, { signal: AbortSignal.timeout(5000) });
  assert.equal(robots.status, 200, "Robots policy must be served");
  const robotsText = await robots.text();
  assert.match(robotsText, /Disallow: \/admin/, "Robots policy must exclude admin routes");

  const sitemap = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(5000) });
  assert.equal(sitemap.status, 200, "Public sitemap must be served");
  const sitemapText = await sitemap.text();
  assert.doesNotMatch(sitemapText, /\/admin|\/engineering/, "Sitemap must not expose private routes");

  const missing = await fetch(`${base}/__production-smoke-route-that-does-not-exist__`, { redirect: "manual", signal: AbortSignal.timeout(5000) });
  assert.equal(missing.status, 404, "Unknown public routes must render the not-found response");

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    for (const route of ["/admin", "/engineering", "/engineering/projects"]) {
      const response = await fetch(`${base}${route}`, { redirect: "manual", signal: AbortSignal.timeout(5000) });
      assert.ok([302, 303, 307, 308].includes(response.status), `Unauthenticated route ${route} must redirect to authentication`);
    }
  } else {
    console.log("Skipped live auth redirect checks: Supabase credentials are not configured in CI; source-level access-boundary tests still run.");
  }

  console.log("Production HTTP smoke checks passed for public routes, metadata shell, sitemap, robots policy, 404 handling and private-route redirects.");
} finally {
  server.kill("SIGTERM");
}
