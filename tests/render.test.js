import test from "node:test";
import assert from "node:assert/strict";
import {
  renderTodayPage,
  renderCityTodayPage,
  buildSightCopy,
  buildFoodDrinkCopy,
  buildSideQuestCopy,
  buildSightDescriptionSentence,
  buildSideQuestDescriptionSentence,
  activityDescription,
  capitalizeSentenceStart,
  buildPeriodDayName,
  buildPeriodHeader,
  activityHeroTitle,
  formatHeroPeriodName,
  formatUpdatedAt,
  normalizeWebsiteUrl,
  APP_STORE_URL,
  buildPeriodWeatherLine,
  buildDaySummary,
  formatDurationHoursLabel,
  conditionsLabelFromLeoMagicPct,
  periodHasActivity,
  renderInfoSection,
  resolveGpCategoryDisplayName,
} from "../src/render-today.js";
import {
  activityBandTitle,
  buildHeroPeriods,
  renderHomePage,
} from "../src/render-home.js";
import { parseCfImageRef, buildDeliveryUrl, buildHeroProxyPath, isValidCfImageId } from "../src/images.js";
import { cityTodayPath, parseCityTodayPath } from "../config/cities.js";

test("buildDaySummary derives dominant condition and temp range", () => {
  const summary = buildDaySummary([
    {
      index: 1,
      label: "Clear · Morning",
      tempMinC: 20,
      tempMaxC: 24,
      activity: { type: "sight", title: "Park" },
    },
    {
      index: 2,
      label: "Clear · Lunch",
      tempMinC: 28,
      tempMaxC: 32,
      activity: { type: "foodDrink", title: "Cafe" },
    },
    {
      index: 3,
      label: "Cloudy · Afternoon",
      tempMinC: 24,
      tempMaxC: 26,
      activity: { type: "sideQuest", title: "Station" },
    },
  ]);

  assert.equal(summary.symbol, "☀️");
  assert.equal(summary.tempRange, "68–90°F");
  assert.match(summary.sentence, /Mostly clear today, from 68–90°F\./);
});

test("buildDaySummary returns empty values when no active periods", () => {
  const summary = buildDaySummary([
    { index: 1, label: "Clear · Morning" },
    { index: 2, label: "Clear · Lunch", activity: null },
  ]);
  assert.equal(summary.symbol, "");
  assert.equal(summary.tempRange, "");
  assert.equal(summary.sentence, "");
});

test("formatDurationHoursLabel matches website duration notation", () => {
  assert.equal(formatDurationHoursLabel(2), "2 hrs");
  assert.equal(formatDurationHoursLabel(1), "1 hr");
  assert.equal(formatDurationHoursLabel(1.5), "1.5 hrs");
  assert.equal(formatDurationHoursLabel(0.75), "45 min");
  assert.equal(formatDurationHoursLabel(0.5), "30 min");
  assert.equal(formatDurationHoursLabel(NaN), "");
});

test("resolveGpCategoryDisplayName reads minimized category and gp_categories shapes", () => {
  assert.equal(resolveGpCategoryDisplayName({ category: "Ramen" }), "Ramen");
  assert.equal(
    resolveGpCategoryDisplayName({ gp_categories: [{ name: "Sushi" }] }),
    "Sushi"
  );
  assert.equal(
    resolveGpCategoryDisplayName({ gp_categories: { name: "Pub" } }),
    "Pub"
  );
  assert.equal(resolveGpCategoryDisplayName({ category: "  " }), "");
  assert.equal(resolveGpCategoryDisplayName({}), "");
});

test("renderInfoSection appends gp category chip for foodDrink only", () => {
  const foodHtml = renderInfoSection({
    type: "foodDrink",
    priceRange: "¥¥",
    durationHours: 0.5,
    category: "Ramen",
  });
  assert.match(foodHtml, /info-hstack[\s\S]*?¥¥[\s\S]*?30 min[\s\S]*?Ramen/);
  assert.equal((foodHtml.match(/info-chip/g) ?? []).length, 3);

  const sightHtml = renderInfoSection({
    type: "sight",
    priceRange: "¥¥",
    durationHours: 2,
    setting: "Outside",
    category: "Ramen",
  });
  assert.match(sightHtml, /Outside/);
  assert.doesNotMatch(sightHtml, /Ramen/);

  const missingCategoryHtml = renderInfoSection({
    type: "foodDrink",
    priceRange: "¥¥",
    durationHours: 0.5,
  });
  assert.match(missingCategoryHtml, /¥¥[\s\S]*?30 min/);
  assert.doesNotMatch(missingCategoryHtml, /info-chip[\s\S]*Ramen/);
  assert.equal((missingCategoryHtml.match(/info-chip/g) ?? []).length, 2);
});

