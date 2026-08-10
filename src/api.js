import { publishedCities } from "../config/cities.js";

export async function fetchTodayPack(env, webCityId) {
  const secret = env.LEO_WEBSITE_API_SECRET;
  if (!secret) {
    throw new Error("LEO_WEBSITE_API_SECRET must be configured");
  }
  if (!env.RUNTIME_API) {
    throw new Error("RUNTIME_API service binding must be configured");
  }

  const url = `https://runtime-api/v1/today-pack?city=${encodeURIComponent(webCityId)}`;
  const response = await env.RUNTIME_API.fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`today-pack ${webCityId}: ${response.status} ${body}`);
  }

  return response.json();
}

export async function fetchAllPublishedPacks(env) {
  const results = await Promise.all(
    publishedCities.map(async (city) => {
      try {
        const pack = await fetchTodayPack(env, city.webCityId);
        return { city, pack, error: null };
      } catch (err) {
        return { city, pack: null, error: err?.message ?? String(err) };
      }
    })
  );
  return results;
}

export async function fetchPublishedCityPack(env, webCityId) {
  const city = publishedCities.find((c) => c.webCityId === webCityId);
  if (!city) return null;
  try {
    const pack = await fetchTodayPack(env, city.webCityId);
    return { city, pack, error: null };
  } catch (err) {
    return { city, pack: null, error: err?.message ?? String(err) };
  }
}
