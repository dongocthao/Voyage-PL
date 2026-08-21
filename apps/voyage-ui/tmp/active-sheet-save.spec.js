import { test, expect } from "@playwright/test";
import {
  cloneVoyageEstimate,
  deleteEstimate,
  deleteOperation,
  findOperationByEstimate,
} from "./test-helpers.js";

const APP_URL = "http://127.0.0.1:5174/";

test.setTimeout(90000);

function toolbarButton(page, label) {
  return page.locator("section").getByRole("button", { name: new RegExp(label, "i") }).first();
}

function tabButton(page, labelPattern) {
  return page.locator("main").locator("button").filter({ hasText: labelPattern }).first();
}

function sidebarButton(page, labelPattern) {
  return page.locator("aside").getByRole("button", { name: labelPattern }).first();
}

test("save command acts on the active operation sheet after switching tabs", async ({
  page,
  request,
}) => {
  const estimate = await cloneVoyageEstimate(request, "1");
  let operationId;

  try {
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.waitForTimeout(1500);

    await sidebarButton(page, /^Estimation$/i).click();
    await page.getByRole("button", { name: "Estimate List" }).click();
    await expect(tabButton(page, /Estimate List/)).toBeVisible();

    await page
      .locator(".estimate-list-form .ant-table-tbody tr")
      .filter({ has: page.locator("td") })
      .first()
      .click();

    await toolbarButton(page, "Open").click();
    const estimateTab = tabButton(page, new RegExp(`Voyage Estimation ${estimate.estimateId}`));
    await expect(estimateTab).toBeVisible();
    await estimateTab.click();
    await expect(toolbarButton(page, "Reload")).toBeEnabled({ timeout: 15000 });

    await toolbarButton(page, "To Operation").click();
    const operationTab = tabButton(page, /Operation E/);
    await expect(operationTab).toBeVisible({ timeout: 15000 });
    await operationTab.click();

    await estimateTab.click();
    await operationTab.click();

    await toolbarButton(page, "Save").click();

    await expect
      .poll(async () => {
        const operation = await findOperationByEstimate(request, estimate.estimateId);
        if (operation.exists) {
          operationId = operation.operationId;
          return operation.exists;
        }
        return false;
      }, { timeout: 15000 })
      .toBe(true);

    await expect(page.locator("body")).toContainText(/Operation \d+ saved\./i);
  } finally {
    if (operationId) {
      await deleteOperation(request, operationId);
    }
    await deleteEstimate(request, estimate.estimateId).catch(() => undefined);
  }
});
