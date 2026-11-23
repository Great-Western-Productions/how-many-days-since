// House ad for the Great Western Wrestling Alliance's GWA Day 2026 film
// (Kaneo WORKSHOP-128). The film runs on YouTube; the card shows a local
// still and loads the player only when a visitor asks for it, so the home
// page makes no YouTube request on load.

export const GWA_FILM_ID = 'LKhoHMmcpkc';
export const GWA_FILM_STILL = '/images/gwa/gwa-day-2026.jpg';
export const GWA_SITE = 'https://www.gwawrestling.com/';
export const GWA_PLACEMENT = 'home_house_ad';

/** gwawrestling.com, tagged so its Analytics files the visit under this site. */
export function gwaSiteUrl(): string {
  const url = new URL(GWA_SITE);
  url.searchParams.set('utm_source', 'howmanydayssince');
  url.searchParams.set('utm_medium', 'house_ad');
  url.searchParams.set('utm_campaign', 'gwa_day_2026');
  return url.toString();
}

/** The privacy-enhanced player, set to start as soon as it loads. */
export function gwaFilmEmbedUrl(): string {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${GWA_FILM_ID}`);
  url.searchParams.set('autoplay', '1');
  url.searchParams.set('rel', '0');
  return url.toString();
}
