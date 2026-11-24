# Discrete Art Studio LLP

A local-first build of the studio portfolio. Six residential, hospitality and retail concept albums, a three-image hero, Ongoing Works and Completed Works galleries, founder and partner profiles, a project enquiry form and a private enquiry dashboard. Project images are concept illustrations. The starting galleries illustrate both project stages. The supplied Discrete Arts logo defines the black, white and orange palette (#FF9934). Helvetica Neue and Baskerville use local system fallbacks. The full website loads manufacturer marks from official vendor sources when available. The standalone offline preview omits the brand marquee. Hettich logo discovery and live brand rendering need verification on a networked preview.

## Open the website

**Visual preview** — Open the standalone HTML supplied alongside the project in a browser. It contains the gallery images and animations and works offline. Gallery likes are stored on the device. The project enquiry form prepares an email addressed to the studio. The visitor reviews the details and presses Send in their mail app. The full local service saves submissions in the private dashboard.

**Full local website on Mac** — Extract the complete project folder. Double-click `Start-Studio.command` on a Mac with Node 22.13 or newer installed. This opens the website in your browser and stores local enquiries under `.local/`. The package includes the production build, so npm installation is unnecessary for this mode. Close the opened terminal to stop the server. If port 4817 is occupied, run `PORT=4818 npm start` from the folder. For Windows/Linux use `npm start` and open the address it prints.

**Editable development build** — Use Node 22.13 or newer. Run `npm ci`, then `npm run dev`. Use `npm run check`, `npm test` and `npm run build` for validation.

## Partners, locations and contacts

The Partners section introduces founder Srikanth Potekulla (name from the studio brief), Kokila and Krishnappa Sunitha. The partner bios use their public LLP appointment records. The Company Check records appointments in February 2023 and April 2024 respectively. Project credits are managed separately. Edit profiles under **Website content → Founder, partners and project credits**. Under **Project galleries**, choose a category, stage and credited partners. Assigned galleries appear under the relevant profile, in the Partners’ work browser and under their project stage. Visitors can switch between Residential and Commercial, select a project, then open its full gallery. Until there are individual project credits, the browser shows the existing concept galleries. Older galleries without a recorded stage start as Unassigned. The public contact form accepts client project enquiries.

The contact area lists Bangalore and Hyderabad. Bangalore uses the Rajajinagar studio address. Hyderabad opens a city-level map until its studio address is entered. Both locations and the social profile URLs can be edited in **Business details and tracking**. The public email and Bangalore address come from the studio contact page at https://discreteartstudios.in/contact. The Instagram and Facebook URLs are taken from the studio footer at https://www.diastudios.in/.

## The owner dashboard

The private route is /admin. Until the confirmed owner email is available and a valid private link is issued, setup stays locked. With the local website running, an authorised operator on the same computer can set STUDIO_OWNER_EMAIL to the confirmed email and run `npm run admin:setup`. A private, expiring setup page opens in a browser. It never prints a token or password. Local recovery uses `npm run admin:recovery` with the same owner identity. These commands operate only on the local database and are unsuitable for remote production recovery.

The owner can review enquiries, mark follow-up status, export CSV, change a password and edit hero slides, gallery content, project status, business contact details or the optional Pixel ID. Update the public contact numbers before enabling the call and WhatsApp destinations. Number strings require an international country code.

## Current boundary

The Node preview implements durable SQLite storage for enquiries, likes and CMS content. The Worker adapter and SQL migration are included for the later Cloudflare phase. No repository or Cloudflare resources have been created remotely. No enquiry goes to Grid, and no Meta ID is preloaded. The site's privacy text reflects the current deferred CRM state. The signed form display timestamp classifies suspicious timings without blocking valid form submissions. Public consent and withdrawal controls are present. The local build uses an optional pinned Framer Motion browser module on a connected website and built-in animation offline.

## Before production

Confirm the owner email, registered address, city, business contact details, approved project photography and project statuses. Confirm any brand asset permissions. Review the public terms and privacy copy. Connect the private GitHub repository and Cloudflare account, configure D1 and secrets, and test in Workers. Add and verify the Grid delivery queue, retries and company mapping using the separately provided integration brief. Verify the real Pixel in Meta Test Events if configured. Obtain approval for end-to-end preview QA and production deployment.

The automated local suite exercises enquiry validation and durable storage, exact anti-spam timing boundaries, immutable retry classification, authenticated CRM/CSV, shared gallery likes, CMS persistence, one-time setup, rate limits, password changes and local recovery. Production D1, Grid, real Meta events, a cloud preview and final owner-approved user QA belong to the deployment phase.
