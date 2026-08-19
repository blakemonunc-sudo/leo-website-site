import { cityTodayPath } from "../config/cities.js";
import { buildHeroProxyPath } from "./images.js";

export function buildTodayMetaDescription(cityName) {
  const city = cityName?.trim() || "your city";
  return `What to do in ${city} today — real-time picks for every part of your day, based on current weather, hours, and location. Updated daily.`;
}

export function buildTodayCanonicalPath(webCityId) {
  return cityTodayPath(webCityId);
}

export function absoluteSiteUrl(origin, pathname) {
  const base = String(origin ?? "").replace(/\/$/, "");
  const path = String(pathname ?? "").startsWith("/") ? pathname : `/${pathname ?? ""}`;
  if (!base) return path;
  return `${base}${path}`;
}

const TIMEZONE_ABBREVIATIONS = {
  "Asia/Tokyo": { 540: "JST" },
  "Europe/Paris": { 60: "CET", 120: "CEST" },
  "America/New_York": { "-300": "EST", "-240": "EDT" },
};

function getTimezoneOffsetMinutes(timeZone, date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value ?? "0";
  const asUtc = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second"))
  );
  return Math.round((asUtc - date.getTime()) / 60000);
}

export function getTimezoneAbbreviation(date, timeZone) {
  const intlAbbr =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "";

  if (intlAbbr && !/^(GMT|UTC)[+-]?/i.test(intlAbbr)) {
    return intlAbbr;
  }

  const offsetMin = getTimezoneOffsetMinutes(timeZone, date);
  const zoneMap = TIMEZONE_ABBREVIATIONS[timeZone];
  return zoneMap?.[offsetMin] ?? zoneMap?.[String(offsetMin)] ?? intlAbbr;
}

export function formatFreshnessEyebrow(generatedAt, timeZone, cityName) {
  const cityLabel = (cityName ?? "City").toUpperCase();
  if (!generatedAt || !timeZone) return cityLabel;

  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) return cityLabel;

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  const tzAbbr = getTimezoneAbbreviation(date, timeZone);
  const tzSuffix = tzAbbr ? ` ${tzAbbr}` : "";
  return `${cityLabel} · Updated ${dateLabel} at ${timeLabel}${tzSuffix}`;
}

export function isoDateLastmod(isoTimestamp) {
  if (!isoTimestamp) return "";
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonLdScript(data) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

function schemaTypeForActivity(activity) {
  if (activity?.type === "foodDrink") return "Restaurant";
  if (activity?.type === "sight") return "TouristAttraction";
  return "Place";
}

function schemaActivityName(activity) {
  if (!activity) return "";
  return activity.title?.trim() || activity.webTitle?.trim() || activity.place?.trim() || "";
}

function resolveActivityAddress(activity) {
  const address = activity?.address;
  if (!address) return null;
  if (typeof address === "string" && address.trim()) return address.trim();
  if (typeof address === "object") {
    const parts = [
      address.streetAddress,
      address.addressLocality,
      address.addressRegion,
      address.postalCode,
      address.addressCountry,
    ]
      .map((part) => String(part ?? "").trim())
      .filter(Boolean);
    if (parts.length) return parts.join(", ");
  }
  return null;
}

function resolveOpeningHours(activity) {
  const hours = activity?.openingHours ?? activity?.opening_hours;
  if (!hours) return null;
  if (typeof hours === "string" && hours.trim()) return hours.trim();
  if (Array.isArray(hours)) {
    const specs = hours
      .map((entry) => {
        if (typeof entry === "string") return entry.trim();
        if (entry && typeof entry === "object") {
          const day = entry.dayOfWeek ?? entry.day ?? "";
          const opens = entry.opens ?? "";
          const closes = entry.closes ?? "";
          if (day && opens && closes) return `${day} ${opens}-${closes}`;
        }
        return "";
      })
      .filter(Boolean);
    return specs.length ? specs : null;
  }
  return null;
}

function buildActivitySchemaEntity(activity, origin) {
  const name = schemaActivityName(activity);
  if (!name) return null;

  const entity = {
    "@type": schemaTypeForActivity(activity),
    name,
  };

  const address = resolveActivityAddress(activity);
  if (address) entity.address = address;

  const openingHours = resolveOpeningHours(activity);
  if (openingHours) {
    entity.openingHoursSpecification = Array.isArray(openingHours)
      ? openingHours
      : openingHours;
  }

  const priceRange = activity?.priceRange?.trim();
  if (priceRange) entity.priceRange = priceRange;

  const imagePath = buildHeroProxyPath(activity?.heroImage);
  if (imagePath && origin) entity.image = absoluteSiteUrl(origin, imagePath);

  const latitude = Number(activity?.latitude);
  const longitude = Number(activity?.longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    entity.geo = {
      "@type": "GeoCoordinates",
      latitude,
      longitude,
    };
  }

  return entity;
}

export function buildTodayItemListJsonLd({ city, periods, origin, periodHasActivity, buildPeriodDayName }) {
  const cityName = city?.name ?? "City";
  const activePeriods = (periods ?? []).filter(periodHasActivity);
  if (!activePeriods.length) return null;

  const itemListElement = activePeriods.map((period, index) => {
    const activity = period.activity;
    const periodName = buildPeriodDayName(period);
    const item = buildActivitySchemaEntity(activity, origin);
    const listItem = {
      "@type": "ListItem",
      position: index + 1,
      name: item?.name ? `${periodName}: ${item.name}` : periodName,
    };
    if (item) listItem.item = item;
    return listItem;
  });

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `What to Do in ${cityName} Today`,
    itemListElement,
  };
}

