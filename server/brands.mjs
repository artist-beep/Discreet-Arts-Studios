// Source the manufacturers' original artwork. Keep the portfolio usable offline.
const pages = {
  Hettich: "https://www.hettich.com/en-in/home",
  CenturyPly: "https://www.centuryply.com/",
  "Asian Paints": "https://www.asianpaints.com/",
};
const known = {
  CenturyPly: "https://www.centuryply.com/uploads/logo_6f13da0c06.png",
  "Asian Paints":
    "https://www.asianpaints.com/media_1c958864309c45699aabc2a96ceec44f7a9a6343d.avif?format=avif&optimize=medium&width=750",
};
let cache,
  expires = 0;
function attr(tag, key) {
  return (
    tag.match(new RegExp("\\s" + key + "=[\"']([^\"']*)[\"']", "i"))?.[1] ?? ""
  );
}
export function firstBrandImage(html, page) {
  const site = new URL(page);
  for (const tag of html.matchAll(/<img\b[^>]{0,6000}>/gi)) {
    const src = attr(tag[0], "src") || attr(tag[0], "data-src");
    if (
      !src ||
      !/logo|wordmark/i.test(
        [src, attr(tag[0], "alt"), attr(tag[0], "class")].join(" "),
      )
    )
      continue;
    let url;
    try {
      url = new URL(src.replaceAll("&amp;", "&"), site);
    } catch {
      continue;
    }
    const domain = site.hostname.replace(/^www\./, "");
    if (
      url.protocol === "https:" &&
      (url.hostname === domain || url.hostname.endsWith("." + domain)) &&
      /\.(?:png|svg|webp|avif|jpe?g)(?:$|\?)/i.test(url.pathname + url.search)
    )
      return url.href;
  }
  return "";
}
export async function brandImages() {
  if (cache && Date.now() < expires) return cache;
  const items = await Promise.all(
    Object.entries(pages).map(async ([name, page]) => {
      let url = known[name] || "";
      if (!url) {
        try {
          const response = await fetch(page, {
            signal: AbortSignal.timeout(4000),
            credentials: "omit",
            redirect: "follow",
          });
          if (response.ok) url = firstBrandImage(await response.text(), page);
        } catch {}
      }
      return { name, url };
    }),
  );
  cache = items.filter((x) => x.url);
  expires = Date.now() + 3600000;
  return cache;
}
