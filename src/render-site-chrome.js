import { cityTodayPath } from "../config/cities.js";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/leo-spontaneous-travel-guide/id6755015197";

export const SITE_CHROME_ASSET_VERSION = "1";

export function siteChromeAssetTags() {
  return `<link rel="stylesheet" href="/site/site.css?v=${SITE_CHROME_ASSET_VERSION}">`;
}

export function renderFinalCta() {
  return `<section class="final-cta">
    <h2>Unplan your next trip, with Leo.</h2>
    <a class="app-store app-store--light" href="${APP_STORE_URL}" rel="noopener noreferrer" aria-label="Download on the App Store">
      <span class="app-store-icon" aria-hidden="true"></span>
      <span class="app-store-text">
        <span class="app-store-eyebrow">Download on the</span>
        <span class="app-store-name">App Store</span>
      </span>
    </a>
  </section>`;
}

export function renderSiteFooter() {
  return `<footer class="site-footer">
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
  </footer>`;
}

/** Homepage-style closing: final CTA + site footer. */
export function renderSiteClosing() {
  return `${renderFinalCta()}

  ${renderSiteFooter()}`;
}