export function firstHeroImageUrl(periods, origin) {
  if (!origin) return "";
  for (const period of periods ?? []) {
    const path = buildHeroProxyPath(period?.activity?.heroImage);
    if (path) return absoluteSiteUrl(origin, path);
  }
  return "";
}

export function buildTodayHeadTags({
  city,
  pack,
  periods,
  origin,
  periodHasActivity,
  buildPeriodDayName,
}) {
  const cityName = city?.name ?? "City";
  const title = `What to Do in ${cityName} Today`;
  const description = buildTodayMetaDescription(cityName);
  const canonicalPath = buildTodayCanonicalPath(city?.webCityId ?? "");
  const canonicalUrl = absoluteSiteUrl(origin, canonicalPath);
  const ogImage = firstHeroImageUrl(periods, origin);

  const tags = [
    `<meta name="description" content="${escapeHtml(description)}">`,
    canonicalUrl ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">` : "",
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:type" content="website">`,
    canonicalUrl ? `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">` : "",
    ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : "",
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}">` : "",
  ].filter(Boolean);

  const jsonLd = buildTodayItemListJsonLd({
    city,
    periods,
    origin,
    periodHasActivity,
    buildPeriodDayName,
  });
  if (jsonLd) tags.push(jsonLdScript(jsonLd));

  return tags.join("\n  ");
}

export function renderSitemapXml(origin, entries) {
  const urls = (entries ?? [])
    .filter((entry) => entry?.loc)
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${escapeHtml(entry.lastmod)}</lastmod>` : "";
      return `  <url>\n    <loc>${escapeHtml(entry.loc)}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function buildSitemapEntries(origin, packResults) {
  const entries = [];
  let homeLastmod = "";

  for (const result of packResults ?? []) {
    const lastmod = isoDateLastmod(result?.pack?.generatedAt);
    if (lastmod && (!homeLastmod || lastmod > homeLastmod)) homeLastmod = lastmod;
    if (!result?.city || result.city.comingSoon) continue;
    entries.push({
      loc: absoluteSiteUrl(origin, cityTodayPath(result.city.webCityId)),
      lastmod,
    });
  }

  return [
    { loc: absoluteSiteUrl(origin, "/"), lastmod: homeLastmod },
    ...entries,
  ];
}

export function renderRobotsTxt(origin) {
  const sitemap = origin ? `\nSitemap: ${absoluteSiteUrl(origin, "/sitemap.xml")}` : "";
  return `User-agent: *
Disallow: /img/${sitemap}
`;
}
