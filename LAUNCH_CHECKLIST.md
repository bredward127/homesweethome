# Launch Checklist

Everything that must be true before Home Sweet Home takes real homeowner
traffic. Nothing here is optional, and several items need a person outside the
engineering team.

Legend: **[Blocker]** must be done before any public traffic · **[Required]**
must be done before launch · **[Verify]** confirm rather than build.

---

## 1. Legal and compliance

- [ ] **[Blocker]** Have counsel review and replace the **Privacy Policy**
      (`/privacy`). The current text is an unreviewed draft and says so on the
      page.
- [ ] **[Blocker]** Have counsel review and replace the **Terms of Use**
      (`/terms`).
- [ ] **[Blocker]** Have counsel review and replace the **Disclosures**
      (`/disclosures`), especially the "how we make money" and "what we do not
      promise" sections.
- [ ] **[Blocker]** **TCPA / SMS compliance review** before a single text is
      sent. Confirm the SMS consent language, that SMS consent is captured
      separately from general contact consent, that STOP/HELP handling works,
      and that consent records are retained appropriately.
- [ ] **[Blocker]** Confirm no marketing copy anywhere claims a guaranteed
      offer, guaranteed closing, guaranteed price or timeline, or foreclosure
      prevention. Re-check after every copy change.
- [ ] **[Required]** Confirm the business-identity disclosure is accurate for
      the actual entity, and that the entity name, state registration, and any
      required licensing language are correct.
- [ ] **[Required]** Fair-housing review of all public copy and of the scoring
      model. Confirm no protected characteristic is collected, stored, or
      scored, and no proxy for one has crept in.
- [ ] **[Required]** Confirm the contract module's internal legal-counsel banner
      is displayed and that no legal templates have been added.
- [ ] **[Required]** Decide and document the **data-retention period**, then put
      it in the Privacy Policy.
- [ ] **[Required]** Confirm the **data export / delete request** workflow has a
      real owner and a real response path, not just a placeholder.

## 2. Content and brand

- [ ] **[Blocker]** Replace all placeholder **contact details** in
      `src/config/site.ts` — phone, email, mailing address, hours. The current
      values are fictional.
- [ ] **[Blocker]** Replace or remove the **demo testimonials** in
      `src/config/content.ts`. They are labelled "Demo content" in the UI; real
      testimonials need documented permission from the person quoted.
- [ ] **[Required]** Replace `ImagePlaceholder` slots with real, licensed
      photography. Confirm every non-decorative image has meaningful `alt` text.
- [ ] **[Required]** Confirm the **service-area list** matches where the
      business will actually operate, including ZIP codes (they drive scoring).
- [ ] **[Required]** Proofread all public copy for tone, accuracy, and typos.
- [ ] **[Required]** Add a favicon, an Open Graph image, and an apple-touch icon.

## 3. Supabase and data

- [ ] **[Blocker]** **Disable self-service sign-ups** in Supabase
      (Authentication → Providers).
- [ ] **[Blocker]** **Verify RLS is enabled on every table** in the production
      project, not just in the migration files:
      ```sql
      select tablename, rowsecurity from pg_tables
      where schemaname = 'public' and rowsecurity = false;
      ```
      This must return **zero rows**.
- [ ] **[Verify]** Run `npm run test:rls` and confirm all assertions pass. It
      applies every migration to a throwaway Postgres and checks the policy
      behaviour, including that a closing specialist cannot reach another
      specialist's lead and that audit and consent records cannot be forged or
      rewritten.
- [ ] **[Blocker]** Review **Database → Advisors** in Supabase and resolve every
      security finding.
- [ ] **[Blocker]** Confirm the `anon` role cannot read any internal table.
      Test with a raw REST call using the anon key against `leads`, `profiles`,
      `contracts`, and `documents` — each must be denied.
- [ ] **[Blocker]** Confirm all document storage buckets are **private**, and
      that a signed URL is required for every download.
- [ ] **[Required]** Bootstrap the first admin deliberately (see README), then
      confirm that a role-less account lands on `/forbidden`.
- [ ] **[Required]** **Role-by-role access review**: sign in as each of the five
      roles and confirm what is visible matches the intended matrix. Confirm a
      closing specialist cannot read another specialist's leads by changing the
      URL.
