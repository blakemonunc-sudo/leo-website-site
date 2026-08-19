import { publishedCities, cityTodayPath } from "../config/cities.js";
import { buildHeroProxyPath } from "./images.js";
import { leoMagicAssetTags, renderLeoMagicIndicator } from "./leo-magic.js";
import { navAssetTags, renderSiteNav } from "./render-nav.js";
import { renderSiteClosing, siteChromeAssetTags } from "./render-site-chrome.js";
import {
  buildActivityCopy,
  buildPeriodWeatherLine,
  CONDITION_SYMBOLS,
  formatAvgTemp,
  formatHeroPeriodName,
  parsePeriodLabel,
  periodHasActivity,
} from "./render-today.js";

const TYPE_TO_CALLING = {
  sight: "places",
  sideQuest: "games",
  foodDrink: "foodDrinks",
};

const FALLBACK_PERIODS = [
  {
    index: 1,
    label: "Clear · Morning",
    start: "09:00",
    tempMinC: 28,
    tempMaxC: 30,
    activity: {
      type: "sight",
      title: "Shinjuku Gyoen",
      vibeName: "Unwind",
      connector: "at",
      subtitle: "144-acre Garden",
      heroImage: "cfimg://ce236d9a-9a78-43d7-0e65-31affc694c00",
      intro: "Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens.",
      whyTeaser: "You'll be outside in pleasant weather.",
    },
  },
  {
    index: 2,
    label: "Clear · Lunch",
    start: "12:00",
    tempMinC: 30,
    tempMaxC: 32,
    activity: {
      type: "foodDrink",
      title: "Afuri Lumine",
      category: "Ramen",
      heroImage: "cfimg://517018d3-311e-4141-2eac-83d929b73100",
      teaserAction: "try ramen, a noodle soup with a rich broth and topping",
    },
  },
  {
    index: 3,
    label: "Clear · Afternoon",
    start: "13:00",
    tempMinC: 31,
    tempMaxC: 33,
    activity: {
      type: "sideQuest",
      title: "Shinjuku Station",
      challengeTitle: "Yamanote Line Roulette",
      generic: "Follow the Yamanote Line",
      teaser: "Follow the Yamanote Line",
      teaserLower: "follow the Yamanote Line",
      heroImage: "cfimg://229c659b-5a06-40bf-dd73-c9792da02500",
    },
  },
  {
    index: 4,
    label: "Clear · Evening",
    start: "16:00",
    tempMinC: 27,
    tempMaxC: 29,
    activity: {
      type: "sight",
      title: "Tocho Tower",
      vibeName: "Look out",
      connector: "from",
      subtitle: "Free Observation Deck",
      heroImage: "cfimg://ad7e88a8-43a4-4b03-a780-2781b97f3400",
      intro: "Look out from Tocho Tower, a free observation deck at City Hall.",
      whyTeaser: "You'll be partly outside in pleasant weather.",
    },
  },
  {
    index: 5,
    label: "Clear · Drinks",
    start: "21:00",
    tempMinC: 25,
    tempMaxC: 27,
    activity: {
      type: "foodDrink",
      title: "Kaiten Sushi Ginza Onodera Hon Ten",
      category: "Sushi",
      heroImage: "cfimg://2c46e4e7-2b23-443d-2bdf-8b08f8001900",
      teaserAction: "try sushi",
    },
  },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Band title (collapsed + expanded) by activity type. */
export function activityBandTitle(activity) {
  if (!activity) return "";

  if (activity.type === "sight") {
    return activity.title?.trim() || "";
  }

  if (activity.type === "sideQuest") {
    return "Side Quest!";
  }

  if (activity.type === "foodDrink") {
    return activity.category?.trim() || activity.title?.trim() || "";
  }

  return activity.title?.trim() ?? "";
}

/**
 * Normalize a Tokyo today-pack into hero period bands.
 */
export function buildHeroPeriods(pack) {
  const raw = [...(pack?.periods ?? [])].sort((a, b) => a.index - b.index);
  const source = raw.filter(periodHasActivity);
  const periods = raw.length ? source : FALLBACK_PERIODS;

  return periods.map((period, i) => {
    const { condition, periodName } = parsePeriodLabel(period.label);
    const activity = period.activity ?? {};
    const symbol = CONDITION_SYMBOLS[condition] ?? "🌤️";
    const name =
      formatHeroPeriodName(periodName, period.start) ||
      `Period ${period.index ?? i + 1}`;
    const avgTempLabel = formatAvgTemp(period.tempMinC, period.tempMaxC);
    const weatherLine = buildPeriodWeatherLine(period) || [symbol, avgTempLabel].filter(Boolean).join(" ");
    const title = activityBandTitle(activity) || name;
    const subtitle = [weatherLine, name].filter(Boolean).join(" | ");
    const metaLine = [title, subtitle].filter(Boolean).join(" · ");
    const imageSrc = buildHeroProxyPath(activity.heroImage) ?? "";
    const callingType = TYPE_TO_CALLING[activity.type] ?? "places";
    const description = activity.type ? buildActivityCopy(activity, period) : "";

    return {
      index: period.index ?? i + 1,
      periodName: name,
      symbol,
      avgTempLabel,
      weatherLine,
      metaLine,
      title,
      subtitle,
      description,
      imageSrc,
      callingType,
    };
  });
}

function renderPhoto(period, eager) {
  if (period.imageSrc) {
    return `<img class="band-photo-img" src="${escapeHtml(period.imageSrc)}" alt="" loading="${eager ? "eager" : "lazy"}">`;
  }
  return `<div class="band-photo-img phatch" aria-hidden="true"></div>`;
}

function renderBandMetaWeather(period) {
  return escapeHtml(period.subtitle || "");
}

function renderBandMeta(period) {
  return `
        <div class="band-meta">
          <p class="band-meta-period">${escapeHtml(period.title)}</p>
          <p class="band-meta-weather">${renderBandMetaWeather(period)}</p>
        </div>`;
}

function renderPeriodBand(period, i) {
  const subtitle = period.subtitle
    ? `<p class="calling-card-subtitle">${escapeHtml(period.subtitle)}</p>`
    : "";
  const description = period.description
    ? `<p class="band-description">${escapeHtml(period.description)}</p>`
    : `<p class="band-description band-description--empty"></p>`;
  const detailInner = period.description
    ? `<div class="band-detail-inner">${description}</div>`
    : "";

  return `
    <article
      class="hero-band hero-band--period"
      data-type="${escapeHtml(period.callingType)}"
      data-index="${i}"
      tabindex="0"
      aria-expanded="false"
      aria-label="${escapeHtml(period.metaLine)}"
    >
      <button type="button" class="band-toggle" aria-label="Expand period">
        <span class="band-toggle-icon" aria-hidden="true"></span>
      </button>
      <div class="band-inner">
        ${renderBandMeta(period)}
        <div class="band-frame">
          <div class="band-card-slot">
            <article class="calling-card" data-type="${escapeHtml(period.callingType)}">
              <div class="calling-card-media">${renderPhoto(period, i === 0)}</div>
              <div class="calling-card-band">
                <div class="calling-card-text">
                  <h2 class="calling-card-title">${escapeHtml(period.title)}</h2>
                  ${subtitle}
                </div>
              </div>
            </article>
          </div>
        </div>
        <div class="band-detail">
          ${detailInner}
        </div>
      </div>
    </article>`;
}

/**
 * Normalize homepage input to published-city pack results.
 * Accepts fetchAllPublishedPacks results, a legacy single pack, or null.
 */
function resolveCityPacks(input) {
  if (Array.isArray(input)) return input;
  return publishedCities.map((city) => ({
    city,
    pack: city.webCityId === "tokyo" ? input : null,
    error: null,
  }));
}

function renderCitySwitcher(cities, selectedId) {
  const buttons = cities
    .map((city) => {
      const selected = city.webCityId === selectedId;
      return `<button
          type="button"
          class="hero-city-btn${selected ? " is-selected" : ""}"
          data-city="${escapeHtml(city.webCityId)}"
          role="tab"
          aria-selected="${selected ? "true" : "false"}"
          aria-controls="hero-periods-${escapeHtml(city.webCityId)}"
          id="hero-city-${escapeHtml(city.webCityId)}"
        >${escapeHtml(city.name)}</button>`;
    })
    .join("");

  return `
    <div class="hero-city-switcher" role="tablist" aria-label="Today">
      <span class="hero-city-label" id="hero-city-label">Today:</span>
      <div class="hero-city-options">${buttons}</div>
    </div>`;
}

function renderCityPeriods(city, pack, isSelected) {
  const periods = buildHeroPeriods(pack);
  return `
    <div
      class="hero-periods"
      id="hero-periods-${escapeHtml(city.webCityId)}"
      data-city="${escapeHtml(city.webCityId)}"
      role="tabpanel"
      aria-labelledby="hero-city-${escapeHtml(city.webCityId)}"
      ${isSelected ? "" : "hidden"}
    >
      ${periods.map(renderPeriodBand).join("")}
    </div>`;
}

function renderHeroCtaBand(city) {
  const name = city?.name ?? "Tokyo";
  const id = city?.webCityId ?? "tokyo";
  return `
    <nav class="hero-cta-band" aria-label="Explore and customize">
      <a
        class="hero-cta-link"
        id="hero-explore"
        href="${cityTodayPath(id)}"
        data-city="${escapeHtml(id)}"
      >
        <span class="hero-cta-label">Explore <span id="hero-explore-city">${escapeHtml(name)}</span></span>
        <span class="hero-cta-arrow" aria-hidden="true">→</span>
      </a>
      <span class="hero-cta-divider" aria-hidden="true"></span>
      <span class="hero-cta-link hero-cta-link--inert" id="hero-customize" aria-disabled="true">
        <span class="hero-cta-label">Customize</span>
        <span class="hero-cta-arrow" aria-hidden="true">↗</span>
      </span>
    </nav>`;
}

/**
 * Marketing homepage (wireframe 2a).
 * Hero: intro band + city switcher + expandable period bands per published city.
 * Styles: /home/home.css · Interactivity: /home/home.js
 */
export function renderHomePage(packResults = null) {
  const results = resolveCityPacks(packResults);
  const defaultCityId = results[0]?.city?.webCityId ?? "tokyo";
  const defaultCity = results[0]?.city ?? { webCityId: "tokyo", name: "Tokyo" };
  const cities = results.map((r) => r.city);
  const periodsMarkup = results
    .map((r) => renderCityPeriods(r.city, r.pack, r.city.webCityId === defaultCityId))
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Leo — The Spontaneous Travel Guide</title>
  <link rel="stylesheet" href="/home/home.css?v=map-cluster-1">
  ${siteChromeAssetTags()}
  ${leoMagicAssetTags()}
  ${navAssetTags()}
</head>
<body>
  ${renderSiteNav({ variant: "home" })}

  <section class="hero" id="hero" aria-label="Today's day plan">
    <div class="hero-band hero-band--intro">
      <h1 class="hero-title">The Spontaneous<br>Travel Guide</h1>
      <p class="hero-sub">Unfollow your itinerary.<br>Follow the rhythms of your day.</p>
      <a class="app-store" href="#" aria-label="Download on the App Store">
        <span class="app-store-icon" aria-hidden="true"></span>
        <span class="app-store-text">
          <span class="app-store-eyebrow">Download on the</span>
          <span class="app-store-name">App Store</span>
        </span>
      </a>
    </div>

    ${renderCitySwitcher(cities, defaultCityId)}
    ${periodsMarkup}
    ${renderHeroCtaBand(defaultCity)}
  </section>

  <section class="feature feature--light" id="feature-01" data-animate="grid">
    <div class="feature-copy">
      <h2>Plenty to do.<br>No reservations.</h2>
      <p>Leo is built on an exclusive collection of activities. None of our activities require a reservation and most have no lines. No reservations means less stress.</p>
      <a class="btn-pill btn-pill--outline" href="#">Try Leo</a>
    </div>
    <div class="feature-media">
      <div class="map-scene" id="photo-grid" aria-hidden="true">
        <div class="map-surface"></div>
        <div class="map-pin" style="--pin-x: 16%; --pin-y: 30%; --pin-rot: -6deg;">
          <div class="map-pin-card phatch"></div>
          <span class="map-pin-dot"></span>
        </div>
        <div class="map-pin" style="--pin-x: 42%; --pin-y: 18%; --pin-rot: 4deg;">
          <div class="map-pin-card phatch"></div>
          <span class="map-pin-dot"></span>
        </div>
        <div class="map-pin" style="--pin-x: 72%; --pin-y: 22%; --pin-rot: -3deg;">
          <div class="map-pin-card phatch"></div>
          <span class="map-pin-dot"></span>
        </div>
        <div class="map-pin" style="--pin-x: 88%; --pin-y: 48%; --pin-rot: 5deg;">
          <div class="map-pin-card phatch"></div>
          <span class="map-pin-dot"></span>
        </div>
        <div class="map-pin" style="--pin-x: 28%; --pin-y: 58%; --pin-rot: -4deg;">
          <div class="map-pin-card phatch"></div>
          <span class="map-pin-dot"></span>
        </div>
        <div class="map-pin" style="--pin-x: 58%; --pin-y: 68%; --pin-rot: 3deg;">
          <div class="map-pin-card phatch"></div>
          <span class="map-pin-dot"></span>
        </div>
        <div class="map-pin" style="--pin-x: 78%; --pin-y: 78%; --pin-rot: -5deg;">
          <div class="map-pin-card phatch"></div>
          <span class="map-pin-dot"></span>
        </div>
      </div>
      <button type="button" class="feature-replay">Replay</button>
    </div>
  </section>

  <section class="feature feature--cream feature--reverse" id="feature-02" data-animate="match">
    <div class="feature-copy">
      <h2>Go when the<br>conditions are right.</h2>
      <p>Tell Leo when you want to leave and he shows you activities that match the moment. He considers weather, open hours, and distance. The more Leo's smiling, the better the match.</p>
      <a class="btn-pill btn-pill--outline" href="#">Try Leo</a>
    </div>
    <div class="feature-media">
      <div class="feature-visual match-visual">
        <div class="match-face-card">
          ${renderLeoMagicIndicator({ id: "match-smiley", pct: 0, size: 120, className: "leo-magic match-smiley" })}
        </div>
        <div class="match-card" id="match-card">
          <div class="match-header">
            <div class="match-title">Marché des Enfants Rouges</div>
            <div class="match-time">9:00 – 10:15</div>
          </div>
          <div class="match-bars">
            <div class="match-row">
              <span class="match-icon" aria-hidden="true">⏱️</span>
              <div class="match-track"><div class="match-fill" data-fill="100"></div></div>
            </div>
            <div class="match-row">
              <span class="match-icon" aria-hidden="true">🌤️</span>
              <div class="match-track"><div class="match-fill" data-fill="70"></div></div>
            </div>
            <div class="match-row">
              <span class="match-icon" aria-hidden="true">🚌</span>
              <div class="match-track"><div class="match-fill" data-fill="80"></div></div>
            </div>
          </div>
        </div>
      </div>
      <button type="button" class="feature-replay">Replay</button>
    </div>
  </section>

  <section class="feature feature--light" id="feature-03" data-animate="chips">
    <div class="feature-copy">
      <h2>One decision at a time.<br>No planning fatigue.</h2>
      <p>In travel, less is more fun. Plan your day one step at a time, not all at once. Choose from a few excellent options, not hundreds of mediocre options.</p>
      <a class="btn-pill btn-pill--outline" href="#">Try Leo</a>
    </div>
    <div class="feature-media">
      <div class="feature-visual">
        <div class="chip-builder" id="chip-builder" aria-hidden="true">
          <div class="chip-stack"></div>
          <div class="chip-stage"></div>
        </div>
      </div>
      <button type="button" class="feature-replay">Replay</button>
    </div>
  </section>

  <section class="feature feature--cream feature--reverse" id="feature-04" data-animate="map">
    <div class="feature-copy">
      <h2>Comprehensive guides.<br>No research needed.</h2>
      <p>You shouldn't need a PhD to find a lunch spot. Every activity includes helpful stats, a short background story, and recommendations for what to focus on. No research needed.</p>
      <a class="btn-pill btn-pill--outline" href="#">Try Leo</a>
    </div>
    <div class="feature-media">
      <div class="feature-visual">
        <div class="map-cluster" id="map-cluster">
          <div class="open-pill">Open til 7pm</div>
          <div class="map-card">
            <svg class="map-svg" viewBox="0 0 132 132" aria-hidden="true">
              <path id="map-path" class="map-path" d="M24,104 L24,54 L64,54 L64,74 L100,74" fill="none" stroke="#3269D9" stroke-width="2.2" stroke-dasharray="5 4" stroke-linecap="round"/>
              <g class="map-stop" data-stop="1"><circle cx="24" cy="104" r="7" fill="#3269D9" stroke="#fff" stroke-width="1.5"/><text x="24" y="104" text-anchor="middle" dy="3.2" font-size="8" fill="#fff">1</text></g>
              <g class="map-stop" data-stop="2"><circle cx="64" cy="54" r="7" fill="#3269D9" stroke="#fff" stroke-width="1.5"/><text x="64" y="54" text-anchor="middle" dy="3.2" font-size="8" fill="#fff">2</text></g>
              <g class="map-stop" data-stop="3"><circle cx="100" cy="74" r="7" fill="#3269D9" stroke="#fff" stroke-width="1.5"/><text x="100" y="74" text-anchor="middle" dy="3.2" font-size="8" fill="#fff">3</text></g>
            </svg>
          </div>
          <div class="activity-card">
            <div class="activity-card-photo phatch"></div>
            <div class="activity-card-stats"><span>Free</span><span>|</span><span>2.5h</span><span>|</span><span>Inside</span></div>
            <div class="activity-card-copy">A covered market with 30+ stalls…</div>
          </div>
        </div>
      </div>
      <button type="button" class="feature-replay">Replay</button>
    </div>
  </section>

  <section class="feature feature--light" id="feature-05">
    <div class="feature-copy">
      <h2>Human-curated.<br>No AI slop.</h2>
      <p>We're building a custom collection of activities from scratch. We visit every activity in person and write everything ourselves. If you see it in Leo, we think it's worth your time.</p>
      <a class="btn-pill btn-pill--outline" href="#">Try Leo</a>
    </div>
    <div class="feature-visual">
      <div class="curation-grid" aria-hidden="true">
        <div class="curation-cell curation-cell--tall phatch"></div>
        <div class="curation-cell phatch"></div>
        <div class="curation-cell phatch"></div>
      </div>
    </div>
  </section>

  <section class="cities" id="cities">
    <div class="cities-head">
      <h2>Where Leo Travels</h2>
    </div>
    <div class="cities-grid">
      <a class="city-card" href="${cityTodayPath("tokyo")}">
        <div class="city-card-photo phatch"></div>
        <div class="city-card-body">Tokyo →<span>340 activities</span></div>
      </a>
      <a class="city-card" href="${cityTodayPath("paris")}">
        <div class="city-card-photo phatch"></div>
        <div class="city-card-body">Paris →<span>280 activities</span></div>
      </a>
      <div class="city-card city-card--soon">
        <div class="city-card-photo phatch"></div>
        <div class="city-card-body">New York<span>Coming September 2026</span></div>
      </div>
      <div class="city-card city-card--soon">
        <div class="city-card-photo phatch"></div>
        <div class="city-card-body">Barcelona<span>Coming October 2026</span></div>
      </div>
    </div>
    <div class="cities-suggest">
      <p>Don't see your next trip?</p>
      <a class="btn-pill btn-pill--dark" href="#">Suggest a destination ↗</a>
    </div>
  </section>

  <section class="faq" id="faq">
    <h2>Questions? Answers.</h2>
    <div class="faq-list" id="faq-list">
      <details class="faq-item" open>
        <summary>Do I need to book anything?<span class="faq-icon" aria-hidden="true"></span></summary>
        <p>No. Every activity in Leo is walk-in. Show up when Leo says the moment is good.</p>
      </details>
      <details class="faq-item">
        <summary>Which cities does Leo cover?<span class="faq-icon" aria-hidden="true"></span></summary>
        <p>Tokyo and Paris are live today. New York arrives September 2026; Barcelona in October 2026.</p>
      </details>
      <details class="faq-item">
        <summary>How does Leo know the conditions?<span class="faq-icon" aria-hidden="true"></span></summary>
        <p>Leo watches weather, open hours, and how far you are from each activity, then ranks what fits the moment.</p>
      </details>
      <details class="faq-item">
        <summary>Who writes the activities?<span class="faq-icon" aria-hidden="true"></span></summary>
        <p>We do. Every activity is visited in person and written by Leo's team — no AI-generated guides.</p>
      </details>
      <details class="faq-item">
        <summary>Is Leo free? Android?<span class="faq-icon" aria-hidden="true"></span></summary>
        <p>Leo is free to try on iOS. Android is on the roadmap.</p>
      </details>
    </div>
  </section>

  ${renderSiteClosing()}

  <script src="/home/home.js?v=feature-replay-1" defer></script>
</body>
</html>`;
}
