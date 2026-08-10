import { publishedCities, cityTodayPath } from "../config/cities.js";
import { buildHeroProxyPath } from "./images.js";
import {
  buildActivityCopy,
  formatAvgTemp,
  formatHeroPeriodName,
  parsePeriodLabel,
} from "./render-today.js";

const CONDITION_SYMBOLS = {
  Clear: "☀️",
  "Partly Cloudy": "⛅",
  Cloudy: "☁️",
  Overcast: "☁️",
  Showery: "🌦️",
  Rainy: "🌧️",
  Stormy: "⛈️",
};

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

/** LeoMagic face paths from LeoSymbolSF / LeoSymbolSF.heart (Regular, SF Symbol local coords). */
const LEO_MAGIC_FACE_SMILE =
  "M33.907-8.345C36.905-7.759 39.545-7.006 47.923-8.216C54.453-9.159 59.622-9.797 65.647-13.285L65.646-13.285C67.743-14.649 69.65-12.116 68.594-10.556C67.965-9.627 59.759-2.759 51.73-1.229C43.011 0.432 32.656-4.072 31.631-5.034C30.818-5.797 30.495-9.042 33.912-8.343L33.907-8.345ZM49.278-23.034C52.357-23.868 53.134-19.727 50.066-18.963C39.988-16.453 33.534-23.479 38.46-36.031L38.455-36.033C42.542-50.042 44.923-52.25 47.906-68.178C48.55-71.616 52.077-70.1 52.021-68.211C51.296-43.758 44.262-32.408 43.202-29.257C40.693-21.801 48.588-22.936 49.277-23.035L49.277-23.034ZM49.275-23.033L49.275-23.033ZM29.6-45.365C29.107-45.659 24.628-50.713 22.165-50.332C18.683-49.794 15.805-44.924 8.893-44.747C6.716-44.691 5.664-48.475 8.824-48.844C8.824-48.844 9.712-49.019 10.567-49.713C15.225-53.491 16.358-60.227 25.179-56.939C29.221-55.433 33.06-47.839 33.109-46.957C33.261-44.204 30.471-44.845 29.6-45.366ZM62.44-45.365C62.968-45.659 67.768-50.713 70.408-50.332C74.14-49.794 77.224-44.924 84.631-44.747C86.964-44.691 88.091-48.475 84.705-48.844C84.705-48.844 83.753-49.019 82.837-49.713C77.845-53.491 76.631-60.227 67.178-56.939C62.847-55.433 58.732-47.839 58.68-46.957C58.517-44.204 61.507-44.845 62.44-45.366Z";

const LEO_MAGIC_FACE_HEART =
  "M33.907-8.345C36.905-7.759 39.545-7.006 47.923-8.216C54.453-9.159 59.622-9.797 65.647-13.285L65.646-13.285C67.743-14.649 69.65-12.116 68.594-10.556C67.965-9.627 59.759-2.759 51.73-1.229C43.011 0.432 32.656-4.072 31.631-5.034C30.818-5.797 30.495-9.042 33.912-8.343L33.907-8.345ZM49.278-23.034C52.357-23.868 53.134-19.727 50.066-18.963C39.988-16.453 33.534-23.479 38.46-36.031L38.455-36.033C42.542-50.042 44.923-52.25 47.906-68.178C48.55-71.616 52.077-70.1 52.021-68.211C51.296-43.758 44.262-32.408 43.202-29.257C40.693-21.801 48.588-22.936 49.277-23.035L49.277-23.034L49.278-23.034ZM21.744-37.38C21.923-37.38 22.127-37.473 22.29-37.566C29.236-42.189 34.244-47.405 34.244-52.724C34.244-56.982 31.288-60.056 27.336-60.056C25.022-60.056 22.776-58.693 21.744-56.569C20.713-58.692 18.465-60.056 16.152-60.056C12.201-60.056 9.244-56.982 9.244-52.724C9.244-47.405 14.236-42.19 21.198-37.566C21.345-37.473 21.567-37.38 21.744-37.38ZM71.178-37.38C71.357-37.38 71.561-37.473 71.724-37.566C78.67-42.189 83.678-47.405 83.678-52.724C83.678-56.982 80.722-60.056 76.77-60.056C74.456-60.056 72.21-58.693 71.178-56.569C70.147-58.692 67.899-60.056 65.586-60.056C61.635-60.056 58.678-56.982 58.678-52.724C58.678-47.405 63.67-42.19 70.632-37.566C70.779-37.473 71.001-37.38 71.178-37.38Z";

/**
 * AdvView LeoMagicIndicatorView proportions (buttonWidth = size):
 * - stroke = 3 (absolute; SwiftUI lineWidth: 3)
 * - ring path diameter = size - 3 (SwiftUI .frame(buttonWidth - 3))
 * - face = size * 0.55 (scaledToFit in square)
 * - progress rotated −90°, round line caps
 * - heart when fillPercentage > 0.75; else smile
 * AdvView uses buttonWidth 36 → stroke/size = 3/36, face/size = 0.55.
 */
