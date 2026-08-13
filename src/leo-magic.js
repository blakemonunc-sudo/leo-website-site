/** LeoMagic face paths from LeoSymbolSF / LeoSymbolSF.heart (Regular, SF Symbol local coords). */
const LEO_MAGIC_FACE_SMILE =
  "M33.907-8.345C36.905-7.759 39.545-7.006 47.923-8.216C54.453-9.159 59.622-9.797 65.647-13.285L65.646-13.285C67.743-14.649 69.65-12.116 68.594-10.556C67.965-9.627 59.759-2.759 51.73-1.229C43.011 0.432 32.656-4.072 31.631-5.034C30.818-5.797 30.495-9.042 33.912-8.343L33.907-8.345ZM49.278-23.034C52.357-23.868 53.134-19.727 50.066-18.963C39.988-16.453 33.534-23.479 38.46-36.031L38.455-36.033C42.542-50.042 44.923-52.25 47.906-68.178C48.55-71.616 52.077-70.1 52.021-68.211C51.296-43.758 44.262-32.408 43.202-29.257C40.693-21.801 48.588-22.936 49.277-23.035L49.277-23.034ZM49.275-23.033L49.275-23.033ZM29.6-45.365C29.107-45.659 24.628-50.713 22.165-50.332C18.683-49.794 15.805-44.924 8.893-44.747C6.716-44.691 5.664-48.475 8.824-48.844C8.824-48.844 9.712-49.019 10.567-49.713C15.225-53.491 16.358-60.227 25.179-56.939C29.221-55.433 33.06-47.839 33.109-46.957C33.261-44.204 30.471-44.845 29.6-45.366ZM62.44-45.365C62.968-45.659 67.768-50.713 70.408-50.332C74.14-49.794 77.224-44.924 84.631-44.747C86.964-44.691 88.091-48.475 84.705-48.844C84.705-48.844 83.753-49.019 82.837-49.713C77.845-53.491 76.631-60.227 67.178-56.939C62.847-55.433 58.732-47.839 58.68-46.957C58.517-44.204 61.507-44.845 62.44-45.366Z";

const LEO_MAGIC_FACE_HEART =
  "M33.907-8.345C36.905-7.759 39.545-7.006 47.923-8.216C54.453-9.159 59.622-9.797 65.647-13.285L65.646-13.285C67.743-14.649 69.65-12.116 68.594-10.556C67.965-9.627 59.759-2.759 51.73-1.229C43.011 0.432 32.656-4.072 31.631-5.034C30.818-5.797 30.495-9.042 33.912-8.343L33.907-8.345ZM49.278-23.034C52.357-23.868 53.134-19.727 50.066-18.963C39.988-16.453 33.534-23.479 38.46-36.031L38.455-36.033C42.542-50.042 44.923-52.25 47.906-68.178C48.55-71.616 52.077-70.1 52.021-68.211C51.296-43.758 44.262-32.408 43.202-29.257C40.693-21.801 48.588-22.936 49.277-23.035L49.277-23.034L49.278-23.034ZM21.744-37.38C21.923-37.38 22.127-37.473 22.29-37.566C29.236-42.189 34.244-47.405 34.244-52.724C34.244-56.982 31.288-60.056 27.336-60.056C25.022-60.056 22.776-58.693 21.744-56.569C20.713-58.692 18.465-60.056 16.152-60.056C12.201-60.056 9.244-56.982 9.244-52.724C9.244-47.405 14.236-42.19 21.198-37.566C21.345-37.473 21.567-37.38 21.744-37.38ZM71.178-37.38C71.357-37.38 71.561-37.473 71.724-37.566C78.67-42.189 83.678-47.405 83.678-52.724C83.678-56.982 80.722-60.056 76.77-60.056C74.456-60.056 72.21-58.693 71.178-56.569C70.147-58.692 67.899-60.056 65.586-60.056C61.635-60.056 58.678-56.982 58.678-52.724C58.678-47.405 63.67-42.19 70.632-37.566C70.779-37.473 71.001-37.38 71.178-37.38Z";

/** Original iOS stroke was 3; website uses 25% lighter. */
export const LEO_MAGIC_STROKE = 3 * 0.75;

const LEO_MAGIC_ASSET_VERSION = "leo-magic-1";

/** Map LeoMagic circle fill % to a one-word Conditions label. */
export function conditionsLabelFromLeoMagicPct(pct) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return "Poor";
  if (n >= 75) return "Excellent";
  if (n >= 60) return "Good";
  if (n >= 40) return "OK";
  return "Poor";
}

/** Tone key used for color styling (Excellent/Good share LeoGreen). */
export function leoMagicToneFromPct(pct) {
  const label = conditionsLabelFromLeoMagicPct(pct);
  if (label === "Excellent" || label === "Good") return "good";
  if (label === "OK") return "ok";
  return "poor";
}

export function clampLeoMagicPct(pct) {
  return Math.max(0, Math.min(100, Number(pct) || 0));
}

/**
 * Shared LeoMagic indicator markup for Today pages, homepage, etc.
 * Stroke is 25% lighter than iOS (2.25 vs 3). Color tone follows fill %:
 * Excellent/Good → LeoGreen, OK → LeoYellow, Poor → LeoRed.
 */
export function renderLeoMagicIndicator({
  id = null,
  pct = 0,
  size = 36,
  className = "leo-magic",
} = {}) {
  const clamped = clampLeoMagicPct(pct);
  const tone = leoMagicToneFromPct(clamped);
  const useHeart = clamped > 75;
  const stroke = LEO_MAGIC_STROKE;
  const ring = size - stroke;
  const r = ring / 2;
  const cx = size / 2;
  const cy = size / 2;
  const face = size * 0.55;
  const faceX = (size - face) / 2;
  const faceY = (size - face) / 2;
  const idAttr = id ? ` id="${id}"` : "";
  const progressId = id ? ` id="${id}-progress"` : "";
  const smileId = id ? ` id="${id}-smile"` : "";
  const heartId = id ? ` id="${id}-heart"` : "";

  return `<div class="${className}"${idAttr} data-pct="${clamped}" data-tone="${tone}" style="--leo-magic-size:${size}px" aria-hidden="true">
  <svg class="leo-magic-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle class="leo-magic-track" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke-width="${stroke}" />
    <circle class="leo-magic-progress"${progressId} cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke-width="${stroke}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" pathLength="100" stroke-dasharray="${clamped} 100" />
    <svg class="leo-magic-face" x="${faceX}" y="${faceY}" width="${face}" height="${face}" viewBox="0 -70.5 92.53 70.5" overflow="visible" preserveAspectRatio="xMidYMid meet">
      <path class="leo-magic-face-smile"${smileId} d="${LEO_MAGIC_FACE_SMILE}" fill="currentColor"${useHeart ? " hidden" : ""} />
      <path class="leo-magic-face-heart"${heartId} d="${LEO_MAGIC_FACE_HEART}" fill="currentColor"${useHeart ? "" : " hidden"} />
    </svg>
  </svg>
</div>`;
}

export function leoMagicAssetTags() {
  return `<link rel="stylesheet" href="/leo-magic/leo-magic.css?v=${LEO_MAGIC_ASSET_VERSION}">`;
}
