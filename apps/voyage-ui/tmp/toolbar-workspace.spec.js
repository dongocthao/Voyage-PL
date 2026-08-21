import { test, expect } from '@playwright/test';

const APP_URL = 'http://127.0.0.1:5174/';

test.setTimeout(60000);

function toolbarButton(page, label) {
  return page.locator('section').getByRole('button', { name: new RegExp(label, 'i') }).first();
}

function tabButton(page, labelPattern) {
  return page.locator('main').locator('button').filter({ hasText: labelPattern }).first();
}

function sidebarButton(page, labelPattern) {
  return page.locator('aside').getByRole('button', { name: labelPattern }).first();
}

test('multi-sheet workspace toolbar follows active tab', async ({ page }) => {
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(1500);

  await sidebarButton(page, /^Estimation$/i).click();
  await page.getByRole('button', { name: 'Estimate List' }).click();
  await expect(tabButton(page, /Estimate List/)).toBeVisible();

  await page
    .locator('.estimate-list-form .ant-table-tbody tr')
    .filter({ has: page.locator('td') })
    .first()
    .click();
  await toolbarButton(page, 'Open').click();
  await expect(tabButton(page, /Voyage Estimation \d+|Time Charter \d+|Cargo Relet \d+/)).toBeVisible();

  const estimateTab = tabButton(page, /Voyage Estimation \d+|Time Charter \d+|Cargo Relet \d+/);
  await estimateTab.click();
  await expect(toolbarButton(page, 'Save')).toBeEnabled();
  await expect(toolbarButton(page, 'Reload')).toBeEnabled({ timeout: 15000 });
  await expect(toolbarButton(page, 'To Operation')).toBeEnabled();
  await toolbarButton(page, 'To Operation').click();
  await expect(tabButton(page, /Operation /)).toBeVisible();

  const operationTab = tabButton(page, /Operation /);
  await operationTab.click();
  await expect(toolbarButton(page, 'Delete sheet')).toBeDisabled();

  const estimateListTab = await tabButton(page, /Estimate List/);
  await estimateListTab.click();
  await expect(toolbarButton(page, 'Open')).toBeEnabled();
});
