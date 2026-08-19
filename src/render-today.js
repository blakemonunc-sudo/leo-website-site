import { buildHeroProxyPath } from "./images.js";
import { navAssetTags, renderSiteNav } from "./render-nav.js";
import { renderSiteClosing, siteChromeAssetTags } from "./render-site-chrome.js";
import { buildTodayHeadTags, formatFreshnessEyebrow } from "./seo-today.js";

export { conditionsLabelFromLeoMagicPct } from "./leo-magic.js";

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

export const CONDITION_SYMBOLS = {
  Clear: "☀️",
  "Partly Cloudy": "⛅",
  Cloudy: "☁️",
  Overcast: "☁️",
  Showery: "🌦️",
  Rainy: "🌧️",
  Stormy: "⛈️",
};

export function parsePeriodLabel(label) {
  const parts = String(label ?? "").split(" · ");
  if (parts.length >= 2) {
    return { condition: parts[0].trim(), periodName: parts.slice(1).join(" · ").trim() };
  }
  return { condition: label ?? "", periodName: "" };
}

/** True when a pack period has a scheduled activity to show. */
export function periodHasActivity(period) {
  return Boolean(period?.activity);
}

/** Weather symbol + avg °F for homepage period bands. */
export function buildPeriodWeatherLine(period) {
  const { condition } = parsePeriodLabel(period?.label);
  const hasCondition = Boolean(String(condition ?? "").trim());
  const avgTempLabel = formatAvgTemp(period?.tempMinC, period?.tempMaxC);
  if (!hasCondition && !avgTempLabel) return "";

  const symbol = CONDITION_SYMBOLS[condition] ?? "🌤️";
  return [symbol, avgTempLabel].filter(Boolean).join(" ");
}

function dominantConditionLabel(condition) {
  const key = String(condition ?? "").trim();
  if (!key) return "mixed conditions";
  const lower = key.toLowerCase();
  if (lower === "partly cloudy") return "partly cloudy";
  if (lower === "overcast") return "overcast";
  return lower;
}

/**
 * Day-level weather summary from all periods with activities.
 * @returns {{ symbol: string, tempRange: string, dominantCondition: string, sentence: string }}
 */
export function buildDaySummary(periods) {
  const active = (periods ?? []).filter(periodHasActivity);
  if (!active.length) {
    return { symbol: "", tempRange: "", dominantCondition: "", sentence: "" };
  }

  const conditionCounts = new Map();
  for (const period of active) {
    const { condition } = parsePeriodLabel(period.label);
    const key = String(condition ?? "").trim();
    if (!key) continue;
    conditionCounts.set(key, (conditionCounts.get(key) ?? 0) + 1);
  }

  let dominantCondition = "";
  let maxCount = 0;
  for (const [condition, count] of conditionCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      dominantCondition = condition;
    }
  }

  const symbol = CONDITION_SYMBOLS[dominantCondition] ?? "🌤️";

  const mins = active.map((p) => p.tempMinC).filter((n) => typeof n === "number");
  const maxs = active.map((p) => p.tempMaxC).filter((n) => typeof n === "number");
  const tempMinC = mins.length ? Math.min(...mins) : null;
  const tempMaxC = maxs.length ? Math.max(...maxs) : null;
  const tempRange = formatTempRange(tempMinC, tempMaxC);

  const phrase = dominantConditionLabel(dominantCondition);
  const sentence = tempRange
    ? `Mostly ${phrase} today, from ${tempRange}.`
    : `Mostly ${phrase} today.`;

  return { symbol, tempRange, dominantCondition, sentence };
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

/** Day-period display name only (e.g. Afternoon, Morning Coffee). */
export function buildPeriodDayName(period) {
  const { periodName } = parsePeriodLabel(period?.label);
  return formatHeroPeriodName(periodName, period?.start) || periodName || "Today";
}

/**
 * Main period title with DayPeriod included.
 * Sight → `{DayPeriod} {connector} {place}`; Side Quest → `{DayPeriod}: {webTitle}`
 * or `{DayPeriod} Side Quest!`; Food & Drink → `{DayPeriod} at {title}`.
 */