- [ ] **[Required]** Confirm `audit_logs` cannot be inserted into, updated, or
      deleted by any authenticated role.
- [ ] **[Required]** Enable **point-in-time recovery** / automated backups, and
      test a restore at least once.
- [ ] **[Verify]** Regenerate `database.types.ts` from the production schema and
      confirm the build still passes.

## 4. Environment and secrets

- [ ] **[Blocker]** Set every production environment variable in Vercel. Mark
      `SUPABASE_SERVICE_ROLE_KEY` **sensitive** and scope it to server
      environments only.
- [ ] **[Blocker]** Confirm **no secret appears in the client bundle**:
      ```bash
      npm run build
      grep -rEl "service_role|SERVICE_ROLE|TWILIO_AUTH|RESEND_API|FAL_KEY" .next/static/ || echo "clean"
      ```
      Must print `clean`.
- [ ] **[Blocker]** Confirm `NEXT_PUBLIC_APP_URL` is the real production origin
      in production and the preview origin in preview. A wrong value sends
      password-reset links to the wrong host.
- [ ] **[Required]** Confirm `.env.local` and any real credentials are not
      committed: `git log --all -p | grep -i "service_role"` should find nothing.
- [ ] **[Required]** Rotate any credential that has ever been pasted into a
      chat, ticket, or shared document.
- [ ] **[Required]** Restrict `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` by HTTP referrer
      if address autocomplete is enabled.

## 5. Analytics

- [ ] **[Required]** Create the GA4 property and set
      `NEXT_PUBLIC_GA_MEASUREMENT_ID` in production only — leave it blank in
      preview.
- [ ] **[Required]** **Verify in GA4 DebugView** that every funnel event fires:
      `funnel_started`, `funnel_step_viewed`, `funnel_step_completed`,
      `lead_contact_details_started`, `lead_submitted`, `booking_widget_viewed`,
      `booking_started`, `booking_completed`, `request_call_clicked`,
      `thank_you_viewed`.
- [ ] **[Blocker]** **Confirm no PII reaches GA4.** Complete a real test
      submission with the browser network tab open and inspect every
      `google-analytics.com` request payload. No name, email, phone, street
      address, ZIP, financial figure, or lead score may appear.
- [ ] **[Required]** Decide whether `lead_tier` may be sent, per the agreed
      privacy policy. It is off unless explicitly approved.
- [ ] **[Required]** Enable Vercel Analytics and Speed Insights in the dashboard.
- [ ] **[Verify]** `npm test` passes, including the analytics PII-filter tests.

## 6. Integrations

- [ ] **[Required]** Configure the **booking provider** (`CALENDLY_URL`) and
      complete a real end-to-end booking. The URL must be `https`; the app
      falls back to in-app requests otherwise.
- [ ] **[Required]** Replace the **demo appointment slots** with real
      availability, or configure a booking provider so they are not used.
- [ ] **[Required]** Confirm the **fallback** path works with the booking
      provider removed — an appointment-request task must be created in the CRM.
- [ ] **[Required]** Configure **email** (`RESEND_API_KEY`,
      `EMAIL_FROM_ADDRESS`), verify the sending domain, and set up SPF, DKIM,
      and DMARC.
- [ ] **[Required]** Configure **SMS** only after the TCPA review signs off.
- [ ] **[Verify]** With `FAL_KEY` absent, confirm media generation shows a clean
      disabled state and nothing breaks.
- [ ] **[Verify]** Confirm no Google Drive connection is active — documents must
      remain in private Supabase Storage.

## 7. Application verification

- [ ] **[Blocker]** **Submit a real test lead** end to end: complete the funnel,
      confirm the lead appears in the CRM with the correct score, tier, reason
      breakdown, UTM attribution, and consent timestamps.
- [ ] **[Blocker]** **Confirm internal routes are unreachable when signed out.**
      Request `/app/dashboard`, `/app/leads`, and `/app/settings` in a private
      window — each must redirect to `/login`, never render content.
- [ ] **[Required]** Confirm `/robots.txt` disallows internal routes and that
      the sitemap lists public pages only.
