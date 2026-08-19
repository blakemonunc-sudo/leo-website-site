import { allNavCities, cityTodayPath } from "../config/cities.js";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/leo-spontaneous-travel-guide/id6755015197";

const ABOUT_LINKS = [
  { label: "Our Story", href: "#" },
  { label: "Features", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Support", href: "#" },
  { label: "Privacy & Terms", href: "#" },
];

const NAV_ASSET_VERSION = "nav-9";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cityHref(city) {
  if (city.comingSoon) return "#";
  return cityTodayPath(city.webCityId);
}

function renderLogoMark() {
  return `<span class="leo-nav-logo" aria-hidden="true"></span>`;
}

function renderWordmark({ variant, city, compact = false, href = "/" }) {
  if (compact) {
    return `<a class="leo-nav-wordmark leo-nav-wordmark--compact" href="${escapeHtml(href)}">
      ${renderLogoMark()}
    </a>`;
  }

  if (variant === "today") {
    const name = escapeHtml(city?.name ?? "City");
    return `<div class="leo-nav-wordmark leo-nav-wordmark--today">
      <a class="leo-nav-wordmark-link" href="${escapeHtml(href)}">
        ${renderLogoMark()}
        <span class="leo-nav-wordmark-text">
          <span class="leo-nav-word-leo">Leo</span>
          <span class="leo-nav-word-rest">${name}</span>
        </span>
      </a>
      <button type="button" class="leo-nav-city-chevron" id="leo-nav-city-toggle" aria-label="Switch city" aria-expanded="false" aria-controls="leo-nav-city-menu"></button>
    </div>`;
  }

  return `<a class="leo-nav-wordmark" href="${escapeHtml(href)}">
    ${renderLogoMark()}
    <span class="leo-nav-wordmark-text">
      <span class="leo-nav-word-leo">Leo</span>
      <span class="leo-nav-word-rest">Travel</span>
    </span>
  </a>`;
}

function renderCityLinks(cities, { className = "leo-nav-city-links", id = "" } = {}) {
  const idAttr = id ? ` id="${escapeHtml(id)}"` : "";
  const links = cities
    .map(
      (city) =>
        `<a class="leo-nav-link" href="${escapeHtml(cityHref(city))}"${city.comingSoon ? ' data-coming-soon="true"' : ""}>${escapeHtml(city.name)}</a>`
    )
    .join("");
  return `<nav class="${escapeHtml(className)}"${idAttr} aria-label="Cities">${links}</nav>`;
}

function renderAboutDropdown() {
  const items = ABOUT_LINKS.map(
    (link) => `<a class="leo-nav-dropdown-link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`
  ).join("");
  return `<div class="leo-nav-about">
    <button type="button" class="leo-nav-link leo-nav-about-trigger" aria-expanded="false" aria-haspopup="true">About</button>
    <div class="leo-nav-dropdown" hidden>
      ${items}
    </div>
  </div>`;
}

function renderInlineLinks(cities) {
  return `<div class="leo-nav-inline-links">
    ${renderAboutDropdown()}
    ${renderCityLinks(cities, { className: "leo-nav-city-links leo-nav-city-links--inline" })}
  </div>`;
}

function renderCitySwitcher(cities, currentCityId) {
  const items = cities
    .map((city) => {
      const active = city.webCityId === currentCityId ? ' aria-current="page"' : "";
      return `<a class="leo-nav-city-switcher-link" href="${escapeHtml(cityHref(city))}"${active}${city.comingSoon ? ' data-coming-soon="true"' : ""}>${escapeHtml(city.name)}</a>`;
    })
    .join("");
  return `<div class="leo-nav-city-switcher" id="leo-nav-city-menu" hidden role="menu" aria-label="Leo cities">
    ${items}
  </div>`;
}

function renderHamburger() {
  return `<button type="button" class="leo-nav-icon-btn leo-nav-hamburger" data-leo-nav-open aria-label="Open menu" aria-expanded="false" aria-controls="leo-nav-menu">
    <span class="leo-nav-icon leo-nav-icon--menu" aria-hidden="true"></span>
  </button>`;
}

function renderMenu(cities) {
  const cityItems = cities
    .map(
      (city) =>
        `<a class="leo-nav-menu-link" href="${escapeHtml(cityHref(city))}"${city.comingSoon ? ' data-coming-soon="true"' : ""}>${escapeHtml(city.name)}</a>`
    )
    .join("");
  const aboutItems = ABOUT_LINKS.map(
    (link) => `<a class="leo-nav-menu-link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`
  ).join("");

  return `<div class="leo-nav-menu" id="leo-nav-menu" hidden>
    <div class="leo-nav-menu-backdrop" data-leo-nav-close></div>
    <div class="leo-nav-menu-panel" role="dialog" aria-modal="true" aria-label="Site menu">
      <div class="leo-nav-menu-header">
        <button type="button" class="leo-nav-menu-close" data-leo-nav-close aria-label="Close menu"></button>
      </div>
      <form class="leo-nav-menu-search" role="search" onsubmit="return false;">
        <label class="visually-hidden" for="leo-nav-search">Search</label>
        <input id="leo-nav-search" type="search" placeholder="Search" autocomplete="off" />
      </form>
      <div class="leo-nav-menu-groups">
        <a class="leo-nav-menu-link leo-nav-menu-link--cta" href="${escapeHtml(APP_STORE_URL)}" rel="noopener noreferrer">Get the App</a>
        <div class="leo-nav-menu-group">
          <p class="leo-nav-menu-heading">Cities</p>
          ${cityItems}
        </div>
        <div class="leo-nav-menu-group">
          <p class="leo-nav-menu-heading">About</p>
          ${aboutItems}
        </div>
      </div>
    </div>
  </div>`;
}

function renderPeriodLinks(periodLinks, { className = "leo-nav-period-links", id = "" } = {}) {
  if (!periodLinks?.length) return "";
  const idAttr = id ? ` id="${escapeHtml(id)}"` : "";
  const links = periodLinks
    .map(
      (period) =>
        `<a class="leo-nav-link" href="${escapeHtml(period.href)}">${escapeHtml(period.name)}</a>`
    )
    .join("");
  return `<nav class="${escapeHtml(className)}"${idAttr} aria-label="Day periods">${links}</nav>`;
}

/**
 * Shared site navigation for homepage and Today-in-City pages.
 * @param {{
 *   variant: "home" | "today",
 *   city?: { webCityId: string, name: string },
 *   cities?: Array,
 *   periodLinks?: Array<{ name: string, href: string }>,
 * }} opts
 */
export function renderSiteNav({
  variant = "home",
  city = null,
  cities = null,
  periodLinks = null,
} = {}) {
  const navCities = cities ?? allNavCities();
  const isToday = variant === "today";
  const wordmarkTop = renderWordmark({ variant, city, compact: false });
  const wordmarkCompact = renderWordmark({ variant, city, compact: true });
  const citySwitcher = isToday ? renderCitySwitcher(navCities, city?.webCityId) : "";

  let centerLinks = "";
  let mobileScrollLinks = "";

  if (!isToday) {
    const inlineLinks = renderInlineLinks(navCities);
    centerLinks = `<div class="leo-nav-center-links">${inlineLinks}</div>`;
    mobileScrollLinks = renderCityLinks(navCities, {
      className: "leo-nav-city-links leo-nav-city-links--scroll",
      id: "leo-nav-mobile-cities",
    });
  }

  return `
<header class="leo-nav" id="leo-nav" data-variant="${escapeHtml(variant)}">
  <div class="leo-nav-top">
    <div class="leo-nav-row leo-nav-row--top">
      <div class="leo-nav-brand-slot">
        ${wordmarkTop}
        ${citySwitcher}
      </div>
      ${isToday ? "" : centerLinks}
      ${renderHamburger()}
    </div>
  </div>
  <div class="leo-nav-scrolled">
    <div class="leo-nav-row leo-nav-row--scrolled">
      <div class="leo-nav-brand-slot leo-nav-brand-slot--scrolled">
        ${wordmarkCompact}
      </div>
      ${centerLinks}
      ${mobileScrollLinks}
      ${renderHamburger()}
    </div>
  </div>
</header>
<div class="leo-nav-sentinel" id="leo-nav-sentinel" aria-hidden="true"></div>
${renderMenu(navCities)}`;
}

export function navAssetTags() {
  return `<link rel="stylesheet" href="/nav/nav.css?v=${NAV_ASSET_VERSION}">
  <script src="/nav/nav.js?v=${NAV_ASSET_VERSION}" defer></script>`;
}
