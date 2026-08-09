from playwright.sync_api import sync_playwright, expect
import os


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        ui_base = os.environ.get("UI_BASE", "http://127.0.0.1:5199")
        page.goto(f"{ui_base}/cargo-relet", wait_until="networkidle")

        expect(page.get_by_text("cargo relet1").first).to_be_visible()
        expect(page.get_by_text("Cargo Relet - Estimation W3")).not_to_be_visible()
        expect(page.get_by_role("button", name="Save")).not_to_be_visible()
        expect(page.get_by_role("columnheader", name="Time Zone")).to_be_visible()
        expect(page.locator('input[value*="/"][value*=":"]').first).to_be_visible()

        percent_input = page.locator('input[value="3.8 %"]').first
        percent_input.click()
        percent_input.press("Control+A")
        percent_input.fill("4.2")
        expect(page.locator('input[value="4.2 %"]').first).to_be_visible()

        expect(page.locator('input[value="826,875.0"]').first).to_be_visible()

        sea_margin = page.locator('input[value="2.00"]').last
        sea_margin.click()
        sea_margin.press("Control+A")
        sea_margin.fill("3.00")
        expect(page.locator('input[value="3.00"]').first).to_be_visible()

        browser.close()


if __name__ == "__main__":
    main()
