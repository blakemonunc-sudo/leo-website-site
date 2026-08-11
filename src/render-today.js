import { buildHeroProxyPath } from "./images.js";

export const APP_STORE_URL =
  "https://apps.apple.com/us/app/leo-spontaneous-travel-guide/id6755015197";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function celsiusToFahrenheit(c) {
  return Math.round((c * 9) / 5 + 32);
}

export function formatTempRange(tempMinC, tempMaxC) {
  if (typeof tempMinC !== "number" || typeof tempMaxC !== "number") return "";
  const minF = celsiusToFahrenheit(tempMinC);
  const maxF = celsiusToFahrenheit(tempMaxC);
  if (minF === maxF) return `${minF}°F`;
  return `${minF}–${maxF}°F`;
}

/** Single average °F from min/max Celsius (for hero period bands). */
export function formatAvgTemp(tempMinC, tempMaxC) {
  if (typeof tempMinC !== "number" || typeof tempMaxC !== "number") return "";
  const minF = celsiusToFahrenheit(tempMinC);
  const maxF = celsiusToFahrenheit(tempMaxC);
  return `${Math.round((minF + maxF) / 2)}°F`;
}

export function parsePeriodLabel(label) {
  const parts = String(label ?? "").split(" · ");
  if (parts.length >= 2) {
    return { condition: parts[0].trim(), periodName: parts.slice(1).join(" · ").trim() };
  }
  return { condition: label ?? "", periodName: "" };
}

