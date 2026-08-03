import { buildHeroProxyPath } from "./images.js";

const CONDITION_SYMBOLS = {
  Clear: "☀️",
  "Partly Cloudy": "⛅",
  Cloudy: "☁️",
  Overcast: "☁️",
  Showery: "🌦️",
  Rainy: "🌧️",
  Stormy: "⛈️",
};

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

function renderHero(cityId, period, activity) {
  const proxyPath = buildHeroProxyPath(activity?.heroImage);
  if (proxyPath) {
    return `<img class="hero" src="${escapeHtml(proxyPath)}" alt="" loading="lazy">`;
  }
  return `<div class="hero hero-placeholder" aria-hidden="true"></div>`;
}

function renderPeriod(cityId, period) {
  const { condition, periodName } = parsePeriodLabel(period.label);
  const symbol = CONDITION_SYMBOLS[condition] ?? "🌤️";
  const tempRange = formatTempRange(period.tempMinC, period.tempMaxC);
  const titleParts = [symbol, tempRange, periodName].filter(Boolean);
  const activity = period.activity;
  const copy = activity ? buildActivityCopy(activity, period) : "";

  return `
    <section class="period">
      <h3 class="period-title">${escapeHtml(titleParts.join(" "))}</h3>
      ${renderHero(cityId, period, activity)}
      ${
        activity
          ? `<p class="activity-copy">${escapeHtml(copy)}</p>`
          : `<p class="activity-copy muted">No activity scheduled</p>`
      }
    </section>`;
}

function renderCityPanel(city, pack, error, isActive) {
  const cityId = city.webCityId;
  const hidden = isActive ? "" : ' hidden';

  if (error) {
    return `
      <section class="city-panel" data-city="${escapeHtml(cityId)}"${hidden}>
        <p class="error">Could not load plan for ${escapeHtml(city.name)}: ${escapeHtml(error)}</p>
      </section>`;
  }

  if (!pack) {
    return `
      <section class="city-panel" data-city="${escapeHtml(cityId)}"${hidden}>
        <p class="muted">No plan available for ${escapeHtml(city.name)} yet.</p>
      </section>`;
  }

  const periods = [...(pack.periods ?? [])].sort((a, b) => a.index - b.index);
  const periodHtml = periods.map((period) => renderPeriod(cityId, period)).join("");

  return `
    <section class="city-panel" data-city="${escapeHtml(cityId)}"${hidden}>
      <p class="meta">${escapeHtml(city.name)} · ${escapeHtml(pack.localDate ?? "")}</p>
      ${periodHtml}
    </section>`;
}

export function renderTodayPage(packResults) {
  const tabs = packResults
    .map(({ city }, i) => {
      const active = i === 0 ? " active" : "";
      return `<button type="button" class="tab${active}" data-city="${escapeHtml(city.webCityId)}">${escapeHtml(city.name)}</button>`;
    })
    .join("");

  const panels = packResults
    .map(({ city, pack, error }, i) => renderCityPanel(city, pack, error, i === 0))
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Today — Leo</title>
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
      font-size: 1.5rem;
      margin: 0 0 1rem;
    }
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.5rem;
    }
    .tab {
      border: 1px solid #ccc;
      background: #fff;
      padding: 0.4rem 0.9rem;
      border-radius: 999px;
      cursor: pointer;
      font: inherit;
    }
    .tab.active {
      background: #111;
      color: #fff;
      border-color: #111;
    }
    .meta {
      color: #666;
      font-size: 0.9rem;
      margin: 0 0 1rem;
    }
    .period {
      background: #fff;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .period-title {
      margin: 0 0 0.75rem;
      font-size: 1.1rem;
    }
    .hero {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      border-radius: 6px;
      display: block;
      margin-bottom: 0.75rem;
      background: #eee;
    }
    .hero-placeholder {
      min-height: 160px;
      background: linear-gradient(135deg, #ececec, #f7f7f7);
    }
    .activity-copy {
      margin: 0;
      color: #444;
    }
    .muted { color: #777; }
    .error { color: #a00; }
    [hidden] { display: none !important; }
  </style>
</head>
<body>
  <main>
    <h1>Today</h1>
    <nav class="tabs" aria-label="City">${tabs}</nav>
    ${panels}
  </main>
  <script>
    const tabs = document.querySelectorAll(".tab");
    const panels = document.querySelectorAll(".city-panel");
    function selectCity(city) {
      if (!city) return;
      let matched = false;
      tabs.forEach((t) => {
        const on = t.dataset.city === city;
        t.classList.toggle("active", on);
        if (on) matched = true;
      });
      if (!matched) return;
      panels.forEach((p) => { p.hidden = p.dataset.city !== city; });
    }
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => selectCity(tab.dataset.city));
    });
    const fromQuery = new URLSearchParams(location.search).get("city");
    if (fromQuery) selectCity(fromQuery);
  </script>
</body>
</html>`;
}
