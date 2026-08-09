from playwright.sync_api import sync_playwright, expect
import os


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        ui_base = os.environ.get("UI_BASE", "http://127.0.0.1:5199")
        page.goto(f"{ui_base}/time-charter", wait_until="networkidle")
        expect(page.get_by_text("time charter1").first).to_be_visible()
        expect(page.get_by_text("Voyage Estimator - Estimation 5011")).not_to_be_visible()
        expect(page.get_by_role("button", name="Save", exact=True)).not_to_be_visible()
        expect(page.get_by_text("Smoke Default Profile")).to_be_visible()

        head_table = page.locator("section").filter(has_text="Head CP").locator(".ant-table").first
        duration = head_table.locator("tbody tr").first.locator("input").nth(3)
        daily_hire = head_table.locator("tbody tr").first.locator("input").nth(4)
        gross_hire = head_table.locator("tbody tr").first.locator("input").nth(5)

        duration.fill("12")
        daily_hire.fill("9,500")
        expect(gross_hire).to_have_value("114,000.0")
        expect(page.get_by_text("9,129.5").first).to_be_visible()
        expect(page.get_by_text("109,554.0").first).to_be_visible()
        expect(page.get_by_text("172,773.5").first).to_be_visible()

        page.get_by_label("Use Multi Duration").first.check()
        page.get_by_label("Use Multi Duration").first.uncheck()

        page.get_by_label("SUEZ").uncheck()
        expect(page.get_by_label("SUEZ")).not_to_be_checked()
        page.get_by_label("KIEL").check()
        expect(page.get_by_label("KIEL")).to_be_checked()

        port_section = page.locator("section").filter(has_text="Port Rotation")
        expect(port_section.get_by_text("Time Zone")).to_be_visible()
        port_values = port_section.locator("input").evaluate_all(
            "(inputs) => inputs.map((input) => input.value)"
        )
        assert "+08:00" in port_values
        assert "2.45" in port_values
        assert "06/07/2020 00:36" in port_values
        expect(port_section.get_by_text("4.45").first).to_be_visible()
        expect(port_section.get_by_text("1.00").first).to_be_visible()
        expect(port_section.get_by_text("Delivery time", exact=True)).to_be_visible()
        expect(port_section.get_by_text("Redelivery time", exact=True)).to_be_visible()
        delivery_row_values = port_section.locator("tbody tr").nth(2).locator("input").evaluate_all(
            "(inputs) => inputs.map((input) => input.value)"
        )
        redelivery_row_values = port_section.locator("tbody tr").nth(3).locator("input").evaluate_all(
            "(inputs) => inputs.map((input) => input.value)"
        )
        assert "06/07/2020 00:36" in delivery_row_values
        assert any("/2020 " in value for value in redelivery_row_values)

        bunker_table = page.locator(".ant-table").filter(has_text="Price / MT").first
        assert bunker_table.locator("tbody tr").count() == 3

        page.get_by_role("button", name="Open detail").first.click()
        expect(page.get_by_text("Misc Revenue")).to_be_visible()
        page.get_by_role("button", name="Cancel").click()
        page.get_by_role("button", name="Open detail").nth(1).click()
        expect(page.get_by_text("Other Expense")).to_be_visible()
        page.get_by_role("button", name="Cancel").click()

        page.get_by_text("Days").last.click()
        page.get_by_text("Hours").last.click()
        expect(page.get_by_role("main").get_by_title("Hours")).to_be_visible()
        page.get_by_text("Port local time").last.click()
        page.get_by_text("UTC").last.click()
        expect(page.get_by_role("main").get_by_text("UTC").first).to_be_visible()

        page.get_by_text("Full").first.click()
        page.get_by_text("Eco").last.click()
        expect(page.get_by_text("Eco")).to_be_visible()

        browser.close()


if __name__ == "__main__":
    main()
