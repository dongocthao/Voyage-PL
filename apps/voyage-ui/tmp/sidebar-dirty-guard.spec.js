import { test, expect } from "@playwright/test";

const APP_URL = "http://127.0.0.1:5174/";

test.setTimeout(60000);

function sidebarButton(page, labelPattern) {
  return page.locator("aside").getByRole("button", { name: labelPattern }).first();
}

function tabButton(page, labelPattern) {
  return page.locator("main").locator("button").filter({ hasText: labelPattern }).first();
}

test("sidebar navigation respects dirty guard for active estimate sheet", async ({ page }) => {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await page.waitForTimeout(1500);

  const routeCheckbox = page.locator("main .ant-checkbox-input").first();
  await expect(routeCheckbox).toBeVisible();
  await routeCheckbox.click();

  await sidebarButton(page, /^Estimation$/i).click();
  await page.getByRole("button", { name: "Estimate List" }).click();
  await expect(page.getByRole("dialog", { name: /Unsaved changes/i })).toBeVisible();
  await expect(page.locator("body")).toContainText(/unsaved changes/i);

  await page.getByRole("button", { name: /^Cancel$/i }).click();
  await expect(page.getByRole("dialog", { name: /Unsaved changes/i })).toBeHidden();
  await expect(tabButton(page, /Voyage Estimation/i)).toBeVisible();
  await expect(tabButton(page, /Estimate List/i)).toBeHidden();

  await sidebarButton(page, /^Estimation$/i).click();
  await page.getByRole("button", { name: "Estimate List" }).click();
  await expect(page.getByRole("dialog", { name: /Unsaved changes/i })).toBeVisible();
  await page.getByRole("button", { name: /Don't Save/i }).click();
  await expect(page.locator(".estimate-list-form")).toBeVisible({ timeout: 15000 });
});
