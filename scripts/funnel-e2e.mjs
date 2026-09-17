/**
 * End-to-end check of the seller funnel, driven in a real browser.
 *
 * The funnel is the product's core conversion path, so it is verified by
 * walking it the way a homeowner would — at phone width, with validation
 * failures, Back navigation, and a real submission — rather than only by unit
 * tests.
 *
 * Also asserts the two things that must never regress:
 *   - no lead score, tier, or scoring logic reaches the browser
 *   - the saved draft is cleared once the lead is submitted
 *
 * With Supabase unconfigured the submission runs in demo mode: it is scored
 * and the response shape is exercised, but nothing is persisted.
 *
 * Usage:  npm run test:e2e         (builds, starts, tests, stops)
 *         node scripts/funnel-e2e.mjs   (against an already-running server)
 */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const results = [];
const check = (label, ok, detail = "") => {
  results.push({ label, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

/*
 * Prefer Playwright's own resolution; fall back to a preinstalled Chromium
 * when the environment supplies one (PLAYWRIGHT_BROWSERS_PATH), so this runs
 * both locally and in a sandbox without downloading a browser.
 */
const launchOptions = { args: ["--no-sandbox"] };
if (process.env.CHROMIUM_PATH) launchOptions.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launchOptions);
const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone-ish

const consoleErrors = [];
/*
 * Vercel injects the Analytics and Speed Insights scripts at the edge, so they
 * legitimately 404 when the app is self-hosted. Console messages for a failed
 * subresource do not carry the URL, so failing requests are tracked separately
 * by URL and everything else is treated as a real error.
 */
const EXPECTED_OFFLINE = /_vercel\/(insights|speed-insights)/;
const failedRequests = [];
page.on("response", (r) => {
  if (r.status() >= 400 && !EXPECTED_OFFLINE.test(r.url())) {
    failedRequests.push(`${r.status()} ${r.url()}`);
  }
});
page.on("console", (m) => {
  // "Failed to load resource" is covered by the response listener above, and
  // the MIME-type complaint is the same two Vercel scripts being served as the
  // 404 HTML page.
  const text = m.text();
  const isSubresourceNoise =
    /Failed to load resource/.test(text) || (/Refused to execute script/.test(text) && EXPECTED_OFFLINE.test(text));
  if (m.type() === "error" && !isSubresourceNoise) {
    consoleErrors.push(text);
  }
});
page.on("pageerror", (e) => { if (!EXPECTED_OFFLINE.test(String(e))) consoleErrors.push(String(e)); });

// Arrive with campaign parameters, so attribution has something to capture.
await page.goto(`${BASE}/sell-my-house?utm_source=google&utm_medium=cpc&utm_campaign=metro-detroit`);
check("landing page renders", await page.getByRole("heading", { level: 1 }).isVisible());

await page.getByRole("link", { name: "Get Started" }).first().click();
await page.waitForURL("**/sell-my-house/start");
check("landing CTA reaches the intro", page.url().includes("/start"));

await page.getByRole("button", { name: /Get Started|Pick up where/ }).click();
await page.waitForURL("**/sell-my-house/property**");
check("intro advances to the address step", page.url().includes("/property"));
check("progress shows step 1 of 8", await page.getByText("Step 1 of 8").isVisible());

// --- Validation must actually stop an empty step ---------------------
await page.getByRole("button", { name: /Continue/ }).click();
await page.waitForTimeout(300);
check("empty address step is blocked", page.url().includes("/property"),
  "still on the property step");
check("a field-level error is shown", await page.getByText("Enter the city.").isVisible());

// --- Fill the address -------------------------------------------------
await page.locator('input[name="street"]').fill("1428 Elmwood Ave");
await page.locator('input[name="city"]').fill("Royal Oak");
await page.locator('input[name="postalCode"]').fill("48067");
await page.getByRole("button", { name: /Continue/ }).click();
await page.waitForURL("**stage=basics");
check("advances to property basics", page.url().includes("stage=basics"));
check("progress shows step 2 of 8", await page.getByText("Step 2 of 8").isVisible());

// --- Back button must restore answers --------------------------------
await page.getByRole("link", { name: "Back" }).click();
await page.waitForTimeout(400);
check("Back restores the saved street address",
  (await page.locator('input[name="street"]').inputValue()) === "1428 Elmwood Ave");
await page.getByRole("button", { name: /Continue/ }).click();
await page.waitForURL("**stage=basics");

// --- Basics -----------------------------------------------------------
await page.locator('label:has(input[name="propertyType"][value="single_family"])').click();
await page.locator('label:has(input[name="occupancy"][value="vacant"])').click();
await page.getByRole("button", { name: /Continue/ }).click();
await page.waitForURL("**/condition");

// --- Condition --------------------------------------------------------
await page.locator('label:has(input[name="condition"][value="major_repairs"])').click();
await page.locator('label:has(input[name="repairAreas"][value="roof"])').click();
await page.getByRole("button", { name: /Continue/ }).click();
await page.waitForURL("**/situation");

// --- Situation --------------------------------------------------------
await page.locator('label:has(input[name="motivations"][value="inherited"])').click();
await page.getByRole("button", { name: /Continue/ }).click();
await page.waitForURL("**/timeline");

// --- Timeline: conditional payoff question ---------------------------
await page.locator('label:has(input[name="timeline"][value="asap"])').click();
await page.locator('label:has(input[name="decisionMaker"][value="sole"])').click();
check("payoff question is hidden until a balance is confirmed",
  !(await page.getByText("Roughly how much is still owed?").isVisible().catch(() => false)));
await page.locator('label:has(input[name="mortgageStatus"][value="yes"])').click();
await page.waitForTimeout(300);
check("payoff question appears once a balance is confirmed",
  await page.getByText("Roughly how much is still owed?").isVisible());
await page.getByRole("button", { name: /Continue/ }).click();
await page.waitForURL("**/contact-details");

// --- Contact + consent -----------------------------------------------
await page.locator('input[name="firstName"]').fill("Dana");
await page.locator('input[name="lastName"]').fill("Reyes");
await page.locator('input[name="phone"]').fill("(248) 555-0134");
await page.locator('input[name="email"]').fill("dana@example.test");
await page.locator('label:has(input[name="preferredContactMethod"][value="phone"])').click();
await page.locator('label:has(input[name="bestTimeToContact"][value="morning"])').click();

// Consent must be required.
await page.getByRole("button", { name: /Review my answers/ }).click();
await page.waitForTimeout(300);
check("submission is blocked without contact consent", page.url().includes("/contact-details"));
check("consent error is announced",
  await page.getByText("Please agree to be contacted so we can reply.").isVisible());

await page.locator('input[name="contactConsent"]').check();
await page.getByRole("button", { name: /Review my answers/ }).click();
await page.waitForURL("**/review");

// --- Review -----------------------------------------------------------
check("review shows the entered address", await page.getByText(/1428 Elmwood Ave/).isVisible());
check("review shows the seller name", await page.getByText("Dana Reyes").isVisible());
check("review offers per-section editing",
  (await page.getByRole("link", { name: /^Edit/ }).count()) >= 5);

const honeypot = page.locator('input[name="company_website"]');
check("honeypot exists but is out of tab order",
  (await honeypot.count()) === 1 && (await honeypot.getAttribute("tabindex")) === "-1");

await page.getByRole("button", { name: /See My Next Step/ }).click();
await page.waitForURL("**/book-call", { timeout: 15000 });
check("submission reaches the booking step", page.url().includes("/book-call"));

const bodyText = await page.locator("body").innerText();
check("booking step greets the seller by name", bodyText.includes("Dana"));
check("a request-a-call fallback is always offered", bodyText.includes("Request a Call"));

// --- The score must never leak to the browser ------------------------
const html = await page.content();
const leaks = ["lead_score", '"score"', "tier", "hot", "nurture", "rulesVersion"]
  .filter((needle) => html.toLowerCase().includes(needle.toLowerCase()));
check("no score, tier, or scoring logic in the page", leaks.length === 0, leaks.join(", ") || "clean");

const storage = await page.evaluate(() => JSON.stringify(window.sessionStorage.getItem("hsh.submission.v1")));
check("handoff payload carries no score", !/score|tier|reasons/i.test(storage ?? ""));

// --- Thank-you --------------------------------------------------------
await page.getByRole("link", { name: "Continue" }).click();
await page.waitForURL("**/thank-you");
check("thank-you screen renders", await page.getByRole("heading", { level: 1 }).isVisible());
const draftAfter = await page.evaluate(() => window.localStorage.getItem("hsh.funnel.v1"));
check("the draft is cleared after submission", draftAfter === null);

// --- No horizontal scroll at phone width -----------------------------
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("no horizontal scroll at 390px", !overflow);

check("no unexpected console errors during the journey", consoleErrors.length === 0,
  consoleErrors.slice(0, 3).join(" | "));
check("no failed network requests", failedRequests.length === 0,
  failedRequests.slice(0, 3).join(" | ") || "clean");

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