export function buildPeriodHeader(period, activity) {
  const dayPeriod = buildPeriodDayName(period);
  if (!activity) return dayPeriod;

  if (activity.type === "sight") {
    const connector = activity.dayPeriodConnector?.trim() || "at";
    const place = activity.place?.trim() || activity.title?.trim() || "";
    return place ? `${dayPeriod} ${connector} ${place}` : dayPeriod;
  }
  if (activity.type === "sideQuest") {
    const webTitle = activity.webTitle?.trim();
    if (webTitle) return `${dayPeriod}: ${webTitle}`;
    return `${dayPeriod} Side Quest!`;
  }
  if (activity.type === "foodDrink") {
    const name = activity.title?.trim() || "";
    return name ? `${dayPeriod} at ${name}` : dayPeriod;
  }
  return dayPeriod;
}

/** Activity-only title for hero overlay (DayPeriod is shown in the badge). */
export function activityHeroTitle(activity) {
  if (!activity) return "";
  if (activity.type === "sight") {
    return activity.place?.trim() || activity.title?.trim() || "";
  }
  if (activity.type === "foodDrink") {
    return activity.title?.trim() || "";
  }
  if (activity.type === "sideQuest") {
    return activity.webTitle?.trim() || activity.title?.trim() || "Side Quest!";
  }
  return "";
}

/**
 * AdventureView intro paragraph (first sentence before why_go).
 * Formula: "{vibeString}, {teaserConnector} {teaser}" where
 * vibeString = [vibeName, connector, place].filter(Boolean).join(" ").
 * Pack often ships the same string as `intro` without a separate `teaser`.
 */
export function buildSightDescriptionSentence(activity) {
  const vibeName = activity?.vibeName?.trim() ?? "";
  const connector = activity?.connector?.trim() ?? "";
  const place = activity?.place?.trim() ?? "";
  const teaserConnector = activity?.teaserConnector?.trim() ?? "";
  const teaser = activity?.teaser?.trim() ?? "";
  const vibeString = [vibeName, connector, place].filter(Boolean).join(" ");

  if (teaser) {
    if (vibeString) {
      return teaserConnector
        ? `${vibeString}, ${teaserConnector} ${teaser}`
        : `${vibeString}, ${teaser}`;
    }
    return teaser;
  }

  const intro = activity?.intro?.trim() ?? "";
  if (intro) return intro;
  return vibeString;
}

/** ChallengeTeaser: capitalize teaser and ensure a trailing period. */
export function buildSideQuestDescriptionSentence(activity) {
  const teaser = activity?.teaser?.trim() ?? "";
  if (!teaser) return "";
  const withPeriod = teaser.endsWith(".") ? teaser : `${teaser}.`;
  return capitalizeSentenceStart(withPeriod);
}

export function activityDescription(activity) {
  if (!activity) return "";
  if (activity.type === "foodDrink") return activity.description?.trim() ?? "";
  if (activity.type === "sight" || activity.type === "sideQuest") {
    return activity.webDescription?.trim() ?? "";
  }
  return "";
}

function renderAppPlug(activity) {
  if (activity?.type !== "sight" && activity?.type !== "sideQuest") return "";
  const plug = activity.appPlug?.trim() ?? "";
  if (!plug) return "";
  return `<div class="app-plug"><p class="app-plug-text">${escapeHtml(plug)}</p></div>`;
}

function renderPeriodDirections() {
  return `<div class="period-actions">
      <button type="button" class="period-directions">
        <span class="period-directions-label">Directions</span>
        <span class="period-directions-symbol" aria-hidden="true">→</span>
      </button>
    </div>`;
}

function activityItineraryTitle(activity) {
  if (!activity) return "";
  if (activity.type === "sideQuest") {
    return activity.webTitle?.trim() || activity.title?.trim() || "Side Quest";
  }
  if (activity.type === "foodDrink") {
    return activity.title?.trim() || activity.category?.trim() || "";
  }
  return activity.title?.trim() || activity.place?.trim() || "";
}

function renderItineraryLink(period) {
  const sectionId = periodSectionId(period);
  const periodName = dayPeriodNavName(period);
  const activityTitle = activityItineraryTitle(period.activity);
  return `<a class="today-itinerary-link" href="#${escapeHtml(sectionId)}" data-period="${escapeHtml(sectionId)}">
    <span class="today-itinerary-dot" aria-hidden="true"></span>
    <span class="today-itinerary-label">
      <span class="today-itinerary-period">${escapeHtml(periodName)}</span>
      ${activityTitle ? `<span class="today-itinerary-activity">${escapeHtml(activityTitle)}</span>` : ""}
    </span>
  </a>`;
}

