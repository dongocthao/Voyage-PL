import os
from playwright.sync_api import sync_playwright, expect

url = os.environ.get("NEW_VESSEL_URL", "http://127.0.0.1:5198/new-vessel")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    page.goto(url, wait_until="networkidle")

    expect(page.get_by_text("New Vessel").first).to_be_visible()
    expect(page.get_by_text("Bunker profile")).to_be_visible()
    expect(page.get_by_text("Active from")).to_be_visible()
    expect(page.get_by_text("Full")).to_be_visible()
    expect(page.get_by_text("Eco")).to_be_visible()

    page.get_by_role("button", name="OK").click()
    expect(page.get_by_text("M.V. is required.")).to_be_visible()

    browser.close()