test("conditionsLabelFromLeoMagicPct maps fill bands", () => {
  assert.equal(conditionsLabelFromLeoMagicPct(100), "Excellent");
  assert.equal(conditionsLabelFromLeoMagicPct(75), "Excellent");
  assert.equal(conditionsLabelFromLeoMagicPct(74.99), "Good");
  assert.equal(conditionsLabelFromLeoMagicPct(60), "Good");
  assert.equal(conditionsLabelFromLeoMagicPct(59.99), "OK");
  assert.equal(conditionsLabelFromLeoMagicPct(40), "OK");
  assert.equal(conditionsLabelFromLeoMagicPct(39.99), "Poor");
  assert.equal(conditionsLabelFromLeoMagicPct(0), "Poor");
});

test("formatHeroPeriodName keeps DayPeriod names and special-cases Coffee", () => {
  assert.equal(formatHeroPeriodName("Morning", "09:00"), "Morning");
  assert.equal(formatHeroPeriodName("Lunch", "12:00"), "Lunch");
  assert.equal(formatHeroPeriodName("Coffee", "09:00"), "Morning Coffee");
  assert.equal(formatHeroPeriodName("Coffee", "11:59"), "Morning Coffee");
  assert.equal(formatHeroPeriodName("Coffee", "12:00"), "Afternoon Coffee");
  assert.equal(formatHeroPeriodName("Coffee", "15:00"), "Afternoon Coffee");
  assert.equal(formatHeroPeriodName("Coffee", null), "Coffee");
  assert.equal(formatHeroPeriodName("Coffee", "bad"), "Coffee");
});

test("cityTodayPath and parseCityTodayPath round-trip", () => {
  assert.equal(cityTodayPath("tokyo"), "/what-to-do-in-tokyo-today");
  assert.equal(parseCityTodayPath("/what-to-do-in-tokyo-today"), "tokyo");
  assert.equal(parseCityTodayPath("/what-to-do-in-paris-today"), "paris");
  assert.equal(parseCityTodayPath("/today"), null);
});

test("activityBandTitle formats by activity type", () => {
  assert.equal(
    activityBandTitle({
      type: "sight",
      title: "Shinjuku Gyoen",
      vibeName: "Unwind",
      connector: "at",
    }),
    "Shinjuku Gyoen"
  );
  assert.equal(
    activityBandTitle({
      type: "sideQuest",
      generic: "Follow the Yamanote Line",
      teaser: "Ride somewhere else",
      title: "Ueno Station",
    }),
    "Side Quest!"
  );
  assert.equal(
    activityBandTitle({
      type: "foodDrink",
      teaserAction: "try kaiseki, a traditional Japanese multi-course meal",
      category: "Kaiseki",
    }),
    "Kaiseki"
  );
});

test("capitalizeSentenceStart only uppercases first letter", () => {
  assert.equal(
    capitalizeSentenceStart("ride the JR Yamanote Line to a random neighborhood"),
    "Ride the JR Yamanote Line to a random neighborhood"
  );
  assert.equal(capitalizeSentenceStart("visit a Sri Lankan restaurant"), "Visit a Sri Lankan restaurant");
});

test("buildSightCopy uses pack intro and optional whyTeaser", () => {
  const activity = {
    intro: "Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens.",
    whyTeaser: "You'll be outside in pleasant weather.",
  };
  assert.equal(
    buildSightCopy(activity),
    "Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens. You'll be outside in pleasant weather."
  );
  assert.equal(
    buildSightCopy({ ...activity, whyTeaser: undefined }),
    "Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens."
  );
});

test("buildFoodDrinkCopy uses meal + teaserAction and fixed nearby closer", () => {
  const copy = buildFoodDrinkCopy(
    {
      type: "foodDrink",
      title: "Afuri Lumine",
      category: "Ramen",
      teaserAction: "try ramen, a noodle soup with a rich broth and topping",
    },
    { index: 2, label: "Clear · Lunch" }
  );
  assert.equal(
    copy,
    "For lunch try ramen, a noodle soup with a rich broth and topping. Afuri Lumine is open and nearby."
  );
});