function renderItineraryNav(periods, { className = "today-itinerary", id = "", ariaLabel = "Today's itinerary" } = {}) {
  if (!periods?.length) return "";
  const idAttr = id ? ` id="${escapeHtml(id)}"` : "";
  const links = periods.map((period) => renderItineraryLink(period)).join("");
  return `<nav class="${escapeHtml(className)}"${idAttr} aria-label="${escapeHtml(ariaLabel)}">${links}</nav>`;
}

function renderDaySummaryBand(summary, periods = []) {
  if (!summary?.sentence) return "";
  const embeddedNav = periods.length
    ? renderItineraryNav(periods, {
        className: "today-itinerary today-itinerary--embedded",
        id: "today-itinerary-mobile",
        ariaLabel: "Today's itinerary",
      })
    : "";
  return `<section class="today-day-summary" aria-label="Today's weather and itinerary">
    <div class="today-day-summary-weather">
      <span class="today-day-summary-symbol" aria-hidden="true">${escapeHtml(summary.symbol)}</span>
      <div class="today-day-summary-text">
        ${summary.tempRange ? `<p class="today-day-summary-temp">${escapeHtml(summary.tempRange)}</p>` : ""}
        <p class="today-day-summary-sentence">${escapeHtml(summary.sentence)}</p>
      </div>
    </div>
    ${embeddedNav}
  </section>`;
}

function renderItinerarySidebar(periods) {
  if (!periods?.length) return "";
  return `<aside class="today-sidebar today-sidebar--desktop">
    <h2 class="today-sidebar-heading">Today&rsquo;s Itinerary</h2>
    ${renderItineraryNav(periods, {
      className: "today-itinerary today-itinerary--sidebar",
      id: "today-itinerary",
      ariaLabel: "Today's itinerary",
    })}
  </aside>`;
}

function renderMobileNudge() {
  return `<section class="today-mobile-nudge" aria-label="Download Leo">
    <p class="today-mobile-nudge-copy">Get directions &amp; personalized plans in Leo</p>
    <a class="today-mobile-nudge-cta" href="${escapeHtml(APP_STORE_URL)}" rel="noopener noreferrer">Download</a>
  </section>`;
}

const CITY_CURRENCY = {
  tokyo: "¥",
  paris: "€",
  nyc: "$",
  "new-york": "$",
};

export function resolveCurrencySymbol(activity, city) {
  const fromActivity = activity?.currency?.trim();
  if (fromActivity) return fromActivity;
  const fromTier = activity?.priceRange?.match(/[¥€$]/)?.[0];
  if (fromTier) return fromTier;
  return CITY_CURRENCY[city?.webCityId] ?? "$";
}

/** iOS AdvView / AdventureView / ChallengeView hrs notation, with web-specific rules:
 * - exactly 1 hour → "1 hr"
 * - under 1 hour → "X min" (whole minutes)
 * - other whole hours → "N hrs"
 * - fractional ≥ 1 hour → "X.X hrs"
 */
export function formatDurationHoursLabel(hours) {
  const n = Number(hours);
  if (!Number.isFinite(n) || n < 0) return "";
  if (n > 0 && n < 1) {
    const minutes = Math.round(n * 60);
    return `${minutes} min`;
  }
  if (n === 1) return "1 hr";
  if (n % 1 === 0) return `${Math.trunc(n)} hrs`;
  return `${n.toFixed(1)} hrs`;
}

/** gp_categories.name from the batch minimizer is exposed on pack activities as `category`. */
export function resolveGpCategoryDisplayName(activity) {
  const gpCategories = activity?.gp_categories ?? activity?.gpCategories;
  if (gpCategories) {
    if (Array.isArray(gpCategories)) {
      const name = gpCategories[0]?.name?.trim();
      if (name) return name;
    } else if (typeof gpCategories === "object") {
      const name = gpCategories.name?.trim();
      if (name) return name;
    }
  }
  return activity?.category?.trim() ?? "";
}

function buildDurationAriaLabel(hours) {
  const label = formatDurationHoursLabel(hours);
  if (!label) return "";
  if (label.endsWith(" min")) {
    const minutes = label.replace(" min", "");
    return `Duration: ${minutes} minute${minutes === "1" ? "" : "s"}`;
  }
  if (label === "1 hr") return "Duration: 1 hour";
  if (label.endsWith(" hrs")) return `Duration: ${label.replace(" hrs", " hours")}`;
  return `Duration: ${label}`;
}

