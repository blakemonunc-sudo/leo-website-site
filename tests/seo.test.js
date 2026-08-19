import assert from "node:assert/strict";
import { test } from "node:test";
import { publishedCities } from "../config/cities.js";
import {
  buildSitemapEntries,
  buildTodayMetaDescription,
  formatFreshnessEyebrow,
  renderRobotsTxt,
  renderSitemapXml,
} from "../src/seo-today.js";

test("buildTodayMetaDescription templates city name", () => {
  assert.equal(
    buildTodayMetaDescription("Paris"),
    "What to do in Paris today — real-time picks for every part of your day, based on current weather, hours, and location. Updated daily."
  );
});

test("formatFreshnessEyebrow includes city-local date, time, and timezone", () => {
  assert.equal(
    formatFreshnessEyebrow("2026-07-07T15:30:00.000Z", "Asia/Tokyo", "Tokyo"),
    "TOKYO · Updated Jul 8, 2026 at 12:30 AM JST"
  );
  assert.equal(
    formatFreshnessEyebrow("2026-08-10T15:00:00.000Z", "Europe/Paris", "Paris"),
    "PARIS · Updated Aug 10, 2026 at 5:00 PM CEST"
  );
});

test("buildSitemapEntries includes homepage and published city pages only", () => {
  const entries = buildSitemapEntries("https://leo.example.com", [
    {
      city: publishedCities[0],
      pack: { generatedAt: "2026-07-07T15:30:00.000Z" },
      error: null,
    },
    {
      city: publishedCities[1],
      pack: { generatedAt: "2026-07-08T10:00:00.000Z" },
      error: null,
    },
    {
      city: { webCityId: "new-york", name: "New York", comingSoon: true },
      pack: null,
      error: null,
    },
  ]);

  assert.equal(entries.length, 3);
  assert.equal(entries[0].loc, "https://leo.example.com/");
  assert.equal(entries[0].lastmod, "2026-07-08");
  assert.match(entries[1].loc, /what-to-do-in-tokyo-today$/);
  assert.match(entries[2].loc, /what-to-do-in-paris-today$/);
  assert.doesNotMatch(JSON.stringify(entries), /new-york/);
});

test("renderSitemapXml and renderRobotsTxt include sitemap reference", () => {
  const xml = renderSitemapXml("https://leo.example.com", [
    { loc: "https://leo.example.com/", lastmod: "2026-07-08" },
  ]);
  assert.match(xml, /<urlset/);
  assert.match(xml, /<loc>https:\/\/leo\.example\.com\/<\/loc>/);
  assert.match(xml, /<lastmod>2026-07-08<\/lastmod>/);

  const robots = renderRobotsTxt("https://leo.example.com");
  assert.match(robots, /Disallow: \/img\//);
  assert.match(robots, /Sitemap: https:\/\/leo\.example\.com\/sitemap\.xml/);
});
