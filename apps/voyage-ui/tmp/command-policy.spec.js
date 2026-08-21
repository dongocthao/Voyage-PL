import { test, expect } from "@playwright/test";

const APP_URL = "http://127.0.0.1:5174/";

test.setTimeout(60000);

function toolbarButton(page, label) {
  return page.locator("section").getByRole("button", { name: new RegExp(label, "i") }).first();
}

function tabButton(page, labelPattern) {
  return page.locator("main").locator("button").filter({ hasText: labelPattern }).first();
}

function sidebarButton(page, labelPattern) {
  return page.locator("aside").getByRole("button", { name: labelPattern }).first();
}

test("toolbar command policy matches reachable sheet semantics", async ({ page }) => {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await page.waitForTimeout(1500);

  await sidebarButton(page, /^Estimation$/i).click();
  await page.getByRole("button", { name: "Estimate List" }).click();
  await expect(tabButton(page, /Estimate List/i)).toBeVisible();

  await page
    .locator(".estimate-list-form .ant-table-tbody tr")
    .filter({ has: page.locator("td") })
    .first()
    .click();
  await expect(toolbarButton(page, "Open")).toBeEnabled();
  await expect(toolbarButton(page, "Save")).toBeDisabled();
  await expect(toolbarButton(page, "Reload")).toBeDisabled();
  await expect(toolbarButton(page, "To Operation")).toBeDisabled();

  await sidebarButton(page, /^Operation$/i).click();
  await expect(tabButton(page, /Operation List/i)).toBeVisible();
  await expect(toolbarButton(page, "Save")).toBeDisabled();
  await expect(toolbarButton(page, "Reload")).toBeDisabled();
  await expect(toolbarButton(page, "To Operation")).toBeDisabled();

  await page
    .locator(".operation-list-form .ant-table-tbody tr")
    .filter({ has: page.locator("td") })
    .first()
    .click();
  await expect(toolbarButton(page, "Open")).toBeEnabled();
});