function buildWeatherAriaLabel(period) {
  const { condition } = parsePeriodLabel(period?.label);
  const avgTemp = formatAvgTemp(period?.tempMinC, period?.tempMaxC);
  const parts = [];
  if (avgTemp) parts.push(avgTemp);
  if (condition) parts.push(condition.toLowerCase());
  if (!parts.length) return "";
  return `Weather: ${parts.join(", ")}`;
}

function renderInfoChip({ symbol, text, joinWithDot = false, ariaLabel = "" }) {
  const pieces = [];
  if (symbol) {
    pieces.push(`<span class="info-symbol" aria-hidden="true">${escapeHtml(symbol)}</span>`);
  }
  if (joinWithDot && symbol && text) {
    pieces.push(`<span class="info-chip-sep" aria-hidden="true">·</span>`);
  }
  if (text) {
    pieces.push(`<span class="info-text">${escapeHtml(text)}</span>`);
  }
  if (!pieces.length) return "";
  const labelAttr = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : "";
  return `<div class="info-chip"${labelAttr}>${pieces.join("")}</div>`;
}

export function renderInfoSection(activity, { city, period } = {}) {
  if (!activity) return "";
  const chips = [];

  const priceRange = activity.priceRange?.trim();
  if (priceRange) {
    chips.push(renderInfoChip({ text: priceRange, ariaLabel: `Price level: ${priceRange}` }));
  }

  const durationLabel = formatDurationHoursLabel(activity.durationHours);
  if (durationLabel) {
    chips.push(
      renderInfoChip({
        text: durationLabel,
        ariaLabel: buildDurationAriaLabel(activity.durationHours),
      })
    );
  }

  const setting = activity.setting?.trim();
  if (setting) {
    chips.push(renderInfoChip({ text: setting, ariaLabel: `Setting: ${setting}` }));
  }

  if (activity.type === "foodDrink") {
    const categoryName = resolveGpCategoryDisplayName(activity);
    if (categoryName) {
      chips.push(
        renderInfoChip({ text: categoryName, ariaLabel: `Category: ${categoryName}` })
      );
    }
  }

  if (!chips.length) return "";

  const hstack = `<div class="info-hstack">${chips.join("")}</div>`;
  return `<div class="info-section">${hstack}</div>`;
}

function renderHeroBadgeStack(periodBadge, weatherBadge, { weatherAriaLabel = "" } = {}) {
  if (!periodBadge && !weatherBadge) return "";

  const weatherAttr = weatherAriaLabel
    ? ` aria-label="${escapeHtml(weatherAriaLabel)}"`
    : "";

  if (periodBadge && weatherBadge) {
    return `<div class="hero-badges">
    <span class="hero-badge hero-badge--period">
      <span class="hero-badge-period-name">${escapeHtml(periodBadge)}</span>
      <span class="hero-badge-weather"${weatherAttr}>${escapeHtml(weatherBadge)}</span>
    </span>
  </div>`;
  }

  if (periodBadge) {
    return `<div class="hero-badges">
    <span class="hero-badge hero-badge--period">
      <span class="hero-badge-period-name">${escapeHtml(periodBadge)}</span>
    </span>
  </div>`;
  }

  return `<div class="hero-badges">
    <span class="hero-badge hero-badge--weather">${escapeHtml(weatherBadge)}</span>
  </div>`;
}

function renderHero(activity, period, headerTitle) {
  const proxyPath = buildHeroProxyPath(activity?.heroImage);
  const media = proxyPath
    ? `<img class="hero" src="${escapeHtml(proxyPath)}" alt="" loading="lazy">`
    : `<div class="hero hero-placeholder" aria-hidden="true"></div>`;

  const periodBadge = buildPeriodDayName(period);
  const weatherBadge = buildPeriodWeatherLine(period);
  const badgeStack = renderHeroBadgeStack(periodBadge, weatherBadge, {
    weatherAriaLabel: buildWeatherAriaLabel(period),
  });
  const overlayBadges = `<div class="hero-overlay">
    ${badgeStack}
    ${headerTitle ? `<h2 class="hero-title">${escapeHtml(headerTitle)}</h2>` : ""}
  </div>`;

  const caption = activity?.imageCaption?.trim();
  const creditHtml = caption
    ? (() => {
        const sourceUrl = normalizeWebsiteUrl(activity.imageSourceWebsite);
        const creditBody = sourceUrl
          ? `<a href="${escapeHtml(sourceUrl)}" rel="noopener noreferrer">${escapeHtml(caption)}</a>`
          : escapeHtml(caption);
        return `<div class="hero-credit">
        <button type="button" class="hero-credit-btn" aria-label="Image source" aria-expanded="false">
          <span class="hero-credit-icon" aria-hidden="true">i</span>
        </button>
        <p class="hero-credit-popover">${creditBody}</p>
      </div>`;
      })()
    : "";

  return `<div class="hero-frame">
      ${media}
      ${overlayBadges}
      ${creditHtml}
    </div>`;
}

