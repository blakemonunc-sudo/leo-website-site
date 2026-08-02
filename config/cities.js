/** Published cities shown on the homepage / today page (hardcoded — no enumerable list endpoint). */
export const publishedCities = [
  { webCityId: "tokyo", name: "Tokyo" },
  { webCityId: "paris", name: "Paris" },
];

export function getPublishedCity(webCityId) {
  return publishedCities.find((c) => c.webCityId === webCityId) ?? null;
}
