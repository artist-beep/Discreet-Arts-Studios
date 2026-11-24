# Discrete Art Studio LLP

## Production Source, GitHub & Cloudflare Workflow

This is the existing website implementation. Extend it in place unless the owner explicitly requests a rebuild. Treat the approved production website as an existing system once launched. The owner chose to build first and defer Grid and Cloudflare. Preserve the approval gates in the project brief.

| Item | Current state |
|---|---|
| Private GitHub repository | To be connected and confirmed by the owner |
| Intended production branch | main |
| Worker name in wrangler.jsonc | discrete-art-studio (proposed) |
| D1 database | Not provisioned. Expected binding DB. Schema under migrations/ |
| Production build | npm ci, npm run check, npm test, npm run build |
| Current preview | Local SQLite service, React/Vite/Tailwind front end. No public deployment |
| Free Cloudflare URL / custom domain | Unassigned |
| Grid | Deferred. The public enquiry endpoint saves locally. No external lead delivery |
| Tracking | No default Pixel ID. Owner configuration and visitor opt-in required |

Once connected, private GitHub main is the canonical editable source. Cloudflare is the canonical production deployment. Desktop/Website is a recoverable local working copy. Recover source from GitHub rather than from an old conversation or a deployed bundle. On a replacement computer, create the local directory and clone the correct private repository. Confirm the repository and remote, inspect git status, fetch and safely synchronize with origin/main. Preserve legitimate changes. Read the implementation before editing.

Use a short-lived topic branch where appropriate. Limit the diff to the requested change. Protect working features and production data. Run relevant tests, type checks, lint and production build. Review the diff, commit with a meaningful message and push the working branch. Use a Cloudflare branch preview for changes that need it, and verify that preview. Obtain owner approval before final interactive preview QA, a marked test lead and a temporary CMS edit. Merge the approved change to main only after preview QA and the owner's production decision. Verify deployment status and the actual live website.

For the initial connection complete the private-repository and Cloudflare test deployment before promoting this build. Use Workers with Static Assets and D1. Match the Worker name to wrangler.jsonc. Add version-controlled migrations, test locally and apply without destroying data. Configure the approved owner identity, production secret provisioning and account-verified private recovery at that stage. The local owner tool is only for local SQLite. Verify auth, rate limiting, password setup, recovery, secure cookies, local-to-remote migrations and compatibility in a real Worker preview before launch. Apply the deferred Grid delivery and retry queue as its own tested phase.

Never commit credentials, environment files, setup links, API secrets or SQLite files. Do not casually delete, replace or recreate GitHub repositories, Workers, D1 databases, leads, CMS, owner credentials, deployment configuration, domains or DNS. Inspect and protect the current state before touching DNS, email, auth, production records, analytics, billing or any live business process. Retain the user's approval gates for custom domains and billing. Update both AGENTS.md and CLAUDE.md together with verified non-secret repository, branch, Worker, database, migrations, deployment, URL and domain changes.