function periodSectionId(period) {
  const index = Number.isFinite(Number(period?.index)) ? Number(period.index) : 0;
  return `period-${index}`;
}

function dayPeriodNavName(period) {
  return buildPeriodDayName(period);
}

function renderPeriod(period, { city, isLast = false } = {}) {
  const activity = period.activity;
  if (!activity) return "";
  const sectionId = periodSectionId(period);
  const headerTitle = activityHeroTitle(activity);

  const description = activityDescription(activity);
  const infoSectionHtml = renderInfoSection(activity, { city, period });
  const divider = isLast ? "" : `<hr class="period-divider">`;

  return `
    <section class="period" id="${escapeHtml(sectionId)}">
      ${renderHero(activity, period, headerTitle)}
      ${description ? `<p class="description">${escapeHtml(description)}</p>` : ""}
      ${renderAppPlug(activity)}
      ${infoSectionHtml}
      ${renderPeriodDirections()}
      ${divider}
    </section>`;
}

function renderPeriodsWithNudge(periods, { city } = {}) {
  return periods
    .map((period, index) => {
      const isLast = index === periods.length - 1;
      const html = renderPeriod(period, { city, isLast });
      if (index === 1 && periods.length >= 3) {
        return `${html}${renderMobileNudge()}`;
      }
      return html;
    })
    .join("");
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

export function renderCityTodayPage({ city, pack, error, origin = "" }) {
  const cityName = city?.name ?? "City";
  const title = `What to Do in ${cityName} Today`;
  const intro = `${cityName} changes by the hour. Leo recommends things to do in ${cityName} for every period of the day. Places are picked based on open hours, the weather, and distance. Updated daily.`;

  const periods = pack
    ? [...(pack.periods ?? [])].sort((a, b) => a.index - b.index).filter(periodHasActivity)
    : [];
  const daySummary = buildDaySummary(periods);

  let body;
  if (error) {
    body = `<p class="error">Could not load plan for ${escapeHtml(cityName)}: ${escapeHtml(error)}</p>`;
  } else if (!pack) {
    body = `<p class="muted">No plan available for ${escapeHtml(cityName)} yet.</p>`;
  } else if (!periods.length) {
    body = `<p class="muted">No activities scheduled for ${escapeHtml(cityName)} today.</p>`;
  } else {
    body = `<div class="today-layout">
      ${renderItinerarySidebar(periods)}
      <div class="today-periods">${renderPeriodsWithNudge(periods, { city })}</div>
    </div>`;
  }

  const eyebrow = formatFreshnessEyebrow(pack?.generatedAt, city?.timezone, cityName);
  const headTags = buildTodayHeadTags({
    city,
    pack,
    periods,
    origin,
    periodHasActivity,
    buildPeriodDayName,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — Leo</title>
  ${headTags}
  ${navAssetTags()}
  ${siteChromeAssetTags()}
  <style>
    :root {
      --leo-blue: #3269d9;
      --leo-blue-light: #eaf0fb;
      --leo-blue-mid: #7ea1e7;
      --leo-blue-lightest: #f5f8fd;
      --leo-blue-dark: #1b294b;
      --leo-blue-paper: #fdfdfe;
      --leo-gray: #b3b3b3;
      --leo-gray-subtitle: #737373;
      --leo-gray-dark: #333333;
      --leo-gray-light: #f7f7f7;
      --leo-gray-paper: #fefefe;
      --leo-yellow-lightest: #fefcf6;
      --leo-red: #f24130;
      --border: #e6e2d8;
      --ink: var(--leo-gray-dark);
      --muted: var(--leo-gray-subtitle);
      --cream: var(--leo-yellow-lightest);
      --font-display: Georgia, "Times New Roman", serif;
      --font-body: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --page-gutter: clamp(1rem, 4vw, 1.875rem);
      --today-max: 1100px;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: var(--font-body);
      line-height: 1.5;
      color: var(--ink);
      background: var(--cream);
      -webkit-font-smoothing: antialiased;
    }
    main {
      max-width: var(--today-max);
      margin: 0 auto;
      padding: calc(var(--leo-nav-offset, 56px) + 1.25rem) var(--page-gutter) 3rem;
    }
    .today-lede { margin-bottom: 1.5rem; }
    .today-eyebrow {
      margin: 0 0 0.65rem;
      font-family: var(--font-body);
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    h1 {
      font-family: var(--font-display);
      font-size: clamp(2.3125rem, 6.25vw, 3.4375rem);
      font-weight: 400;
      margin: 0 0 0.85rem;
      line-height: 1.12;
    }
    .today-lede-line2 { display: block; }
    .intro {
      margin: 0;
      color: var(--ink);
      font-size: 1rem;
      max-width: 42rem;
    }
    .today-day-summary {
      display: flex;
      flex-direction: column;
      gap: 0;
      margin-bottom: 1.5rem;
      padding: 1rem 1.1rem;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    .today-day-summary-weather {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
    }
    .today-day-summary-symbol {
      font-size: 1.75rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .today-day-summary-text { min-width: 0; }
    .today-day-summary-temp {
      margin: 0 0 0.2rem;
      font-family: var(--font-display);
      font-size: 1.35rem;
      line-height: 1.1;
    }
    .today-day-summary-sentence {
      margin: 0;
      color: var(--muted);
      font-size: 0.95rem;
    }
    .today-itinerary--embedded {
      display: none;
    }
    .today-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.75rem;
      align-items: start;
    }
    .today-sidebar-heading {
      margin: 0 0 0.85rem;
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 400;
      line-height: 1.2;
    }
    .today-itinerary {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .today-itinerary--sidebar {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .today-itinerary-link {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      padding: 0.55rem 0.35rem;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: background-color 150ms ease;
    }
    .today-itinerary-link:hover { background: rgba(50, 105, 217, 0.06); }
    .today-itinerary-link.is-active .today-itinerary-period { color: var(--leo-blue); }
    .today-itinerary-link.is-active .today-itinerary-dot {
      background: var(--leo-blue);
      box-shadow: 0 0 0 3px var(--leo-blue-light);
    }
    .today-itinerary-dot {
      width: 8px;
      height: 8px;
      margin-top: 0.45rem;
      border-radius: 50%;
      background: var(--leo-gray);
      flex-shrink: 0;
      transition: background-color 150ms ease, box-shadow 150ms ease;
    }
    .today-itinerary-label {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-width: 0;
    }
    .today-itinerary-period {
      font-family: var(--font-display);
      font-size: 0.98rem;
      line-height: 1.2;
      transition: color 150ms ease;
    }
    .today-itinerary-activity {
      font-size: 0.82rem;
      color: var(--muted);
      line-height: 1.25;
    }
    .today-periods { min-width: 0; }
    .period {
      margin-bottom: 2rem;
      scroll-margin-top: calc(var(--leo-nav-offset, 56px) + 16px);
    }
    .period:last-child { margin-bottom: 0; }
    .description {
      margin: 0.85rem 0 0.65rem;
      color: var(--ink);
      white-space: pre-line;
    }
    .app-plug { margin: 0.65rem 0 0.75rem; }
    .app-plug-text {
      margin: 0;
      color: var(--ink);
      white-space: pre-line;
      font-size: 0.95rem;
    }
    .period-actions { margin: 0.65rem 0 0; }
    .period-divider {
      border: 0;
      border-top: 1px solid var(--border);
      margin: 1.5rem 0 0;
    }
    .period-directions {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      padding: 0;
      border: 0;
      background: none;
      font-family: var(--font-body);
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--leo-blue);
      cursor: pointer;
      text-decoration: none;
    }
    .period-directions:hover .period-directions-label { text-decoration: underline; }
    .period-directions:focus-visible {
      outline: 2px solid var(--leo-blue);
      outline-offset: 3px;
      border-radius: 4px;
    }
    .today-mobile-nudge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin: 0.5rem 0 1.75rem;
      padding: 0.85rem 1rem;
      background: var(--leo-blue-lightest);
      border: 1px solid rgba(50, 105, 217, 0.15);
      border-radius: 12px;
    }
    .today-mobile-nudge-copy {
      margin: 0;
      font-size: 0.9rem;
      color: var(--leo-blue-dark);
    }
    .today-mobile-nudge-cta {
      flex-shrink: 0;
      padding: 0.45rem 0.85rem;
      border-radius: 999px;
      background: var(--leo-blue);
      color: var(--leo-blue-paper);
      font-family: var(--font-display);
      font-size: 0.85rem;
      text-decoration: none;
    }
    .info-section { margin: 0.75rem 0 0.5rem; }
    .info-hstack {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-start;
      gap: 0.35rem;
      font-size: clamp(0.78rem, 2.7vw, 0.92rem);
      color: var(--ink);
    }
    .info-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3em;
      padding: 0.35rem 0.55rem;
      background: var(--leo-blue-light);
      color: var(--leo-blue-dark);
      border-radius: 5pt;
      white-space: nowrap;
    }
    .info-chip .info-symbol { font-size: 1em; }
    .info-chip-sep { color: var(--leo-blue); opacity: 0.65; }
    .hero-frame {
      position: relative;
      overflow: hidden;
      --hero-corner-radius: 14px;
      --hero-badge-corner-radius: calc(var(--hero-corner-radius) * 10 / 14);
      border-radius: var(--hero-corner-radius);
      background: var(--leo-gray-light);
    }
    .hero {
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      display: block;
      margin: 0;
    }
    .hero-placeholder {
      min-height: 200px;
      background: linear-gradient(135deg, #ececec, #f7f7f7);
    }
    .hero-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      --hero-overlay-inset: 0.85rem;
      padding: var(--hero-overlay-inset);
      background: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.35) 0%,
        rgba(0, 0, 0, 0.05) 38%,
        rgba(0, 0, 0, 0.55) 100%
      );
      pointer-events: none;
    }
    .hero-badges {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.35rem;
    }
    .hero-badge {
      padding: 0.35rem 0.65rem;
      border: 0.1pt solid var(--leo-blue-mid);
      border-radius: var(--hero-badge-corner-radius);
      font-family: var(--font-body);
      font-size: 0.78rem;
      font-weight: 600;
      line-height: 1;
      color: #fff;
      background: rgba(0, 0, 0, 0.55);
      pointer-events: none;
    }
    .hero-badge--period {
      display: inline-flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
      background: color-mix(in srgb, var(--leo-blue-dark) 80%, transparent);
      color: var(--leo-blue-paper);
      text-align: left;
    }
    .hero-badge-period-name {
      font-size: 0.975rem;
      font-weight: 700;
      line-height: 1.1;
    }
    .hero-badge-weather {
      font-size: 0.78rem;
      font-weight: 600;
      line-height: 1;
    }
    .hero-title {
      margin: 0;
      margin-top: auto;
      font-family: var(--font-display);
      font-size: clamp(1.25rem, 3.5vw, 1.65rem);
      font-weight: 700;
      line-height: 1.15;
      color: var(--leo-blue-paper);
      text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
    }
    .hero-credit {
      position: absolute;
      left: 0.55rem;
      right: 0.55rem;
      bottom: 0.55rem;
      margin: 0;
      z-index: 2;
      display: flex;
      justify-content: flex-end;
      pointer-events: none;
    }
    .hero-credit-btn {
      pointer-events: auto;
      cursor: pointer;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      margin-left: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--hero-badge-corner-radius);
      border: 0.1pt solid var(--leo-blue-mid);
      background: color-mix(in srgb, var(--leo-blue-dark) 80%, transparent);
      color: var(--leo-blue-paper);
    }
    .hero-credit-icon {
      font-family: var(--font-display);
      font-size: 0.85rem;
      font-style: italic;
      font-weight: 700;
      line-height: 1;
    }
    .hero-credit-popover {
      pointer-events: auto;
      display: none;
      position: absolute;
      left: auto;
      right: 0;
      bottom: calc(1.5rem + 0.4rem);
      margin: 0;
      padding: 0.45rem 0.6rem;
      width: max-content;
      max-width: 100%;
      box-sizing: border-box;
      background: rgba(17, 17, 17, 0.92);
      color: #fff;
      font-size: 0.8rem;
      line-height: 1.3;
      border-radius: 6px;
      white-space: normal;
      text-align: right;
    }
    .hero-credit-popover::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: 100%;
      height: 0.5rem;
    }
    .hero-credit-popover a {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .hero-credit.is-open .hero-credit-popover { display: block; }
    @media (hover: hover) and (pointer: fine) {
      .hero-credit:hover .hero-credit-popover,
      .hero-credit:focus-within .hero-credit-popover { display: block; }
    }
    .muted { color: var(--muted); }
    .error { color: var(--leo-red); }
    @media (max-width: 55.99rem) {
      .today-sidebar--desktop { display: none; }
      .today-itinerary--embedded {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        margin-top: 0.85rem;
        padding-top: 0.85rem;
        border-top: 1px solid var(--border);
      }
      .today-itinerary--embedded .today-itinerary-link.is-active .today-itinerary-period {
        color: inherit;
      }
      .today-itinerary--embedded .today-itinerary-link.is-active .today-itinerary-dot {
        background: var(--leo-gray);
        box-shadow: none;
      }
    }
    @media (min-width: 56rem) {
      .today-itinerary--embedded { display: none; }
      .today-layout {
        grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
        gap: 2.5rem;
      }
      .today-sidebar {
        position: sticky;
        top: calc(var(--leo-nav-offset, 56px) + 1rem);
      }
      .today-mobile-nudge { display: none; }
      .info-hstack {
        flex-wrap: nowrap;
        align-items: center;
      }
    }
  </style>
</head>
<body>
  ${renderSiteNav({ variant: "today", city })}
  <main>
    <header class="today-lede">
      <p class="today-eyebrow">${escapeHtml(eyebrow)}</p>
      <h1>What to Do<span class="today-lede-line2">in ${escapeHtml(cityName)} Today</span></h1>
      <p class="intro">${escapeHtml(intro)}</p>
    </header>
    ${renderDaySummaryBand(daySummary, periods)}
    ${body}
  </main>
  ${renderSiteClosing()}
  <script>
    (function () {
      function setOpen(credit, open) {
        credit.classList.toggle("is-open", open);
        const btn = credit.querySelector(".hero-credit-btn");
        if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
      }
      document.addEventListener("click", (e) => {
        const btn = e.target.closest(".hero-credit-btn");
        if (btn) {
          const credit = btn.closest(".hero-credit");
          if (!credit) return;
          e.preventDefault();
          setOpen(credit, !credit.classList.contains("is-open"));
          return;
        }
        document.querySelectorAll(".hero-credit.is-open").forEach((credit) => {
          if (!credit.contains(e.target)) setOpen(credit, false);
        });
      });

      const sidebarLinks = [...document.querySelectorAll(".today-itinerary--sidebar .today-itinerary-link")];
      const periodSections = [...document.querySelectorAll(".period[id]")];
      const desktopItineraryQuery = window.matchMedia("(min-width: 56rem)");
      let scrollspyObserver = null;

      function isDesktopItinerary() {
        return desktopItineraryQuery.matches;
      }

      function setActivePeriod(id) {
        sidebarLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("data-period") === id);
        });
      }

      function teardownScrollspy() {
        if (scrollspyObserver) {
          scrollspyObserver.disconnect();
          scrollspyObserver = null;
        }
        sidebarLinks.forEach((link) => link.classList.remove("is-active"));
      }

      function setupScrollspy() {
        teardownScrollspy();
        if (!isDesktopItinerary() || !sidebarLinks.length || !periodSections.length) return;

        if ("IntersectionObserver" in window) {
          scrollspyObserver = new IntersectionObserver(
            (entries) => {
              if (!isDesktopItinerary()) return;
              const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
              if (visible.length) setActivePeriod(visible[0].target.id);
            },
            {
              root: null,
              threshold: [0.2, 0.35, 0.5, 0.65],
              rootMargin: "-20% 0px -55% 0px",
            }
          );
          periodSections.forEach((section) => scrollspyObserver.observe(section));
          setActivePeriod(periodSections[0].id);
        }
      }

      sidebarLinks.forEach((link) => {
        link.addEventListener("click", () => {
          if (!isDesktopItinerary()) return;
          const id = link.getAttribute("data-period");
          if (id) setActivePeriod(id);
        });
      });

      setupScrollspy();
      if (typeof desktopItineraryQuery.addEventListener === "function") {
        desktopItineraryQuery.addEventListener("change", setupScrollspy);
      } else if (typeof desktopItineraryQuery.addListener === "function") {
        desktopItineraryQuery.addListener(setupScrollspy);
      }
    })();
  </script>
</body>
</html>`;
}