- [ ] **[Required]** Confirm internal pages return
      `X-Robots-Tag: noindex` and `Cache-Control: no-store`:
      ```bash
      curl -sI https://<domain>/app/dashboard | grep -iE "x-robots-tag|cache-control"
      ```
- [ ] **[Blocker]** **Replace the in-process rate limiter.**
      `src/lib/security/rate-limit.ts` keeps counters in memory, which does not
      hold across serverless instances. Swap it for a shared store (Upstash
      Redis, Vercel KV, or a Postgres table with a TTL) before taking real
      traffic.
- [ ] **[Required]** Test the **honeypot and rate limiting** on the public lead
      endpoint. Confirm rapid repeat submissions are throttled and that a
      submission with the honeypot filled is rejected.
- [ ] **[Required]** Add a dedicated `LEAD_TOKEN_SECRET` rather than reusing
      `SUPABASE_SERVICE_ROLE_KEY` to sign capability tokens, so rotating one
      does not silently invalidate the other.
- [ ] **[Verify]** Run `npm run test:e2e` against a production-like build and
      confirm all checks pass, including that no lead score or tier reaches the
      browser.
- [ ] **[Required]** Confirm the **funnel draft is cleared** after submission
      and that no seller answers remain in `localStorage`.
- [ ] **[Required]** Review **consent records** after a test submission:
      confirm separate `contact` and `sms` rows, the correct policy version,
      the exact consent wording, and a hashed (not raw) IP.
- [ ] **[Required]** Test **password reset** end to end on the production
      domain.
- [ ] **[Required]** Confirm **session expiry** behaves: an expired session must
      be redirected to sign-in, not shown stale data.
- [ ] **[Required]** Confirm a deactivated user (`is_active = false`) is denied
      immediately.

## 8. Accessibility and quality

- [ ] **[Required]** Keyboard-only pass through the whole funnel and the CRM.
      Every control reachable, focus always visible, no traps.
- [ ] **[Required]** Screen-reader pass over the funnel: labels, error messages,
      and step changes must be announced.
- [ ] **[Required]** Verify colour contrast meets WCAG AA (4.5:1 body, 3:1 large
      text and UI).
- [ ] **[Required]** Confirm `prefers-reduced-motion` is respected.
- [ ] **[Required]** Test on a real phone at 375px width. No horizontal scroll,
      tap targets at least 44px.
- [ ] **[Required]** Lighthouse pass on the homepage and the funnel: Performance,
      Accessibility, Best Practices, and SEO all ≥ 90.
- [ ] **[Verify]** `npm run lint`, `npm run typecheck`, `npm run build`, and
      `npm test` all pass clean.

## 9. Deployment

- [ ] **[Required]** Add the production domain in Vercel with a valid TLS
      certificate, and confirm HTTP redirects to HTTPS.
- [ ] **[Required]** Update the Supabase **Site URL** and **redirect URLs** to
      the production domain.
- [ ] **[Required]** Confirm `www` and apex both resolve to one canonical host.
- [ ] **[Required]** Set up uptime monitoring and error alerting.
- [ ] **[Required]** Confirm Vercel deployment protection settings are correct —
      preview deployments should not be publicly crawlable.

## 10. Operations and handover

- [ ] **[Required]** **Internal user access review**: list every account, its
      roles, and who approved them. Remove anything unrecognised.
- [ ] **[Required]** Confirm every team member uses a unique account. No shared
      logins.
- [ ] **[Required]** Document who responds to a new Hot lead within 15 minutes,
      including out of hours.
- [ ] **[Required]** Document the offboarding process: deactivate the profile,
      revoke roles, review the audit log.
- [ ] **[Required]** Brief the team that seller notes and documents are
      confidential, and that access is logged.
- [ ] **[Required]** Decide the incident process for a suspected data exposure,
      and name who makes the call.
- [ ] **[Verify]** Remove any remaining demo or seed data from the production
      database before launch.

---

## Sign-off

| Area | Owner | Date | Signed |
| --- | --- | --- | --- |
| Legal review (Privacy, Terms, Disclosures) | | | |
| TCPA / SMS compliance | | | |
| Fair-housing review | | | |
| Security and RLS verification | | | |
| Analytics and PII verification | | | |
| Accessibility | | | |
| Operations readiness | | | |
