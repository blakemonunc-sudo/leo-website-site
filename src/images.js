const CFIMG_PREFIX = "cfimg://";

/** Cloudflare Images IDs used by Leo packs (UUID form). */
const CF_IMAGE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseCfImageRef(heroImage) {
  if (!heroImage || typeof heroImage !== "string") return null;
  if (!heroImage.startsWith(CFIMG_PREFIX)) return null;
  const id = heroImage.slice(CFIMG_PREFIX.length).trim();
  return id || null;
}

export function isValidCfImageId(imageId) {
  return typeof imageId === "string" && CF_IMAGE_ID_PATTERN.test(imageId.trim());
}

/** Same-origin proxy path content-addressed by Cloudflare image id. */
export function buildHeroProxyPath(heroImage) {
  const imageId = parseCfImageRef(heroImage);
  if (!imageId || !isValidCfImageId(imageId)) return null;
  return `/img/${imageId}`;
}

export function buildDeliveryUrl(env, imageId) {
  const hash = env.CF_IMAGES_HASH;
  const variant = env.CF_IMAGES_VARIANT || "public";
  if (!hash || !imageId) return null;
  return `https://imagedelivery.net/${hash}/${imageId}/${variant}`;
}

export async function proxyHeroImage(env, heroImageOrId) {
  const imageId =
    parseCfImageRef(heroImageOrId) ?? (isValidCfImageId(heroImageOrId) ? heroImageOrId.trim() : null);
  const deliveryUrl = buildDeliveryUrl(env, imageId);
  if (!deliveryUrl) return null;

  const upstream = await fetch(deliveryUrl);
  if (!upstream.ok) return null;

  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=3600");
  headers.set("X-Robots-Tag", "noindex, noarchive");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
