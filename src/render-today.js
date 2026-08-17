import { buildHeroProxyPath } from "./images.js";
import {
  conditionsLabelFromLeoMagicPct,
  leoMagicAssetTags,
  renderLeoMagicIndicator,
} from "./leo-magic.js";
import { navAssetTags, renderSiteNav } from "./render-nav.js";

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

/** Weather symbol + avg °F for homepage bands and Today period headers. */
export function buildPeriodWeatherLine(period) {
  const { condition } = parsePeriodLabel(period?.label);
  const hasCondition = Boolean(String(condition ?? "").trim());
  const avgTempLabel = formatAvgTemp(period?.tempMinC, period?.tempMaxC);
  if (!hasCondition && !avgTempLabel) return "";

  const symbol = CONDITION_SYMBOLS[condition] ?? "🌤️";
  return [symbol, avgTempLabel].filter(Boolean).join(" ");
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

function renderStats(activity) {
  if (activity?.type !== "foodDrink") return "";
  return `<ul class="stats"><li><a href="${escapeHtml(APP_STORE_URL)}" rel="noopener noreferrer">Download the app →</a></li></ul>`;
}

function renderAppPlug(activity) {
  if (activity?.type !== "sight" && activity?.type !== "sideQuest") return "";
  const plug = activity.appPlug?.trim() ?? "";
  const plugHtml = plug ? `<p class="app-plug-text">${escapeHtml(plug)}</p>` : "";
  return `<div class="app-plug">${plugHtml}<p class="app-plug-link"><a href="${escapeHtml(APP_STORE_URL)}" rel="noopener noreferrer">Download the app →</a></p></div>`;
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

export function currencyEmoji(currencySymbol) {
  if (currencySymbol === "¥") return "💴";
  if (currencySymbol === "€") return "💶";
  return "💵";
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

export function renderInfoSection(activity, { city, periodIndex } = {}) {
  if (!activity) return "";
  const rows = [];

  const priceRange = activity.priceRange?.trim();
  if (priceRange) {
    const emoji = currencyEmoji(resolveCurrencySymbol(activity, city));
    rows.push(
      `<div class="info-row"><span class="info-symbol" aria-hidden="true">${emoji}</span><span class="info-text">Price range: ${escapeHtml(priceRange)}</span></div>`
    );
  }

  const durationLabel = formatDurationHoursLabel(activity.durationHours);
  if (durationLabel) {
    rows.push(
      `<div class="info-row"><span class="info-symbol" aria-hidden="true">⏱️</span><span class="info-text">Duration: ${escapeHtml(durationLabel)}</span></div>`
    );
  }

  if (activity.type === "sight" || activity.type === "sideQuest") {
    const setting = activity.setting?.trim();
    if (setting) {
      rows.push(
        `<div class="info-row"><span class="info-symbol" aria-hidden="true">🏡</span><span class="info-text">Setting: ${escapeHtml(setting)}</span></div>`
      );
    }
  }

  const hasLeoMagicPct = Number.isFinite(Number(activity.leoMagicPct));
  if (hasLeoMagicPct) {
    const pct = Number(activity.leoMagicPct);
    const magicId = `leo-magic-${periodIndex ?? "x"}`;
    const symbol = renderLeoMagicIndicator({
      id: magicId,
      pct,
      size: 22,
      className: "leo-magic info-leo-magic",
    });
    const label = conditionsLabelFromLeoMagicPct(pct);
    rows.push(
      `<div class="info-row"><span class="info-symbol">${symbol}</span><span class="info-text">Conditions: ${escapeHtml(label)}</span></div>`
    );
  }

  if (!rows.length) return "";
  return `<div class="info-section"><hr class="info-divider">${rows.join('<hr class="info-divider">')}</div>`;
}

function renderHero(activity) {
  const proxyPath = buildHeroProxyPath(activity?.heroImage);
  const media = proxyPath
    ? `<img class="hero" src="${escapeHtml(proxyPath)}" alt="" loading="lazy">`
    : `<div class="hero hero-placeholder" aria-hidden="true"></div>`;

  const caption = activity?.imageCaption?.trim();
  if (!caption) {
    return `<div class="hero-frame">${media}</div>`;
  }

  const sourceUrl = normalizeWebsiteUrl(activity.imageSourceWebsite);
  const creditBody = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" rel="noopener noreferrer">${escapeHtml(caption)}</a>`
    : escapeHtml(caption);

  return `<div class="hero-frame">
      ${media}
      <div class="hero-credit">
        <button type="button" class="hero-credit-btn" aria-label="Image source" aria-expanded="false">
          <span class="hero-credit-icon" aria-hidden="true">i</span>
        </button>
        <p class="hero-credit-popover">${creditBody}</p>
      </div>
    </div>`;
}

function periodSectionId(period) {
  const index = Number.isFinite(Number(period?.index)) ? Number(period.index) : 0;
  return `period-${index}`;
}

function dayPeriodNavName(period) {
  return buildPeriodDayName(period);
}

function renderPeriodWeather(period) {
  const weatherLine = buildPeriodWeatherLine(period);
  if (!weatherLine) return "";
  return `<p class="band-meta-weather">${escapeHtml(weatherLine)}</p>`;
}

function renderPeriod(period, { city } = {}) {
  const activity = period.activity;
  if (!activity) return "";
  const sectionId = periodSectionId(period);
  const weather = renderPeriodWeather(period);

  const description = activityDescription(activity);

  return `
    <section class="period" id="${escapeHtml(sectionId)}">
      <hr class="period-divider">
      ${renderHero(activity)}
      ${weather}
      <h2 class="period-title">${escapeHtml(buildPeriodHeader(period, activity))}</h2>
      ${description ? `<p class="description">${escapeHtml(description)}</p>` : ""}
      ${renderStats(activity)}
      ${renderAppPlug(activity)}
      ${renderInfoSection(activity, { city, periodIndex: period.index })}
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
  const intro = `${cityName} changes by the hour. Leo recommends things to do in ${cityName} for every period of the day. Places are picked based on open hours, the weather, and distance. Updated daily.`;

  const periods = pack
    ? [...(pack.periods ?? [])].sort((a, b) => a.index - b.index).filter(periodHasActivity)
    : [];
  const periodLinks = periods.map((period) => ({
    name: dayPeriodNavName(period),
    href: `#${periodSectionId(period)}`,
  }));

  let body;
  if (error) {
    body = `<p class="error">Could not load plan for ${escapeHtml(cityName)}: ${escapeHtml(error)}</p>`;
  } else if (!pack) {
    body = `<p class="muted">No plan available for ${escapeHtml(cityName)} yet.</p>`;
  } else {
    body = periods.map((period) => renderPeriod(period, { city })).join("");
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — Leo</title>
  ${navAssetTags()}
  ${leoMagicAssetTags()}
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
      scroll-margin-top: calc(var(--leo-nav-offset, 56px) + 12px);
    }
    .period-divider {
      border: 0;
      border-top: 1px solid #ddd;
      margin: 0 0 1rem;
    }
    .band-meta-weather {
      margin: 0 0 0.25rem;
      font-size: 0.95rem;
      color: #666;
      letter-spacing: 0.01em;
      line-height: 1.15;
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
    .description {
      white-space: pre-line;
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
    .app-plug {
      margin: 0.75rem 0 1rem;
    }
    .app-plug-text {
      margin: 0 0 0.5rem;
      color: #333;
      white-space: pre-line;
    }
    .app-plug-link {
      margin: 0;
    }
    .app-plug-link a {
      color: #111;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .info-section {
      margin: 0.75rem 0 1rem;
    }
    .info-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin: 0;
      color: #333;
    }
    .info-symbol {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      font-size: 1.1rem;
      line-height: 1;
    }
    .info-text {
      flex: 1 1 auto;
      min-width: 0;
    }
    .info-divider {
      border: 0;
      border-top: 1px solid #ddd;
      margin: 0.65rem 0;
    }
    .hero-frame {
      position: relative;
      margin: 0 0 0.5rem;
    }
    .hero {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      display: block;
      margin: 0;
      background: #eee;
    }
    .hero-placeholder {
      min-height: 160px;
      background: linear-gradient(135deg, #ececec, #f7f7f7);
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
      border-radius: 999px;
      border: 0;
      background: rgba(0, 0, 0, 0.55);
      color: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    }
    .hero-credit-icon {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 0.85rem;
      font-style: italic;
      font-weight: 700;
      line-height: 1;
      transform: translateY(-0.5px);
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
    .hero-credit.is-open .hero-credit-popover {
      display: block;
    }
    @media (hover: hover) and (pointer: fine) {
      .hero-credit:hover .hero-credit-popover,
      .hero-credit:focus-within .hero-credit-popover {
        display: block;
      }
    }
    .muted { color: #777; }
    .error { color: #a00; }
  </style>
</head>
<body>
  ${renderSiteNav({ variant: "today", city, periodLinks })}
  <main>
    <h1>${escapeHtml(title)}</h1>
    ${updated ? `<p class="updated">${escapeHtml(updated)}</p>` : ""}
    <p class="intro">${escapeHtml(intro)}</p>
    ${body}
  </main>
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
    })();
  </script>
</body>
</html>`;
}