test("buildSideQuestCopy prefers teaserLower and sentence-caps first letter", () => {
  const copy = buildSideQuestCopy({
    type: "sideQuest",
    title: "Shinjuku Station",
    teaser: "Ride the JR Yamanote Line to a random neighborhood",
    teaserLower: "ride the JR Yamanote Line to a random neighborhood",
    whyTeaser: "You'll be partly inside in hot weather.",
  });
  assert.equal(
    copy,
    "Ride the JR Yamanote Line to a random neighborhood. Shinjuku Station is closest."
  );
  assert.doesNotMatch(copy, /You'll be/);
});

test("buildSightDescriptionSentence matches AdventureView intro formula", () => {
  assert.equal(
    buildSightDescriptionSentence({
      vibeName: "Unwind",
      connector: "at",
      place: "Shinjuku Gyoen",
      teaserConnector: "a",
      teaser: "144-acre campus of pristine gardens",
    }),
    "Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens"
  );
  assert.equal(
    buildSightDescriptionSentence({
      vibeName: "Pass through",
      connector: "",
      place: "Tokyo Station",
      teaser: "the center of Tokyo’s train network",
    }),
    "Pass through Tokyo Station, the center of Tokyo’s train network"
  );
  assert.equal(
    buildSightDescriptionSentence({
      intro: "Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens.",
      whyGo: "Long why-go copy should not be used.",
    }),
    "Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens."
  );
});

test("buildSideQuestDescriptionSentence matches ChallengeTeaser", () => {
  assert.equal(
    buildSideQuestDescriptionSentence({
      teaser: "follow the Yamanote Line",
      whyGo: "Long why-go copy should not be used.",
    }),
    "Follow the Yamanote Line."
  );
  assert.equal(
    buildSideQuestDescriptionSentence({
      teaser: "Already capped.",
    }),
    "Already capped."
  );
});

test("activityDescription uses webDescription for sight and sideQuest", () => {
  assert.equal(
    activityDescription({
      type: "sight",
      webDescription: "Long-form sight copy for the web.",
      intro: "Unwind at Shinjuku Gyoen, a 144-acre campus.",
      whyGo: "Should not appear.",
    }),
    "Long-form sight copy for the web."
  );
  assert.equal(
    activityDescription({
      type: "sideQuest",
      webDescription: "Long-form side quest copy for the web.",
      teaser: "ride the JR Yamanote Line",
      whyGo: "Should not appear.",
    }),
    "Long-form side quest copy for the web."
  );
  assert.equal(
    activityDescription({
      type: "sight",
      intro: "Should not appear when webDescription is missing.",
    }),
    ""
  );
  assert.equal(
    activityDescription({
      type: "foodDrink",
      description: "Yuzu shio ramen near Shinjuku.",
    }),
    "Yuzu shio ramen near Shinjuku."
  );
});

test("buildPeriodHeader formats by activity type", () => {
  assert.equal(
    buildPeriodHeader(
      { label: "Clear · Morning" },
      { type: "sight", dayPeriodConnector: "at", place: "Shinjuku Gyoen" }
    ),
    "Morning at Shinjuku Gyoen"
  );
  assert.equal(
    buildPeriodHeader(
      { label: "Clear · Afternoon" },
      { type: "sideQuest", title: "Station", webTitle: "Ride the rails" }
    ),
    "Afternoon: Ride the rails"
  );
  assert.equal(
    buildPeriodHeader({ label: "Clear · Afternoon" }, { type: "sideQuest", title: "Station" }),
    "Afternoon Side Quest!"
  );
  assert.equal(
    buildPeriodHeader({ label: "Clear · Lunch" }, { type: "foodDrink", title: "Afuri Lumine" }),
    "Lunch at Afuri Lumine"
  );
});

test("activityHeroTitle returns activity name only for hero overlay", () => {
  assert.equal(
    activityHeroTitle({ type: "sight", place: "Shinjuku Gyoen", title: "Gyoen Park" }),
    "Shinjuku Gyoen"
  );
  assert.equal(activityHeroTitle({ type: "sight", title: "Louvre" }), "Louvre");
  assert.equal(activityHeroTitle({ type: "foodDrink", title: "Afuri Lumine" }), "Afuri Lumine");
  assert.equal(
    activityHeroTitle({ type: "sideQuest", title: "Station", webTitle: "Ride the rails" }),
    "Ride the rails"
  );
  assert.equal(activityHeroTitle({ type: "sideQuest", title: "Station" }), "Station");
  assert.equal(activityHeroTitle({ type: "sideQuest" }), "Side Quest!");
});

test("buildPeriodHeader special-cases Coffee by start hour", () => {
  assert.equal(
    buildPeriodHeader(
      { label: "Clear · Coffee", start: "09:00" },
      { type: "foodDrink", title: "Cafe Kitsune" }
    ),
    "Morning Coffee at Cafe Kitsune"
  );
  assert.equal(
    buildPeriodHeader(
      { label: "Clear · Coffee", start: "14:00" },
      { type: "foodDrink", title: "Blue Bottle" }
    ),
    "Afternoon Coffee at Blue Bottle"
  );
  assert.equal(
    buildPeriodHeader(
      { label: "Clear · Coffee", start: "10:00" },
      { type: "sight", dayPeriodConnector: "near", place: "Yoyogi Park" }
    ),
    "Morning Coffee near Yoyogi Park"
  );
  assert.equal(
    buildPeriodHeader({ label: "Clear · Coffee" }, { type: "sideQuest", title: "Station" }),
    "Coffee Side Quest!"
  );
});

test("buildPeriodDayName special-cases Coffee by start hour", () => {
  assert.equal(buildPeriodDayName({ label: "Clear · Coffee", start: "09:00" }), "Morning Coffee");
  assert.equal(buildPeriodDayName({ label: "Clear · Coffee", start: "14:00" }), "Afternoon Coffee");
  assert.equal(buildPeriodDayName({ label: "Clear · Coffee" }), "Coffee");
  assert.equal(buildPeriodDayName({ label: "Clear · Lunch" }), "Lunch");
});

test("formatUpdatedAt uses city timezone date only", () => {
  assert.equal(formatUpdatedAt("2026-07-07T15:30:00.000Z", "Asia/Tokyo"), "Jul 08, 2026");
  assert.equal(formatUpdatedAt("2026-08-10T15:00:00.000Z", "Asia/Tokyo"), "Aug 11, 2026");
});

test("normalizeWebsiteUrl adds https when missing", () => {
  assert.equal(normalizeWebsiteUrl("afuri.com"), "https://afuri.com");
  assert.equal(normalizeWebsiteUrl("https://afuri.com"), "https://afuri.com");
  assert.equal(normalizeWebsiteUrl("  "), null);
});

test("buildPeriodWeatherLine mirrors homepage symbol + avg temp", () => {
  assert.equal(
    buildPeriodWeatherLine({ label: "Clear · Morning", tempMinC: 20, tempMaxC: 24 }),
    "☀️ 72°F"
  );
  assert.equal(
    buildPeriodWeatherLine({ label: "Cloudy · Evening", tempMinC: 24, tempMaxC: 26 }),
    "☁️ 77°F"
  );
  assert.equal(buildPeriodWeatherLine({ label: "", tempMinC: null }), "");
  assert.equal(buildPeriodWeatherLine({}), "");
  assert.equal(buildPeriodWeatherLine({ label: "Clear · Morning" }), "☀️");
});

test("renderCityTodayPage uses new section layout and same-origin image proxy", () => {
  const imageId = "ce236d9a-9a78-43d7-0e65-31affc694c00";
  const html = renderCityTodayPage({
    city: { webCityId: "tokyo", name: "Tokyo", timezone: "Asia/Tokyo" },
    pack: {
      localDate: "2026-07-07",
      generatedAt: "2026-07-07T15:30:00.000Z",
      periods: [
        {
          index: 1,
          label: "Clear · Morning",
          tempMinC: 20,
          tempMaxC: 24,
          activity: {
            type: "sight",
            title: "Shinjuku Gyoen",
            place: "Shinjuku Gyoen",
            dayPeriodConnector: "at",
            vibeName: "Unwind",
            connector: "at",
            teaserConnector: "a",
            teaser: "144-acre campus of pristine gardens",
            intro: "Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens.",
            webDescription: "Shinjuku Gyoen is a 144-acre national garden in central Tokyo.",
            appPlug: "Open Leo for more sights nearby.",
            whyGo: "Stroll the lawns and glasshouse.",
            priceRange: "¥¥",
            currency: "¥",
            leoMagicPct: 82,
            conditionWeights: { openHours: 0.1, location: 0.9, weather: 0.5 },
            conditionSentences: {
              openHours: "Shinjuku Gyoen is open.",
              location: "Shinjuku Gyoen is nearby.",
              weather: "You'll be outside in pleasant weather.",
            },
            durationHours: 2,
            setting: "Mixed Inside & Outside",
            website: "https://www.env.go.jp/garden/shinjukugyoen/",
            latitude: 35.6852,
            longitude: 139.71,
            heroImage: `cfimg://${imageId}`,
            imageCaption: "Photo by Leo",
            imageSourceWebsite: "https://example.com/photo",
            whyTeaser: "You'll be outside in pleasant weather.",
          },
        },
        {
          index: 2,
          label: "Clear · Lunch",
          tempMinC: 28,
          tempMaxC: 28,
          activity: {
            type: "foodDrink",
            title: "Afuri Lumine",
            category: "Ramen",
            priceRange: "¥¥",
            durationHours: 0.5,
            description: "Yuzu shio ramen near Shinjuku.",
          },
        },
        {
          index: 3,
          label: "Clear · Afternoon",
          tempMinC: 30,
          tempMaxC: 30,
          activity: {
            type: "sideQuest",
            title: "Shinjuku Station",
            teaser: "Follow the Yamanote Line",
            webDescription: "Follow the loop and see the city shift with every stop.",
            appPlug: "Play this challenge and more in Leo.",
            webTitle: "Ride the Yamanote",
            durationHours: 1.5,
            setting: "Outside",
            whyGo: "Ride somewhere unexpected.",
            whyTeaser: "You'll be partly inside in hot weather.",
          },
        },
      ],
    },
    error: null,
  });

  assert.match(html, /What to Do<span class="today-lede-line2">in Tokyo Today<\/span>/);
  assert.match(html, /today-eyebrow">TOKYO · Jul 08, 2026</);
  assert.doesNotMatch(html, /today-accent/);
  assert.doesNotMatch(html, /class="updated"/);
  assert.match(html, /Tokyo changes by the hour/);
  assert.doesNotMatch(html, /today-app-band/);
  assert.doesNotMatch(html, /Download Leo for iOS/);
  assert.match(html, /today-day-summary/);
  assert.match(html, /Mostly clear today, from 68–86°F\./);
  assert.match(html, /today-layout/);
  assert.match(html, /today-sidebar--desktop/);
  assert.match(html, /Today&rsquo;s Itinerary/);
  assert.match(html, /today-itinerary--embedded/);
  assert.match(html, /id="today-itinerary-mobile"/);
  assert.match(html, /today-itinerary--sidebar/);
  assert.match(html, /id="today-itinerary"/);
  assert.match(html, /today-itinerary-link/);
  assert.match(html, /today-itinerary-period">Morning</);
  assert.match(html, /today-itinerary-activity">Shinjuku Gyoen</);
  assert.doesNotMatch(html, /band-meta-weather/);
  assert.match(html, /☀️ 72°F/);
  assert.match(html, /hero-badge--period[\s\S]*?hero-badge-period-name">Morning</);
  assert.match(html, /hero-badge-weather">☀️ 72°F</);
  assert.match(html, /hero-badge--period[\s\S]*?hero-badge-period-name">Morning[\s\S]*?hero-badge-weather">☀️ 72°F/);
  assert.match(html, /hero-title">Shinjuku Gyoen</);
  assert.match(html, /hero-title">Afuri Lumine</);
  assert.match(html, /hero-title">Ride the Yamanote</);
  assert.doesNotMatch(html, /class="period-title"/);
  assert.doesNotMatch(html, /Afternoon Side Quest!/);
  assert.doesNotMatch(html, /period-meta/);
  assert.doesNotMatch(html, /period-heading/);
  assert.doesNotMatch(html, /Why now:/);
  assert.doesNotMatch(html, /price-cost-debug/);
  assert.doesNotMatch(html, /costOfEntry/);
  assert.doesNotMatch(html, /Price range: —/);
  assert.match(html, /Shinjuku Gyoen is a 144-acre national garden in central Tokyo\./);
  assert.doesNotMatch(html, /Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens/);
  assert.doesNotMatch(html, /Stroll the lawns and glasshouse/);
  assert.match(html, /Open Leo for more sights nearby\./);
  assert.match(html, /period-directions[\s\S]*?Directions[\s\S]*?→/);
  assert.equal((html.match(/class="period-divider"/g) ?? []).length, 2);
  assert.match(
    html,
    /id="period-1"[\s\S]*?period-directions[\s\S]*?<hr class="period-divider">[\s\S]*?<\/section>/
  );
  assert.match(
    html,
    /id="period-2"[\s\S]*?period-directions[\s\S]*?<hr class="period-divider">[\s\S]*?<\/section>[\s\S]*?today-mobile-nudge/
  );
  assert.doesNotMatch(html, /id="period-3"[\s\S]*?period-divider/);
  assert.doesNotMatch(html, /period-action--download/);
  assert.doesNotMatch(html, /Download the app[\s\S]*?period-actions/);
  assert.match(html, new RegExp(APP_STORE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(html, /<button type="button" class="period-directions"/);
  assert.match(html, /today-mobile-nudge/);
  assert.match(html, /section class="final-cta"/);
  assert.match(html, /Unplan your next trip, with Leo/);
  assert.match(html, /footer class="site-footer"/);
  assert.match(html, /The spontaneous travel guide/);
  assert.match(html, /\/site\/site\.css/);
  assert.doesNotMatch(html, /today-bottom-cta/);
  assert.match(html, /IntersectionObserver/);
  assert.match(html, /today-itinerary-link\.is-active/);
  assert.doesNotMatch(html, /class="stats"/);
  assert.doesNotMatch(html, /app-plug-link/);
  assert.doesNotMatch(html, /Explore in the app/);
  assert.match(html, /today-mobile-nudge-copy">Get directions &amp; personalized plans in Leo</);
  assert.doesNotMatch(html, /Visit website/);
  assert.doesNotMatch(html, /maps\.google\.com/);
  assert.match(html, new RegExp(`/img/${imageId}`));
  assert.match(html, /Photo by Leo/);
  assert.match(html, /hero-credit-btn/);
  assert.match(html, /aria-label="Image source"/);
  assert.doesNotMatch(html, /image-caption/);
  assert.match(html, /example\.com\/photo/);
  assert.match(
    html,
    new RegExp(
      `/img/${imageId}[\\s\\S]*?hero-overlay[\\s\\S]*?hero-title[\\s\\S]*?description[\\s\\S]*?app-plug[\\s\\S]*?info-section[\\s\\S]*?period-directions`
    )
  );
  assert.match(
    html,
    /info-hstack[\s\S]*?¥¥[\s\S]*?2 hrs[\s\S]*?Mixed Inside &amp; Outside/
  );
  assert.match(
    html,
    /id="period-2"[\s\S]*?info-hstack[\s\S]*?¥¥[\s\S]*?30 min[\s\S]*?Ramen/
  );
  assert.doesNotMatch(html, /Price range:/);
  assert.doesNotMatch(html, /Duration:/);
  assert.doesNotMatch(html, /Setting:/);
  assert.doesNotMatch(html, /🏡/);
  assert.doesNotMatch(html, /info-conditions-hstack/);
  assert.doesNotMatch(html, /Conditions: Excellent/);
  assert.doesNotMatch(html, /info-conditions-placeholder/);
  assert.doesNotMatch(html, /info-section[\s\S]*?leo-magic/);
  assert.match(html, /☀️ 86°F[\s\S]*?Outside/);
  assert.match(html, /Yuzu shio ramen near Shinjuku\./);
  assert.match(html, /Follow the loop and see the city shift with every stop\./);
  assert.doesNotMatch(html, /Follow the Yamanote Line\./);
  assert.match(html, /Play this challenge and more in Leo\./);
  assert.doesNotMatch(html, /Ride somewhere unexpected/);
  assert.doesNotMatch(html, /activity-copy/);
  assert.doesNotMatch(html, /imagedelivery\.net/);
  assert.doesNotMatch(html, /cfimg:\/\//);
});

test("renderCityTodayPage omits conditions block from info section", () => {
  const html = renderCityTodayPage({
    city: { webCityId: "tokyo", name: "Tokyo", timezone: "Asia/Tokyo" },
    pack: {
      localDate: "2026-07-07",
      generatedAt: "2026-07-07T15:30:00.000Z",
      periods: [
        {
          index: 1,
          label: "Clear · Morning",
          tempMinC: 20,
          tempMaxC: 24,
          activity: {
            type: "sight",
            title: "Louvre",
            place: "Louvre",
            dayPeriodConnector: "at",
            connector: "at",
            teaserConnector: "a",
            teaser: "museum stop",
            intro: "Unwind at the Louvre, a famous museum.",
            webDescription: "The Louvre is a world-famous museum in Paris.",
            leoMagicPct: 60,
            conditionWeights: { openHours: 0.8, location: 0.3 },
            conditionSentences: {
              openHours: "Louvre is open.",
              location: "Louvre is nearby.",
              weather: "Louvre is outside in pleasant weather.",
            },
          },
        },
      ],
    },
    error: null,
  });

  assert.doesNotMatch(html, /info-conditions-hstack/);
  assert.doesNotMatch(html, /Conditions:/);
  assert.doesNotMatch(html, /info-conditions-placeholder/);
  assert.doesNotMatch(html, /Louvre is open\./);
});

test("renderCityTodayPage hides day periods with no activity", () => {
  const html = renderCityTodayPage({
    city: { webCityId: "paris", name: "Paris", timezone: "Europe/Paris" },
    pack: {
      localDate: "2026-08-17",
      generatedAt: "2026-08-17T19:40:52.979Z",
      periods: [
        {
          index: 1,
          label: "Overcast · Breakfast",
          activity: { type: "foodDrink", title: "Babka Zana" },
        },
        {
          index: 5,
          label: "Partly Cloudy · Night",
          tempMinC: 24.9,
          tempMaxC: 24.9,
        },
      ],
    },
    error: null,
  });

  assert.match(html, /hero-title">Babka Zana</);
  assert.match(html, /today-itinerary-period">Breakfast</);
  assert.match(html, /today-itinerary--embedded/);
  assert.match(html, /today-itinerary--sidebar/);
  assert.doesNotMatch(html, /leo-nav-period-links/);
  assert.doesNotMatch(html, /No activity scheduled/);
  assert.doesNotMatch(html, /id="period-5"/);
  assert.doesNotMatch(html, /href="#period-5"/);
  assert.doesNotMatch(html, /Night at /);
});

test("periodHasActivity is false when activity is missing", () => {
  assert.equal(periodHasActivity({ index: 5, label: "Night" }), false);
  assert.equal(periodHasActivity({ activity: { type: "sight", title: "Louvre" } }), true);
  assert.equal(periodHasActivity(null), false);
});

test("renderTodayPage delegates to city page for first pack result", () => {
  const html = renderTodayPage([
    {
      city: { webCityId: "tokyo", name: "Tokyo", timezone: "Asia/Tokyo" },
      pack: { localDate: "2026-07-07", periods: [] },
      error: null,
    },
  ]);
  assert.match(html, /What to Do<span class="today-lede-line2">in Tokyo Today<\/span>/);
});

test("buildHeroProxyPath is content-addressed by Cloudflare image id", () => {
  assert.equal(
    buildHeroProxyPath("cfimg://ad7e88a8-43a4-4b03-a780-2781b97f3400"),
    "/img/ad7e88a8-43a4-4b03-a780-2781b97f3400"
  );
  assert.equal(buildHeroProxyPath("cfimg://not-a-uuid"), null);
  assert.equal(isValidCfImageId("ad7e88a8-43a4-4b03-a780-2781b97f3400"), true);
});

test("buildDeliveryUrl keeps hash server-side", () => {
  const url = buildDeliveryUrl({ CF_IMAGES_HASH: "abc123", CF_IMAGES_VARIANT: "public" }, "img-id");
  assert.equal(url, "https://imagedelivery.net/abc123/img-id/public");
  assert.equal(parseCfImageRef("cfimg://img-id"), "img-id");
});

test("buildHeroPeriods maps Tokyo pack into period bands with avg temp + description", () => {
  const imageId = "ce236d9a-9a78-43d7-0e65-31affc694c00";
  const periods = buildHeroPeriods({
    periods: [
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
          heroImage: `cfimg://${imageId}`,
          teaserAction: "try ramen, a noodle soup with a rich broth and topping",
        },
      },
      {
        index: 1,
        label: "Clear · Morning",
        start: "09:00",
        tempMinC: 28,
        tempMaxC: 30,
        activity: {
          type: "sight",
          title: "Shinjuku Gyoen",
          subtitle: "144-acre Garden",
          heroImage: `cfimg://${imageId}`,
          intro: "Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens.",
          whyTeaser: "You'll be outside in pleasant weather.",
        },
      },
      {
        index: 3,
        label: "Cloudy · Afternoon",
        start: "13:00",
        tempMinC: 24,
        tempMaxC: 26,
        activity: {
          type: "sideQuest",
          title: "Shinjuku Station",
          challengeTitle: "Yamanote Line Roulette",
          generic: "Follow the Yamanote Line",
          teaser: "Ride the JR Yamanote Line to a random neighborhood",
          teaserLower: "ride the JR Yamanote Line to a random neighborhood",
        },
      },
    ],
  });

  assert.equal(periods.length, 3);
  assert.equal(periods[0].periodName, "Morning");
  assert.equal(periods[0].title, "Shinjuku Gyoen");
  assert.equal(periods[0].subtitle, "☀️ 84°F | Morning");
  assert.equal(periods[0].callingType, "places");
  assert.equal(periods[0].imageSrc, `/img/${imageId}`);
  assert.equal(periods[0].symbol, "☀️");
  assert.equal(periods[0].avgTempLabel, "84°F");
  assert.equal(periods[0].weatherLine, "☀️ 84°F");
  assert.equal(periods[0].metaLine, "Shinjuku Gyoen · ☀️ 84°F | Morning");
  assert.match(periods[0].description, /Unwind at Shinjuku Gyoen/);

  assert.equal(periods[1].periodName, "Lunch");
  assert.equal(periods[1].title, "Ramen");
  assert.equal(periods[1].subtitle, "☀️ 88°F | Lunch");
  assert.equal(periods[1].callingType, "foodDrinks");
  assert.equal(periods[1].avgTempLabel, "88°F");
  assert.equal(periods[1].weatherLine, "☀️ 88°F");
  assert.equal(periods[1].metaLine, "Ramen · ☀️ 88°F | Lunch");
  assert.match(periods[1].description, /For lunch try ramen/);

  assert.equal(periods[2].periodName, "Afternoon");
  assert.equal(periods[2].title, "Side Quest!");
  assert.equal(periods[2].subtitle, "☁️ 77°F | Afternoon");
  assert.equal(periods[2].callingType, "games");
  assert.equal(periods[2].avgTempLabel, "77°F");
  assert.equal(periods[2].weatherLine, "☁️ 77°F");
  assert.equal(periods[2].metaLine, "Side Quest! · ☁️ 77°F | Afternoon");
  assert.match(periods[2].description, /Follow the Yamanote Line|Ride the JR Yamanote Line/);
});

test("buildHeroPeriods special-cases Coffee by start hour", () => {
  const periods = buildHeroPeriods({
    periods: [
      {
        index: 1,
        label: "Clear · Coffee",
        start: "10:00",
        tempMinC: 20,
        tempMaxC: 22,
        activity: { type: "foodDrink", title: "Cafe", category: "Cafe" },
      },
      {
        index: 2,
        label: "Clear · Coffee",
        start: "14:00",
        tempMinC: 24,
        tempMaxC: 26,
        activity: { type: "foodDrink", title: "Cafe", category: "Cafe" },
      },
    ],
  });

  assert.equal(periods[0].periodName, "Morning Coffee");
  assert.equal(periods[0].subtitle, "☀️ 70°F | Morning Coffee");
  assert.equal(periods[1].periodName, "Afternoon Coffee");
  assert.equal(periods[1].subtitle, "☀️ 77°F | Afternoon Coffee");
});

test("buildHeroPeriods omits day periods with no activity", () => {
  const periods = buildHeroPeriods({
    periods: [
      {
        index: 1,
        label: "Clear · Morning",
        start: "09:00",
        tempMinC: 20,
        tempMaxC: 22,
        activity: { type: "sight", title: "Shinjuku Gyoen", intro: "Unwind at Shinjuku Gyoen." },
      },
      {
        index: 5,
        label: "Partly Cloudy · Night",
        start: "21:00",
        tempMinC: 24,
        tempMaxC: 25,
      },
    ],
  });
  assert.equal(periods.length, 1);
  assert.equal(periods[0].title, "Shinjuku Gyoen");
  assert.doesNotMatch(periods.map((p) => p.periodName).join(" "), /Night/);
});

test("buildHeroPeriods falls back when pack has no periods", () => {
  const periods = buildHeroPeriods(null);
  assert.ok(periods.length >= 4);
  assert.equal(periods[0].title, "Shinjuku Gyoen");
  assert.equal(periods[0].subtitle, "☀️ 84°F | Morning");
  assert.match(periods[0].imageSrc, /^\/img\//);
  assert.match(periods[0].metaLine, /Morning/);
  assert.ok(periods[0].avgTempLabel.endsWith("°F"));
});

test("renderHomePage uses expandable period bands, not carousel", () => {
  const imageId = "ce236d9a-9a78-43d7-0e65-31affc694c00";
  const html = renderHomePage({
    periods: [
      {
        index: 1,
        label: "Clear · Morning",
        start: "09:00",
        tempMinC: 28,
        tempMaxC: 30,
        activity: {
          type: "sight",
          title: "Shinjuku Gyoen",
          subtitle: "144-acre Garden",
          heroImage: `cfimg://${imageId}`,
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
          heroImage: `cfimg://${imageId}`,
          teaserAction: "try ramen",
        },
      },
    ],
  });

  assert.match(html, /hero-band--intro/);
  assert.match(html, /hero-band--period/);
  assert.match(html, /hero-periods/);
  assert.match(html, /data-type="places"/);
  assert.match(html, /data-type="foodDrinks"/);
  assert.match(html, /band-meta/);
  assert.match(html, /band-meta-period/);
  assert.match(html, /band-meta-weather/);
  assert.match(html, /band-toggle/);
  assert.match(html, /band-inner/);
  assert.match(html, /band-meta-period">Shinjuku Gyoen</);
  assert.match(html, /band-meta-weather">☀️ 84°F \| Morning</);
  assert.match(html, /band-meta-period">Ramen</);
  assert.match(html, /band-meta-weather">☀️ 88°F \| Lunch</);
  assert.doesNotMatch(html, /time-meridiem/);
  assert.match(html, /band-description/);
  assert.match(html, /Unwind at Shinjuku Gyoen/);
  assert.match(html, /calling-card/);
  assert.match(html, /calling-card-title">Shinjuku Gyoen</);
  assert.match(html, /calling-card-title">Ramen</);
  assert.match(html, new RegExp(`/img/${imageId}`));
  assert.match(html, /\/what-to-do-in-tokyo-today/);
  assert.doesNotMatch(html, /hero-carousel/);
  assert.doesNotMatch(html, /hero-track/);
  assert.doesNotMatch(html, /hero-slide/);
  assert.doesNotMatch(html, /hero-drawer/);
  assert.doesNotMatch(html, /period-tile/);
  assert.doesNotMatch(html, /data-interval/);
  assert.doesNotMatch(html, /href="\/today"/);
});

test("renderHomePage includes city switcher for published cities", () => {
  const html = renderHomePage([
    {
      city: { webCityId: "tokyo", name: "Tokyo" },
      pack: {
        periods: [
          {
            index: 1,
            label: "Clear · Morning",
            tempMinC: 28,
            tempMaxC: 30,
            activity: {
              type: "sight",
              title: "Shinjuku Gyoen",
              vibeName: "Unwind",
              connector: "at",
              subtitle: "144-acre Garden",
              intro: "Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens.",
            },
          },
        ],
      },
      error: null,
    },
    {
      city: { webCityId: "paris", name: "Paris" },
      pack: {
        periods: [
          {
            index: 1,
            label: "Cloudy · Morning",
            tempMinC: 18,
            tempMaxC: 20,
            activity: {
              type: "sight",
              title: "Jardin du Luxembourg",
              vibeName: "Stroll",
              connector: "through",
              subtitle: "Formal Gardens",
              intro: "Stroll through Jardin du Luxembourg, formal gardens.",
            },
          },
        ],
      },
      error: null,
    },
  ]);

  assert.match(html, /hero-city-label">Today:</);
  assert.match(html, /hero-city-switcher/);
  assert.match(html, /hero-city-btn/);
  assert.match(html, /data-city="tokyo"/);
  assert.match(html, /data-city="paris"/);
  assert.doesNotMatch(html, /data-city="nyc"/);
  assert.match(html, /aria-selected="true"[^>]*>Tokyo</);
  assert.match(html, /hero-periods"[^>]*data-city="tokyo"/);
  assert.match(html, /Shinjuku Gyoen/);
  assert.match(html, /Jardin du Luxembourg/);
  assert.match(html, /id="hero-periods-paris"[^>]*hidden/);
  assert.match(html, /\/what-to-do-in-tokyo-today/);
  assert.match(html, /\/what-to-do-in-paris-today/);
});