function renderLeoMagicIndicator({
  id = null,
  pct = 0,
  size = 36,
  className = "leo-magic",
} = {}) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  const useHeart = clamped > 75;
  const stroke = 3;
  const ring = size - stroke;
  const r = ring / 2;
  const cx = size / 2;
  const cy = size / 2;
  const face = size * 0.55;
  const faceX = (size - face) / 2;
  const faceY = (size - face) / 2;
  const idAttr = id ? ` id="${id}"` : "";
  const progressId = id ? ` id="${id}-progress"` : "";
  const smileId = id ? ` id="${id}-smile"` : "";
  const heartId = id ? ` id="${id}-heart"` : "";

  return `<div class="${className}"${idAttr} data-pct="${clamped}" style="--leo-magic-size:${size}px" aria-hidden="true">
  <svg class="leo-magic-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle class="leo-magic-track" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke-width="${stroke}" />
    <circle class="leo-magic-progress"${progressId} cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke-width="${stroke}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" pathLength="100" stroke-dasharray="${clamped} 100" />
    <svg class="leo-magic-face" x="${faceX}" y="${faceY}" width="${face}" height="${face}" viewBox="0 -70.5 92.53 70.5" overflow="visible" preserveAspectRatio="xMidYMid meet">
      <path class="leo-magic-face-smile"${smileId} d="${LEO_MAGIC_FACE_SMILE}" fill="currentColor"${useHeart ? " hidden" : ""} />
      <path class="leo-magic-face-heart"${heartId} d="${LEO_MAGIC_FACE_HEART}" fill="currentColor"${useHeart ? "" : " hidden"} />
    </svg>
  </svg>
</div>`;
}

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
  const source = [...(pack?.periods ?? [])].sort((a, b) => a.index - b.index);
  const periods = source.length ? source : FALLBACK_PERIODS;

  return periods.map((period, i) => {
    const { condition, periodName } = parsePeriodLabel(period.label);
    const activity = period.activity ?? {};
    const symbol = CONDITION_SYMBOLS[condition] ?? "🌤️";
    const name =
      formatHeroPeriodName(periodName, period.start) ||
      `Period ${period.index ?? i + 1}`;
    const avgTempLabel = formatAvgTemp(period.tempMinC, period.tempMaxC);
    const weatherLine = [symbol, avgTempLabel].filter(Boolean).join(" ");
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
</head>
<body>
  <header class="site-nav" id="site-nav">
    <a class="brand" href="/">Leo <span aria-hidden="true">☺</span></a>
    <nav class="nav-links" aria-label="Primary">
      <a href="#feature-01">Features</a>
      <a href="${cityTodayPath(defaultCityId)}">Cities</a>
      <a class="btn-pill btn-pill--solid" href="#">Try for Free</a>
    </nav>
    <button type="button" class="nav-menu" id="nav-menu" aria-label="Open menu" aria-expanded="false">≡</button>
  </header>
  <div class="nav-drawer" id="nav-drawer" hidden>
    <a href="#feature-01">Features</a>
    <a href="${cityTodayPath(defaultCityId)}">Cities</a>
    <a class="btn-pill btn-pill--solid" href="#">Try for Free</a>
  </div>

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

  <section class="final-cta">
    <h2>Unplan your next trip, with Leo.</h2>
    <a class="app-store app-store--light" href="#" aria-label="Download on the App Store">
      <span class="app-store-icon" aria-hidden="true"></span>
      <span class="app-store-text">
        <span class="app-store-eyebrow">Download on the</span>
        <span class="app-store-name">App Store</span>
      </span>
    </a>
  </section>

  <footer class="site-footer">
    <div class="footer-brand">
      <div class="brand brand--footer">Leo <span aria-hidden="true">☺</span></div>
      <p>The spontaneous travel guide</p>
    </div>
    <div class="footer-cols">
      <div>
        <strong>Cities</strong>
        <a href="${cityTodayPath("tokyo")}">Tokyo</a>
        <a href="${cityTodayPath("paris")}">Paris</a>
        <span>New York (soon)</span>
      </div>
      <div>
        <strong>Company</strong>
        <a href="#">About</a>
        <a href="#">How we curate</a>
        <a href="#">Contact</a>
      </div>
      <div>
        <strong>Legal</strong>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
      </div>
      <div>
        <strong>Follow</strong>
        <a href="#">Instagram</a>
        <a href="#">X</a>
      </div>
    </div>
  </footer>

  <script src="/home/home.js?v=feature-replay-1" defer></script>
</body>
</html>`;
}
