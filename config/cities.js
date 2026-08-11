/** Published cities shown on the homepage / city today pages (hardcoded — no enumerable list endpoint). */
export const publishedCities = [
  { webCityId: "tokyo", name: "Tokyo", timezone: "Asia/Tokyo" },
  { webCityId: "paris", name: "Paris", timezone: "Europe/Paris" },
];

/** Coming-soon cities shown in nav / homepage (placeholder links until coming-soon pages exist). */
export const comingSoonCities = [
  { webCityId: "new-york", name: "New York", comingSoon: true },
  { webCityId: "barcelona", name: "Barcelona", comingSoon: true },
];

/** Published + coming soon, for nav link lists. */
export function allNavCities() {
  return [
    ...publishedCities.map((c) => ({ ...c, comingSoon: false })),
    ...comingSoonCities,
  ];
}

export function getPublishedCity(webCityId) {
  return publishedCities.find((c) => c.webCityId === webCityId) ?? null;
}

export function cityTodayPath(webCityId) {
  return `/what-to-do-in-${webCityId}-today`;
}

/** Match /what-to-do-in-{webCityId}-today and return webCityId, or null. */
export function parseCityTodayPath(pathname) {
  const match = String(pathname ?? "").match(/^\/what-to-do-in-([a-z0-9-]+)-today$/);
  if (!match) return null;
  return match[1];
}