/** Parse pack period.start ("HH:MM") as a 24-hour hour integer. */
function parseStartHour24(start) {
  const match = String(start ?? "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour24 = Number(match[1]);
  if (!Number.isInteger(hour24) || hour24 < 0 || hour24 > 23) return null;
  return hour24;
}

/**
 * Display name for a DayPeriod (homepage hero + city today headers).
 * Coffee → Morning Coffee (start before noon) / Afternoon Coffee (noon or later).
 */
export function formatHeroPeriodName(periodName, start) {
  const name = String(periodName ?? "").trim();
  if (name !== "Coffee") return name;
  const hour = parseStartHour24(start);
  if (hour == null) return "Coffee";
  return hour < 12 ? "Morning Coffee" : "Afternoon Coffee";
}

export function appendWhyTeaser(base, whyTeaser) {
  if (!whyTeaser) return base;
  const trimmed = whyTeaser.trim();
  if (trimmed.endsWith(".")) return `${base} ${trimmed}`;
  return `${base} ${trimmed}.`;
}

/** Capitalize first letter only; preserve established casing in the rest. */
export function capitalizeSentenceStart(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function ensureTrailingPeriod(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

export function buildSightCopy(activity) {
  const intro = activity.intro?.trim() ?? "";
  const base = intro ? ensureTrailingPeriod(intro) : "";
  return appendWhyTeaser(base, activity.whyTeaser);
}

export function buildFoodDrinkCopy(activity, period) {
  const mealName = (parsePeriodLabel(period?.label).periodName || "your meal").toLowerCase();
  const teaserAction = activity.teaserAction?.trim() ?? "";
  const restaurant = activity.title?.trim() ?? "";

  const actionClause = teaserAction
    ? teaserAction
    : activity.category?.trim()
      ? `try ${(activity.category ?? "").trim().toLowerCase()}`
      : "try something nearby";

  const first = ensureTrailingPeriod(`For ${mealName} ${actionClause}`);
  const second = restaurant ? `${restaurant} is open and nearby.` : "";
  return [first, second].filter(Boolean).join(" ");
}

export function buildSideQuestCopy(activity) {
  const rawTeaser = activity.teaserLower?.trim() || activity.teaser?.trim() || "";
  const teaser = capitalizeSentenceStart(rawTeaser);
  const location = activity.title?.trim() ?? "";
  return `${ensureTrailingPeriod(teaser)} ${location} is closest.`.replace(/\s+/g, " ").trim();
}

export function buildActivityCopy(activity, period) {
  if (!activity) return "";
  if (activity.type === "sight") return buildSightCopy(activity);
  if (activity.type === "foodDrink") return buildFoodDrinkCopy(activity, period);
  if (activity.type === "sideQuest") return buildSideQuestCopy(activity);
  return "";
}

export function normalizeWebsiteUrl(website) {
  if (typeof website !== "string") return null;
  const trimmed = website.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function formatUpdatedAt(generatedAt, timeZone) {
  if (!generatedAt || !timeZone) return "";
  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const month = get("month");
  const day = get("day");
  const year = get("year");
  if (!month || !day || !year) return "";
  return `${month} ${day}, ${year}`;
}

export function buildPeriodHeader(period, activity) {
  const { periodName } = parsePeriodLabel(period?.label);
  const dayPeriod = formatHeroPeriodName(periodName, period?.start) || "Today";
  if (!activity) return dayPeriod;

  if (activity.type === "sight") {
    const connector = activity.dayPeriodConnector?.trim() || "at";
    const place = activity.place?.trim() || activity.title?.trim() || "";
    return place ? `${dayPeriod} ${connector} ${place}` : dayPeriod;
  }
  if (activity.type === "sideQuest") {
    return `${dayPeriod} Side Quest!`;
  }
  if (activity.type === "foodDrink") {
    const name = activity.title?.trim() || "";
    return name ? `${dayPeriod} at ${name}` : dayPeriod;
  }
  return dayPeriod;
}

export function activityDescription(activity) {
  if (!activity) return "";
  if (activity.type === "foodDrink") return activity.description?.trim() ?? "";
  return activity.whyGo?.trim() ?? "";
}

function hasValidCoordinates(lat, lon) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lon));
}

function renderStats(activity) {
  const rows = [
    `<li><a href="${escapeHtml(APP_STORE_URL)}" rel="noopener noreferrer">Explore in the app →</a></li>`,
  ];

  if (hasValidCoordinates(activity?.latitude, activity?.longitude)) {
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${activity.latitude},${activity.longitude}`)}`;
    rows.push(
      `<li><a href="${escapeHtml(mapsUrl)}" rel="noopener noreferrer">Get directions →</a></li>`
    );
  }

  const website = normalizeWebsiteUrl(activity?.website);
  if (website) {
    rows.push(
      `<li><a href="${escapeHtml(website)}" rel="noopener noreferrer">Visit website →</a></li>`
    );
  }

  return `<ul class="stats">${rows.join("")}</ul>`;
}

function renderHero(activity) {
  const proxyPath = buildHeroProxyPath(activity?.heroImage);
  if (proxyPath) {
    return `<img class="hero" src="${escapeHtml(proxyPath)}" alt="" loading="lazy">`;
  }
  return `<div class="hero hero-placeholder" aria-hidden="true"></div>`;
}

function renderCaption(activity) {
  const caption = activity?.imageCaption?.trim();
  if (!caption) return "";
  const sourceUrl = normalizeWebsiteUrl(activity.imageSourceWebsite);
  if (sourceUrl) {
    return `<p class="image-caption"><a href="${escapeHtml(sourceUrl)}" rel="noopener noreferrer">${escapeHtml(caption)}</a></p>`;
  }
  return `<p class="image-caption">${escapeHtml(caption)}</p>`;
}

function renderPeriod(period) {
  const activity = period.activity;
  if (!activity) {
    return `
    <section class="period">
      <hr class="period-divider">
      <h2 class="period-title">${escapeHtml(buildPeriodHeader(period, null))}</h2>
      <p class="muted">No activity scheduled</p>
    </section>`;
  }

  const whyNow = activity.whyTeaser?.trim();
  const priceRange = activity.priceRange?.trim() || "—";
  const description = activityDescription(activity);

  return `
    <section class="period">
      <hr class="period-divider">
      ${renderHero(activity)}
      ${renderCaption(activity)}
      <h2 class="period-title">${escapeHtml(buildPeriodHeader(period, activity))}</h2>
      ${whyNow ? `<p class="why-now">Why now: ${escapeHtml(whyNow)}</p>` : ""}
      <p class="price-range">Price range: ${escapeHtml(priceRange)}</p>
      ${description ? `<p class="description">${escapeHtml(description)}</p>` : ""}
      ${renderStats(activity)}
    </section>`;
}

/**
 * @deprecated Multi-city tab page replaced by per-city pages. Kept for tests that still call it.
 */
export function renderTodayPage(packResults) {
  const first = packResults?.[0];
  if (!first) {
    return renderCityTodayPage({
      city: { webCityId: "tokyo", name: "Tokyo", timezone: "Asia/Tokyo" },
      pack: null,
      error: "No cities configured",
    });
  }
  return renderCityTodayPage(first);
}

export function renderCityTodayPage({ city, pack, error }) {
  const cityName = city?.name ?? "City";
  const title = `What to Do in ${cityName} Today`;
  const updated = formatUpdatedAt(pack?.generatedAt, city?.timezone);
  const intro = `${cityName} changes by the hour. Leo recommends things to do in ${cityName} for each period of the day. Places are picked based on open hours, the weather, and distance. Updated daily.`;

  let body;
  if (error) {
    body = `<p class="error">Could not load plan for ${escapeHtml(cityName)}: ${escapeHtml(error)}</p>`;
  } else if (!pack) {
    body = `<p class="muted">No plan available for ${escapeHtml(cityName)} yet.</p>`;
  } else {
    const periods = [...(pack.periods ?? [])].sort((a, b) => a.index - b.index);
    body = periods.map((period) => renderPeriod(period)).join("");
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — Leo</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.5;
      color: #111;
      background: #fafafa;
    }
    main {
      max-width: 640px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem;
    }
    h1 {
      font-size: 1.75rem;
      margin: 0 0 0.5rem;
      line-height: 1.2;
    }
    .updated {
      color: #666;
      font-size: 0.9rem;
      margin: 0 0 1rem;
    }
    .intro {
      margin: 0 0 1.5rem;
      color: #333;
    }
    .period {
      margin-bottom: 1.75rem;
    }
    .period-divider {
      border: 0;
      border-top: 1px solid #ddd;
      margin: 0 0 1rem;
    }
    .period-title {
      margin: 0 0 0.75rem;
      font-size: 1.25rem;
    }
    .why-now,
    .price-range,
    .description {
      margin: 0 0 0.5rem;
      color: #333;
    }
    .stats {
      list-style: none;
      padding: 0;
      margin: 0.75rem 0 1rem;
    }
    .stats li {
      margin: 0.25rem 0;
    }
    .stats a {
      color: #111;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .hero {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      display: block;
      margin: 0 0 0.5rem;
      background: #eee;
    }
    .hero-placeholder {
      min-height: 160px;
      background: linear-gradient(135deg, #ececec, #f7f7f7);
    }
    .image-caption {
      margin: 0;
      font-size: 0.85rem;
      color: #666;
    }
    .image-caption a {
      color: inherit;
    }
    .muted { color: #777; }
    .error { color: #a00; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    ${updated ? `<p class="updated">${escapeHtml(updated)}</p>` : ""}
    <p class="intro">${escapeHtml(intro)}</p>
    ${body}
  </main>
</body>
</html>`;
}
