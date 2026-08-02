import { publishedCities } from "../config/cities.js";
import { fetchAllPublishedPacks } from "./api.js";
import { isValidCfImageId, proxyHeroImage } from "./images.js";
import { renderHomePage } from "./render-home.js";
import { renderTodayPage } from "./render-today.js";

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, max-age=60",
};

function notFound(message = "Not found") {
  return new Response(message, { status: 404 });
}

async function handleHomePage(env) {
  const packResults = await fetchAllPublishedPacks(env);
  for (const result of packResults) {
    if (result.error) {
      console.error(`[SITE] home ${result.city.webCityId} pack error:`, result.error);
    }
  }
  return new Response(renderHomePage(packResults), { status: 200, headers: HTML_HEADERS });
}

async function handleTodayPage(env) {
  const packResults = await fetchAllPublishedPacks(env);
  const html = renderTodayPage(packResults);
  return new Response(html, { status: 200, headers: HTML_HEADERS });
}

async function handleImageProxy(env, imageId) {
  if (!isValidCfImageId(imageId)) return notFound();
  const proxied = await proxyHeroImage(env, imageId);
  return proxied ?? notFound();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }
      return handleHomePage(env);
    }

    if (pathname === "/today") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }
      try {
        return await handleTodayPage(env);
      } catch (err) {
        console.error("[SITE] today page error:", err?.message ?? err);
        return new Response("Failed to load today's plan", { status: 500 });
      }
    }

    const imgMatch = pathname.match(/^\/img\/([^/]+)$/);
    if (imgMatch) {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }
      return handleImageProxy(env, decodeURIComponent(imgMatch[1]));
    }

    if (pathname === "/health") {
      return Response.json({
        status: "ok",
        service: "leo-website-site",
        cities: publishedCities.map((c) => c.webCityId),
        timestamp: new Date().toISOString(),
      });
    }

    return env.ASSETS.fetch(request);
  },
};
