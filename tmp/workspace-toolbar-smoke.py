from playwright.sync_api import sync_playwright, expect
import os


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        ui_base = os.environ.get("UI_BASE", "http://127.0.0.1:5199")
        page.goto(ui_base, wait_until="networkidle")

        expect(page.get_by_role("button", name="Save", exact=True)).to_be_visible()
        expect(page.get_by_text("voyage1").first).to_be_visible()
        expect(page.get_by_text("Voyage Estimator - Estimation 5011")).not_to_be_visible()

        page.get_by_role("button", name="Delete sheet").click()
        expect(page.get_by_role("button", name="Save", exact=True)).to_be_disabled()
        page.get_by_role("button", name="Delete sheet").click()
        expect(page.get_by_text("There is no sheet to delete.")).to_be_visible()

        page.get_by_role("button", name="Open", exact=True).click()
        expect(page.get_by_text("There is no sheet to open.")).to_be_visible()

        page.get_by_role("button", name="New Sheet").click()
        expect(page.get_by_text("voyage1").first).to_be_visible()

        page.get_by_role("button", name="To Operation").click()
        expect(page.get_by_text("Operation").first).to_be_visible()

        browser.close()


if __name__ == "__main__":
    main()
