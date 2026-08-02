import test from "node:test";
import assert from "node:assert/strict";
import {
  renderTodayPage,
  buildSightCopy,
  buildFoodDrinkCopy,
  buildSideQuestCopy,
  capitalizeSentenceStart,
} from "../src/render-today.js";
import {
  activityBandTitle,
  buildHeroPeriods,
  renderHomePage,
} from "../src/render-home.js";
import { parseCfImageRef, buildDeliveryUrl, buildHeroProxyPath, isValidCfImageId } from "../src/images.js";

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

test("renderTodayPage uses content-addressed same-origin image proxy URLs", () => {
  const imageId = "ce236d9a-9a78-43d7-0e65-31affc694c00";
  const html = renderTodayPage([
    {
      city: { webCityId: "tokyo", name: "Tokyo" },
      pack: {
        localDate: "2026-07-07",
        periods: [
          {
            index: 1,
            label: "Clear · Morning",
            tempMinC: 20,
            tempMaxC: 24,
            activity: {
              type: "sight",
              title: "Shinjuku Gyoen",
              intro: "Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens.",
              heroImage: `cfimg://${imageId}`,
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
              teaserAction: "try ramen, a noodle soup with a rich broth and topping",
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
              teaserLower: "ride the JR Yamanote Line to a random neighborhood",
              whyTeaser: "You'll be partly inside in hot weather.",
            },
          },
        ],
      },
      error: null,
    },
  ]);

  assert.match(html, new RegExp(`/img/${imageId}`));
  assert.doesNotMatch(html, /\/img\/tokyo\/1/);
  assert.doesNotMatch(html, /imagedelivery\.net/);
  assert.doesNotMatch(html, /cfimg:\/\//);
  assert.match(html, /68–75°F/);
  assert.match(html, /Unwind at Shinjuku Gyoen, a 144-acre campus of pristine gardens\./);
  assert.match(html, /You&#39;ll be outside in pleasant weather\./);
  assert.match(html, /For lunch try ramen, a noodle soup with a rich broth and topping\./);
  assert.match(html, /Afuri Lumine is open and nearby\./);
  assert.match(html, /Ride the JR Yamanote Line to a random neighborhood\. Shinjuku Station is closest\./);
  assert.match(html, /activity-copy/);
  assert.doesNotMatch(html, /activity-weather-fit/);
  assert.doesNotMatch(html, /activity-why-teaser/);
  assert.doesNotMatch(html, /Start at Shinjuku Gyoen/);
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
  assert.match(html, /band-description/);
  assert.match(html, /Unwind at Shinjuku Gyoen/);
  assert.match(html, /calling-card/);
  assert.match(html, /calling-card-title">Shinjuku Gyoen</);
  assert.match(html, /calling-card-title">Ramen</);
  assert.match(html, new RegExp(`/img/${imageId}`));
  assert.doesNotMatch(html, /hero-carousel/);
  assert.doesNotMatch(html, /hero-track/);
  assert.doesNotMatch(html, /hero-slide/);
  assert.doesNotMatch(html, /hero-drawer/);
  assert.doesNotMatch(html, /period-tile/);
  assert.doesNotMatch(html, /data-interval/);
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
});
