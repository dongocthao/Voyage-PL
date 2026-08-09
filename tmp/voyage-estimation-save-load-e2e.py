import os
import re

from playwright.sync_api import expect, sync_playwright


UI_URL = os.environ.get("VOYAGE_UI_URL", "http://127.0.0.1:5194/voyage-estimator")
API_BASE = os.environ.get("VITE_API_BASE_URL", "http://127.0.0.1:3001/api")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(UI_URL)
    page.wait_for_load_state("networkidle")

    expect(page.get_by_text("Cargo").first).to_be_visible(timeout=15000)
    expect(page.get_by_text("Port Rotation").first).to_be_visible(timeout=15000)
    page.locator(".ant-select").first.wait_for(state="visible", timeout=15000)
    expect(page.get_by_text("Smoke Profile Vessel").first).to_be_visible(timeout=15000)
    expect(page.get_by_text("Smoke Default Profile").first).to_be_visible(timeout=15000)

    panama = page.get_by_label("PANAMA")
    kiel = page.get_by_label("KIEL")
    if panama.is_checked():
        panama.uncheck()
    if not kiel.is_checked():
        kiel.check()

    with page.expect_response(lambda response: "/api/estimates/voyage-snapshots" in response.url and response.request.method == "POST") as save_response:
        page.get_by_role("button", name=re.compile(r"Save")).click()
    response = save_response.value
    assert response.ok, f"Save failed: {response.status} {response.text()}"
    saved = response.json()
    estimate_id = saved["estimateId"]

    expect(page.get_by_text(re.compile(rf"Saved estimate #{estimate_id}"))).to_be_visible(timeout=15000)

    page.get_by_placeholder("Estimate ID").fill(estimate_id)
    with page.expect_response(lambda response: f"/api/estimates/voyage-snapshots/{estimate_id}" in response.url and response.request.method == "GET") as load_response:
        page.get_by_role("button", name=re.compile(r"Load")).click()
    loaded_response = load_response.value
    assert loaded_response.ok, f"Load failed: {loaded_response.status} {loaded_response.text()}"
    loaded = loaded_response.json()

    expect(page.get_by_text(re.compile(rf"Loaded estimate #{estimate_id}"))).to_be_visible(timeout=15000)
    assert loaded["header"]["routingSuez"] is True
    assert loaded["header"]["routingPanama"] is False
    assert loaded["header"]["routingKiel"] is True
    assert loaded["header"]["performanceMode"] in ("ECO", "FULL")
    assert loaded["header"]["vesselId"]
    assert loaded["header"]["bunkerProfileId"]
    assert loaded.get("result", {}).get("bunkerSummaries"), "Saved estimate should have bunker result rows"

    page.goto(f"{API_BASE}/estimates/voyage-snapshots/{estimate_id}")
    api_loaded = page.locator("body").inner_text()
    assert f'"estimateId":"{estimate_id}"' in api_loaded

    print(f"Voyage Estimation save/load E2E passed for estimate {estimate_id}")
    browser.close()
