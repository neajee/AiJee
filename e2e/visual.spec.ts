import { test, expect, type Page } from "@playwright/test";

/**
 * Visual regression for the Web/desktop renderer.
 *
 * The app requires a paired runtime for its authenticated shell, so these
 * tests capture the pages reachable without a session plus any console/runtime
 * errors that surface while rendering.
 */

const ROUTES = ["/", "/connect", "/modal", "/settings", "/servers", "/packages"];

const CONSOLE_IGNORE = [
  /Download the React DevTools/,
  /favicon/i,
  /Failed to load resource: the server responded with a status of 4\d\d/,
  /Failed to fetch/i,
  /ERR_CONNECTION/i,
  /websocket/i,
];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (CONSOLE_IGNORE.some((re) => re.test(text))) return;
    errors.push(text);
  });
  page.on("pageerror", (err) => {
    if (CONSOLE_IGNORE.some((re) => re.test(err.message))) return;
    errors.push(err.message);
  });
  return errors;
}

for (const route of ROUTES) {
  test(`renders ${route}`, async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto(route, { waitUntil: "load" });
    expect(response?.status(), `${route} should respond 200`).toBe(200);
    await page.waitForTimeout(1200);

    const name = route === "/" ? "home" : route.replace(/^\//, "").replaceAll("/", "-");
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });

    expect(errors, `console errors on ${route}`).toEqual([]);
  });
}
