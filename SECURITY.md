# OurStory security

## Hosted site (jkrocks.github.io/ourstory)
- Served over HTTPS by GitHub Pages.
- Content-Security-Policy: the page can only load its own code, Google Fonts, YouTube thumbnails/embeds and your Supabase project. Injected third-party scripts are blocked.
- No secrets in the repo. The Supabase anon key is designed to be public; access is enforced by the database rules below.
- Without Supabase keys the site runs in preview mode: nothing leaves the visitor's browser.

## With Supabase (family logins)
- Sign-in: Google or email magic link. No passwords stored by the app.
- Row-level security on every table: only members of a family can read or change that family's album.
- Photos and videos live in a **private** bucket, one folder per family; files are served through signed links that expire after 7 days. Only image/video types, max 200 MB each.
- Invite codes: 10 random characters. Members cannot change them; only the owner can issue a new one (Settings → Invite family → New code), which kills the old code instantly.
- The owner can remove members; anyone can leave.

## Good habits
- Share the family code privately (WhatsApp/DM), not in public posts.
- Leave kids' full birthdates, school names and exact addresses out of stories.
- If a code leaks, press **New code**.
