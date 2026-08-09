from playwright.sync_api import sync_playwright, expect
import os


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        ui_base = os.environ.get("UI_BASE", "http://127.0.0.1:5199")
        page.goto(ui_base, wait_until="networkidle")

        expect(page.get_by_text("Cargo").first).to_be_visible()
        expect(page.get_by_role("columnheader", name="Time Zone")).to_be_visible()
        expect(page.get_by_text("+08:00").first).to_be_visible()
        expect(page.locator('input[value*="/"][value*=":"]').first).to_be_visible()

        percent_input = page.locator('input[value="3.8 %"]').first
        percent_input.click()
        percent_input.press("Control+A")
        percent_input.fill("4.2")
        expect(page.locator('input[value="4.2 %"]').first).to_be_visible()

        unit_header = page.get_by_role("columnheader", name="Unit")
        before = unit_header.bounding_box()
        assert before, "Unit header was not measurable before resize"
        page.mouse.move(before["x"] + before["width"] - 2, before["y"] + before["height"] / 2)
        page.mouse.down()
        page.mouse.move(before["x"] + before["width"] + 28, before["y"] + before["height"] / 2)
        page.mouse.up()
        after = unit_header.bounding_box()
        assert after and after["width"] > before["width"], "Unit column did not resize wider"

        browser.close()


if __name__ == "__main__":
    main()
