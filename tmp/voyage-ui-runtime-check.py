import os

from playwright.sync_api import sync_playwright, expect


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(os.environ.get("VOYAGE_UI_URL", "http://127.0.0.1:4173/voyage-estimator"))
    page.wait_for_load_state("networkidle")

    expect(page.get_by_text("Cargo").first).to_be_visible(timeout=10000)
    expect(page.get_by_text("Port Rotation").first).to_be_visible(timeout=10000)
    expect(page.get_by_text("Operation Expense").first).to_be_visible(timeout=10000)

    page.get_by_role("button", name="Save", exact=True).click()
    expect(page.get_by_text("Please fix Voyage Estimation inputs before saving.")).to_be_visible(
        timeout=10000
    )
    expect(page.get_by_text("Vessel is required.")).to_be_visible(timeout=10000)
    expect(page.get_by_text("Bunker Profile is required.")).to_be_visible(timeout=10000)

    browser.close()
