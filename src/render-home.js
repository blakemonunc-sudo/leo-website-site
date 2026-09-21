import { cityTodayPath } from "../config/cities.js";
import { buildHeroProxyPath } from "./images.js";
import { leoMagicAssetTags, renderLeoMagicIndicator } from "./leo-magic.js";
import { navAssetTags, renderSiteNav } from "./render-nav.js";
import { renderSiteClosing, siteChromeAssetTags } from "./render-site-chrome.js";

/** Homepage hero background (Cloudflare Images). */
const HOME_HERO_IMAGE = "cfimg://04c04a64-71f7-486d-b5c9-953b662b2600";

/**
 * Marketing homepage (wireframe 2a).
 * Hero: full-bleed intro at 2/3 viewport. Styles: /home/home.css · Interactivity: /home/home.js
 */
export function renderHomePage() {
  const heroSrc = buildHeroProxyPath(HOME_HERO_IMAGE);
  const heroMedia = heroSrc
    ? `<img class="hero-media" src="${heroSrc}" alt="" width="1920" height="1280" fetchpriority="high" decoding="async">`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Leo — The Spontaneous Travel Guide</title>
  <link rel="stylesheet" href="/home/home.css?v=hero-ratio-clamp-6">
  ${siteChromeAssetTags()}
  ${leoMagicAssetTags()}
  ${navAssetTags()}
</head>
<body>
  ${renderSiteNav({ variant: "home" })}

  <section class="hero" id="hero" aria-label="Leo">
    <div class="hero-stage">
      ${heroMedia}
      <div class="hero-scrim" aria-hidden="true"></div>
    </div>
    <div class="hero-band hero-band--intro">
      <h1 class="hero-title">Spontaneous<br>Travel Guide</h1>
      <p class="hero-sub">Unfollow your itinerary.<br>Follow the rhythms of your day.</p>
    </div>
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
