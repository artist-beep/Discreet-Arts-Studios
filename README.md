# Discrete Art Studio LLP

A local-first build of the studio portfolio. Six residential, hospitality and retail concept albums, a three-image hero, a studio profile, client-film previews, contact controls and a private enquiry dashboard. Project images and the two illustrative portraits were generated for this preview. The portraits are placeholders for approved client films. Fonts use the device’s serif and sans-serif families. The full website loads manufacturer marks from official vendor sources when available. The standalone offline preview omits the brand marquee. Hettich logo discovery and live brand rendering need verification on a networked preview. The site makes no claims that they depict customers.

## Open the website

**Visual preview** — Open the standalone HTML supplied alongside the project in a browser. It contains the gallery images and animations and works offline. Gallery likes are stored on the device. The consultation form in this edition downloads a draft. The full service below accepts and stores enquiries.

**Full local website on Mac** — Extract the complete project folder. Double-click `Start-Studio.command` on a Mac with Node 22.13 or newer installed. This opens the website in your browser and stores local enquiries under `.local/`. The package includes the production build, so npm installation is unnecessary for this mode. Close the opened terminal to stop the server. If port 4817 is occupied, run `PORT=4818 npm start` from the folder. For Windows/Linux use `npm start` and open the address it prints.

**Editable development build** — Use Node 22.13 or newer. Run `npm ci`, then `npm run dev`. Use `npm run check`, `npm test` and `npm run build` for validation.

## The owner dashboard

The private route is /admin. Until the confirmed owner email is available and a valid private link is issued, setup stays locked. With the local website running, an authorised operator on the same computer can set STUDIO_OWNER_EMAIL to the confirmed email and run `npm run admin:setup`. A private, expiring setup page opens in a browser. It never prints a token or password. Local recovery uses `npm run admin:recovery` with the same owner identity. These commands operate only on the local database and are unsuitable for remote production recovery.

The owner can review enquiries, mark follow-up status, export CSV, change a password and edit hero slides, gallery content, films, business contact details or the optional Pixel ID. Update the public contact numbers before enabling the call and WhatsApp destinations. Number strings require an international country code.

## Current boundary

The Node preview implements durable SQLite storage for enquiries, likes and CMS content. The Worker adapter and SQL migration are included for the later Cloudflare phase. No repository or Cloudflare resources have been created remotely. No enquiry goes to Grid, and no Meta ID is preloaded. The site's privacy text reflects the current deferred CRM state. The signed form display timestamp classifies suspicious timings without blocking valid form submissions. Public consent and withdrawal controls are present. The local build uses an optional pinned Framer Motion browser module on a connected website and built-in animation offline.

## Before production

Confirm the owner email, registered address, city, business contact details, approved project photography and client films. Confirm any brand asset permissions. Review the public terms and privacy copy. Connect the private GitHub repository and Cloudflare account, configure D1 and secrets, and test in Workers. Add and verify the Grid delivery queue, retries and company mapping using the separately provided integration brief. Verify the real Pixel in Meta Test Events if configured. Obtain approval for end-to-end preview QA and production deployment.

The automated local suite exercises enquiry validation and durable storage, exact anti-spam timing boundaries, immutable retry classification, authenticated CRM/CSV, shared gallery likes, CMS persistence, one-time setup, rate limits, password changes and local recovery. Production D1, Grid, real Meta events, a cloud preview and final owner-approved user QA belong to the deployment phase.
